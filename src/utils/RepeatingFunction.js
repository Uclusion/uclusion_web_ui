/**
 * When presented a function, an interval, and a maxSequentialErrorCount, guarantees the following

 * 1) The first invocation of the function will happen immediately
 * 2) Every interval period one of two things will happen
 *    a) If the previous invocation of the function is still running,
 *       this interval is skipped
 *    b) Otherwise, a new invocation of the function is made
 * 3) If an error occurs during invocation:
 *    1 is added to the error count AND
 *    If the error count >= maxSequentialErrorCount
 *      the repeating function shuts down and the function will not be called again
 *    Otherwise, the error count is set to 0
 */


export class RepeatingFunction {

  constructor (func, interval, maxSequentialErrorCount) {
    this.interval = interval;
    this.intervalID = null;
    this.running = false;
    this.sequentialErrors = 0;
    this.runner = async () => {
      if (!this.running){
        this.running = true;
        try {
          await func();
          this.sequentialErrors = 0;
        }catch(error) {
          this.sequentialErrors += 1;
          if (this.sequentialErrors >= maxSequentialErrorCount) {
            clearInterval(this.intervalID);
          }
        }
        this.running = false;
      }
    }
  }

  async start() {
    this.intervalID = setInterval(this.runner, this.interval);
    await this.runner();
  }

}