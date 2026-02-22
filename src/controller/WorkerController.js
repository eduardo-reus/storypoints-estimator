import { workerEvents } from "../events/constants.js";

export class WorkerController {
    #worker;
    #events;
    #alreadyTrained = false;

    constructor({ worker, events }) {
        this.#worker = worker;
        this.#events = events;
        this.#alreadyTrained = false;
        this.init();
    }

    async init() {
        this.setupCallbacks();
    }

    static init(deps) {
        return new WorkerController(deps);
    }

    setupCallbacks() {
        this.#events.onTrainModel((tasks) => {
            this.#alreadyTrained = false;
            this.#worker.postMessage({ action: workerEvents.trainModel, tasks });
        });

        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
        });

        this.#events.onRecommend((userTask) => {
            if (!this.#alreadyTrained) return;
            this.#worker.postMessage({ action: workerEvents.recommend, userTask });
        });

        this.#worker.onmessage = (event) => {
            const { type, ...payload } = event.data;

            if (type === workerEvents.trainingLog) {
                this.#events.dispatchTFVisLogs(payload);
            }

            if (type === workerEvents.progressUpdate) {
                this.#events.dispatchProgressUpdate(payload.progress);
            }

            if (type === workerEvents.trainingComplete) {
                this.#events.dispatchTrainingComplete(payload);
            }

            // GARANTIA: Dispara o evento de recomendação pronta
            if (type === workerEvents.recommend) {
                this.#events.dispatchRecommendationsReady(payload);
            }
        };
    }
}