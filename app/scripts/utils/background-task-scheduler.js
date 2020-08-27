class BackgroundTaskScheduler {
  constructor() {
    this.taskList = [];
    this.taskHandle = null;
    this.requestIdleCallbackTimeout = 300;
  }

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

  runTaskQueue(deadline) {
    while (
      (deadline.timeRemaining() > 0 || deadline.didTimeout) &&
      this.taskList.length
    ) {
      const task = this.taskList.shift();

      if (task.data === null) {
        task.handler();
      } else {
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
