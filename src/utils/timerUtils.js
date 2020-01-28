/**
 * Calls the execFunction every waitTime for up to maxIterations time.
 * The first iteration occurs after 1 wait time period has lapsed
 * @param waitTime the time in millis between executions of the check function - note this is just the whitespace between,
 * the timer won't start until the cbeckFunction finishes
 * @param maxIterations, the maximum number of times to call the check function
 * @param execFunction a function that is executed every waitTime milliseconds unless the timer is cleared
 * @returns a function that if called stops the timer
 */
export function startTimerChain(waitTime, maxIterations, execFunction) {
  let iterCount = 0;
  let timeout = null;

  function callFunc() {
    execFunction();
    if (iterCount >= maxIterations) {
      return;
    }
    iterCount += 1;
    timeout = setTimeout(callFunc, waitTime);
  }

  timeout = setTimeout(callFunc, waitTime);
  return () => {
    clearTimeout(timeout);
  };
}
