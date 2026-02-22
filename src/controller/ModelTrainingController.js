export class ModelController {
    #modelView;
    #taskService;
    #events;
    #alreadyTrained = false;

    constructor({ modelView, taskService, events }) {
        this.#modelView = modelView;
        this.#taskService = taskService;
        this.#events = events;
        this.init();
    }

    static init(deps) {
        return new ModelController(deps);
    }

    async init() {
        this.setupCallbacks();
    }

    setupCallbacks() {
        this.#modelView.registerTrainModelCallback(this.handleTrainModel.bind(this));
        this.#modelView.registerRunRecommendationCallback(this.handleRunRecommendation.bind(this));

        this.#events.onProgressUpdate((progress) => {
            this.#modelView.updateTrainingProgress(progress);
        });

        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
            this.#modelView.enableRecommendButton();
        });

        this.#events.onRecommendationsReady((payload) => {
            this.#modelView.renderRecommendations(payload.recommendations);
        });
    }

    async handleTrainModel() {
        const tasks = await this.#taskService.getTasks();
        this.#events.dispatchTrainModel(tasks);
    }

    async handleRunRecommendation() {
        const userTaskInput = this.#modelView.getUserTaskInput();
        // Chama o método estático da classe Events
        this.#events.dispatchRecommend(userTaskInput);
    }
}