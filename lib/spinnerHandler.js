import ora from 'ora';

class SpinnerHandler {
  constructor() {
    this.spinner = ora({
      text: 'Starting...',
      spinner: 'dots',
      interval: 50,
      stream: process.stdout
    });
  }

  /**
   * Initialize the spinner with optimized settings
   * @param {string} text - Initial spinner text
   */
  start(text) {
    if (!this.spinner.isSpinning) {
      this.spinner.text = text;
      this.spinner.start();
    } else {
      this.updateText(text);
    }
  }

  /**
   * Queue a text update to avoid blocking
   * @param {string} text - New spinner text
   */
  updateText(text) {
    if (this.spinner.isSpinning) {
      this.spinner.text = text;
    }
  }

  /**
   * Stop the spinner with success message
   * @param {string} text - Success message
   */
  succeed(text) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed(text);
    }
  }

  /**
   * Stop the spinner with failure message
   * @param {string} text - Failure message
   */
  fail(text) {
    if (this.spinner.isSpinning) {
      this.spinner.fail(text);
    }
  }

  /**
   * Stop the spinner without any message
   */
  stop() {
    if (this.spinner.isSpinning) {
      this.spinner.stop();
    }
  }

  clear() {
    this.spinner.clear();
  }

  // Create a wrapper for async operations that updates the spinner
  async wrap(operation, { startText, successText, failText }) {
    this.start(startText);
    
    try {
      const result = await operation();
      this.succeed(successText);
      return result;
    } catch (error) {
      this.fail(failText || `Error: ${error.message}`);
      throw error;
    }
  }
}

export default new SpinnerHandler(); 