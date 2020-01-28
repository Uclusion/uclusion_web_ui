/**
 * Calls the checkFunction every waitTime for up to maxIterations time.
 * The first iteration occurs after 1 wait time period has lapsed
 * If the checkFunction returns TRUE, the chain terminates
 * @param waitTime the time in millis between executions of the check function - note this is just the whitespace between,
 * the timer won't start until the cbeckFunction finishes
 * @param maxIterations, the maximum number of times to call the check function
 * @param checkFunction a function that if returns a "true" value will stop iteration
 * @returns pid timer that can be cancelled if needed
 */
export function startTimerChain(waitTime, maxIterations, checkFunction) {
  let iterCount = 0;
  let timeout = null;

  function callFunc() {
    const result = checkFunction();
    if (result || iterCount >= maxIterations) {
      return;
    }
    iterCount += 1;
    timeout = setTimeout(callFunc, waitTime);
  }

  timeout = setTimeout(callFunc, waitTime);
  return timeout;
}
