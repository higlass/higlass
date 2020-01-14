class BackgroundTaskScheduler {
  constructor() {
    this.taskList = [];
    this.taskHandle = null;
  }


  enqueueTask(taskHandler, taskData) {
    this.taskList.push({
      handler: taskHandler,
      data: taskData
    });


    if (!this.taskHandle) {
      this.taskHandle = requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 500 });
    }
  }

  runTaskQueue(deadline) {
    // console.log(this);
    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && this.taskList.length) {
      const task = this.taskList.shift();

      if (task.data === null) {
        task.handler();
      } else {
        task.handler(task.data);
      }
    }

    if (this.taskList.length) {
      this.taskHandle = requestIdleCallback(this.runTaskQueue.bind(this), { timeout: 500 });
    } else {
      this.taskHandle = 0;
    }
  }
}

const backgroundTaskScheduler = new BackgroundTaskScheduler();

export default backgroundTaskScheduler;
