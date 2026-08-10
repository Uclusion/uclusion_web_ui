/**
 * J-all-394: dev-only render profiling utility.
 *
 * COMMITTED INERT per Q-all-400 O-3: ACTIVE is false and no call sites exist. To run a
 * new investigation, flip ACTIVE to true and add the call sites below (remove them and
 * flip back before committing):
 *
 *   import { RenderCensus, startEventTimingWatch, markSync } from '../utils/renderProfiler';
 *   // 1. Wrap a suspect subtree: <RenderCensus id="Inbox"><Inbox /></RenderCensus>
 *   // 2. Call startEventTimingWatch() once (e.g. in App mount) to log slow input
 *   //    events and long tasks, correlated against sync activity markers.
 *   // 3. Call markSync('start'/'end') at the version refresh entry/exit to attribute
 *   //    slow keystrokes to background sync churn.
 *   // In the console: window.__renderCensus() dumps per-subtree render counts and
 *   // durations; window.__renderCensusReset() clears them between scenarios.
 *
 * No dependencies: React's built-in <Profiler> plus the Event Timing, Long Task,
 * and User Timing APIs. Everything no-ops when ACTIVE is false.
 */
import React from 'react';

const ACTIVE = false;

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
  if (!ACTIVE) {
    return children;
  }
  return React.createElement(React.Profiler, { id, onRender }, children);
}

export function markSync(edge) {
  if (!ACTIVE) {
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

export function startEventTimingWatch() {
  if (!ACTIVE || window.__eventTimingWatchArmed) {
    return;
  }
  window.__eventTimingWatchArmed = true;
  // Input events whose processing blocks the main thread long enough to feel laggy
  try {
    const eventObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration >= 56) {
          console.info(`[renderProfiler] slow ${entry.name} ${Math.round(entry.duration)}ms ` +
            `(processing ${Math.round(entry.processingEnd - entry.processingStart)}ms)` +
            `${nearSync() ? ' DURING-SYNC' : ''}`);
        }
      });
    });
    eventObserver.observe({ type: 'event', durationThreshold: 56, buffered: true });
  } catch (ignored) {
    console.info('[renderProfiler] event timing not supported');
  }
  try {
    const taskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.info(`[renderProfiler] long task ${Math.round(entry.duration)}ms` +
          `${nearSync() ? ' DURING-SYNC' : ''}`);
      });
    });
    taskObserver.observe({ type: 'longtask', buffered: true });
  } catch (ignored) {
    console.info('[renderProfiler] long task timing not supported');
  }
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
}
