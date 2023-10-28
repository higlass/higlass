/**
 * @template T
 * @typedef DataTask
 * @property {T} data
 * @property {(data: T) => void} handler
 * @property {string=} trackId
 */

/**
 * @typedef NullDataTask
 * @property {null} data
 * @property {() => void} handler
 * @property {string=} trackId
 */

/** @typedef {DataTask<any> | NullDataTask} Task */

/**
 * @param {Task} task
 * @return {task is NullDataTask}
 */
function isNullDataTask(task) {
  return task.data === null;
}

/**
 */
class BackgroundTaskScheduler {
  constructor() {
    /** @type {Task[]} */
    this.taskList = [];
    this.taskHandle = null;
    this.requestIdleCallbackTimeout = 300;
  }

  /**
   * @template T
   * @overload
   * @param {(data: T) => void} taskHandler
   * @param {T} taskData
   * @param {string | null=} trackId
   * @return {void}
   */
  /**
   * If `taskData` is `null` the `taskHandler` will eventaully be called without any arguments.
   *
   * @overload
   * @param {() => void} taskHandler
   * @param {null} taskData
   * @param {string | null=} trackId
   * @return {void}
   */
  /**
   * @param {(data: any) => void} taskHandler
   * @param {any} taskData
   * @param {string | null} trackId
   * @return {void}
   */
  enqueueTask(taskHandler, taskData, trackId = null) {
    if (trackId === null) {
      this.taskList.push({
        handler: taskHandler,
        data: taskData,
      });
    } else {
      // If a trackId is given we delete all previous tasks in the taskList of the same track
      // We only want to rerender the latest version of a track
      this.taskList = this.taskList.filter((task) => task.trackId !== trackId);

      this.taskList.push({
        handler: taskHandler,
        data: taskData,
        trackId,
      });
    }

    if (!this.taskHandle) {
      this.taskHandle = requestIdleCallback(this.runTaskQueue.bind(this), {
        timeout: this.requestIdleCallbackTimeout,
      });
    }
  }

  /**
   * @param {{ timeRemaining(): number, didTimeout: boolean }} deadline
   */
  runTaskQueue(deadline) {
    while (
      (deadline.timeRemaining() > 0 || deadline.didTimeout) &&
      this.taskList.length
    ) {
      const task = this.taskList.shift();

      if (task && isNullDataTask(task)) {
        task.handler();
      } else if (task) {
        task.handler(task.data);
      }
    }

    if (this.taskList.length) {
      this.taskHandle = requestIdleCallback(this.runTaskQueue.bind(this), {
        timeout: this.requestIdleCallbackTimeout,
      });
    } else {
      this.taskHandle = 0;
    }
  }
}

const backgroundTaskScheduler = new BackgroundTaskScheduler();

export default backgroundTaskScheduler;
