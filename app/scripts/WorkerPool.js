export class WorkerPool {
    constructor(workerSrc, numWorkers = 4) {
        this.workQueue = [];
        this.freeWorkers = [];
        this.busyWorkers = [];
        let MyWorker = require("worker?inline!./worker.js");

        for (let i = 0; i < numWorkers; i++) {
            
            this.freeWorkers.push(new MyWorker(workerSrc));
        }
    }

    submitMessage(message, data, done) {
        //
        let eventListener = function(e) {
            done(e)
        }

        this.workQueue.push([message, data, eventListener])
        this.startWork();
    }

    startWork() {
        if (this.freeWorkers.length > 0 && this.workQueue.length > 0) {
            let workPacket = this.workQueue.shift();
            let currentWorker = this.freeWorkers.pop();
            
            currentWorker.postMessage(workPacket[0],
                                      workPacket[1]);
            currentWorker.onmessage = (e) => {
                this.freeWorkers.push(currentWorker);
                workPacket[2](e);
                this.startWork();
            };
        }
    }

}
