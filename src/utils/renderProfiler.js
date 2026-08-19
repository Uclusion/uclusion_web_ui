/**
 * J-all-394 / B-all-569: render profiling utility, permanently wired.
 *
 * Per Q-all-452 O-4/O-5 this supersedes the old commit-inert convention (Q-all-400 O-3):
 * the call sites stay in the tree permanently - RenderCensus wraps Root, Inbox, Sidebar,
 * and CommentBox; startEventTimingWatch arms at App mount; markSync brackets the version
 * refresh - and everything gates on a runtime switch instead of a compile-time flag.
 * Switched off (the default), the whole utility costs a boolean check per call and
 * collects nothing, so it is harmless in production.
 *
 * To collect data in any environment:
 *   window.__uclusionProfiler('on')   // persists in localStorage across reloads
 *   ...reproduce the problem...
 *   window.__renderCensus()           // per-subtree render table (see caveat below)
 *   window.__renderCensusReset()      // clear between scenarios
 *   window.__uclusionProfiler('off')  // disarm and stop persisting
 * [renderProfiler] console lines stream long tasks and slow input events, tagged
 * DURING-SYNC when they overlap or closely follow a version refresh.
 *
 * Census caveat: production react-dom compiles out React.Profiler timing, so the render
 * census only fills on a development build; production builds still provide the long
 * task, slow input, and sync correlation channels. Census counting also starts on each
 * subtree's first render after arming, not at the moment of arming.
 */
import React from 'react';

const STORAGE_KEY = 'uclusionProfiler';

function storedOn() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch (ignored) {
    return false;
  }
}

let active = storedOn();
let armedObservers = [];
let censusTimer = undefined;

// Optional data sink so an agent can harvest without a browser extension: set
// localStorage uclusionProfilerSink to e.g. 'http://localhost:8123/' and every
// emitted line plus periodic census snapshots beacon there (fire and forget).
function emit(line) {
  console.info(line);
  try {
    const sink = window.localStorage.getItem('uclusionProfilerSink');
    if (sink && navigator.sendBeacon) {
      navigator.sendBeacon(sink, line);
    }
  } catch (ignored) {
    // sink is best effort only
  }
}

// Kept on window so webpack hot reloads share one registry - a module-local object
// splits the census between the old closure and the reloaded module
const census = typeof window !== 'undefined'
  ? (window.__renderCensusData = window.__renderCensusData || {})
  : {};
let syncDepth = 0;
let lastSyncEndedAt = 0;

function onRender(id, phase, actualDuration) {
  const entry = census[id] || (census[id] = { renders: 0, mounts: 0, totalMs: 0, worstMs: 0, duringSyncMs: 0 });
  entry.renders += 1;
  if (phase === 'mount') {
    entry.mounts += 1;
  }
  entry.totalMs += actualDuration;
  if (actualDuration > entry.worstMs) {
    entry.worstMs = actualDuration;
  }
  if (syncDepth > 0) {
    entry.duringSyncMs += actualDuration;
  }
}

export function RenderCensus(props) {
  const { id, children } = props;
  if (!active) {
    return children;
  }
  return React.createElement(React.Profiler, { id, onRender }, children);
}

// T-all-2485: named timers for the non-render work on the push stack. The census only sees React,
// and the long task API reports duration with no attribution, so these labels are the only way to
// say which suspect owns the blocking time. Off, they cost one boolean check.
const timers = typeof window !== 'undefined'
  ? (window.__uclusionTimerData = window.__uclusionTimerData || {})
  : {};

function recordTimer(label, elapsed) {
  const entry = timers[label] || (timers[label] = { calls: 0, totalMs: 0, worstMs: 0, duringSyncMs: 0 });
  entry.calls += 1;
  entry.totalMs += elapsed;
  if (elapsed > entry.worstMs) {
    entry.worstMs = elapsed;
  }
  if (syncDepth > 0) {
    entry.duringSyncMs += elapsed;
  }
}

/** Times a synchronous span. Returns fn()'s value untouched, and is a no-op when disarmed. */
export function timeSpan(label, fn) {
  if (!active) {
    return fn();
  }
  const started = performance.now();
  try {
    return fn();
  } finally {
    recordTimer(label, performance.now() - started);
  }
}

/** Times a promise-returning span, recording when it settles either way. */
export function timeSpanAsync(label, fn) {
  if (!active) {
    return fn();
  }
  const started = performance.now();
  const stop = () => recordTimer(label, performance.now() - started);
  return Promise.resolve(fn()).then((value) => {
    stop();
    return value;
  }, (error) => {
    stop();
    throw error;
  });
}

export function markSync(edge) {
  if (!active) {
    return;
  }
  if (edge === 'start') {
    syncDepth += 1;
    performance.mark('uclusion-sync-start');
  } else {
    syncDepth = Math.max(0, syncDepth - 1);
    lastSyncEndedAt = performance.now();
    performance.mark('uclusion-sync-end');
  }
}

function nearSync() {
  return syncDepth > 0 || performance.now() - lastSyncEndedAt < 500;
}

function arm() {
  if (armedObservers.length > 0) {
    return;
  }
  // Input events whose processing blocks the main thread long enough to feel laggy
  try {
    const eventObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration >= 56) {
          emit(`[renderProfiler] slow ${entry.name} ${Math.round(entry.duration)}ms ` +
            `(processing ${Math.round(entry.processingEnd - entry.processingStart)}ms)` +
            `${nearSync() ? ' DURING-SYNC' : ''}`);
        }
      });
    });
    eventObserver.observe({ type: 'event', durationThreshold: 56, buffered: true });
    armedObservers.push(eventObserver);
  } catch (ignored) {
    console.info('[renderProfiler] event timing not supported');
  }
  try {
    const taskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        emit(`[renderProfiler] long task ${Math.round(entry.duration)}ms` +
          `${nearSync() ? ' DURING-SYNC' : ''}`);
      });
    });
    taskObserver.observe({ type: 'longtask', buffered: true });
    armedObservers.push(taskObserver);
  } catch (ignored) {
    console.info('[renderProfiler] long task timing not supported');
  }
  emit('[renderProfiler] armed');
  if (!censusTimer) {
    censusTimer = setInterval(() => {
      try {
        if (window.localStorage.getItem('uclusionProfilerSink')) {
          emit('[renderProfiler] census ' + JSON.stringify(census));
          emit('[renderProfiler] timers ' + JSON.stringify(timers));
        }
      } catch (ignored) {
        // best effort
      }
    }, 30000);
  }
}

function disarm() {
  armedObservers.forEach((observer) => observer.disconnect());
  armedObservers = [];
  if (censusTimer) {
    clearInterval(censusTimer);
    censusTimer = undefined;
  }
  emit('[renderProfiler] disarmed');
}

/** Arms the observers when the profiler was switched on; call once at App mount. */
export function startEventTimingWatch() {
  if (active) {
    arm();
  }
}

if (typeof window !== 'undefined') {
  window.__uclusionProfiler = (mode) => {
    try {
      if (mode === 'on') {
        window.localStorage.setItem(STORAGE_KEY, 'on');
        active = true;
        arm();
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        active = false;
        disarm();
      }
    } catch (ignored) {
      console.info('[renderProfiler] localStorage unavailable; setting applies to this page only');
      active = mode === 'on';
      if (active) { arm(); } else { disarm(); }
    }
    return active ? 'on' : 'off';
  };
  window.__renderCensus = () => {
    const rows = Object.keys(census).map((id) => ({
      subtree: id,
      renders: census[id].renders,
      mounts: census[id].mounts,
      totalMs: Math.round(census[id].totalMs),
      worstMs: Math.round(census[id].worstMs),
      duringSyncMs: Math.round(census[id].duringSyncMs),
    })).sort((a, b) => b.totalMs - a.totalMs);
    console.table(rows);
    return rows;
  };
  window.__renderCensusReset = () => {
    Object.keys(census).forEach((id) => delete census[id]);
    console.info('[renderProfiler] census reset');
  };
  window.__uclusionTimers = () => {
    const rows = Object.keys(timers).map((label) => ({
      span: label,
      calls: timers[label].calls,
      totalMs: Math.round(timers[label].totalMs),
      worstMs: Math.round(timers[label].worstMs),
      duringSyncMs: Math.round(timers[label].duringSyncMs),
    })).sort((a, b) => b.totalMs - a.totalMs);
    console.table(rows);
    return rows;
  };
  window.__uclusionTimersReset = () => {
    Object.keys(timers).forEach((label) => delete timers[label]);
    console.info('[renderProfiler] timers reset');
  };
}
