import { View } from './View.js';

export class ModelView extends View {
    // Seletores dos novos campos de entrada
    #complexityInput = document.querySelector('#complexity');
    #uncertaintyInput = document.querySelector('#uncertainty');
    #techDebtInput = document.querySelector('#techDebt');
    
    // Botões e containers
    #trainModelBtn = document.querySelector('#trainModelBtn');
    #runRecommendationBtn = document.querySelector('#runRecommendationBtn');
    #resultsDiv = document.querySelector('#resultsDiv');
    
    #onTrainModel;
    #onRunRecommendation;

    constructor() {
        super();
        this.attachEventListeners();
    }

    registerTrainModelCallback(callback) {
        this.#onTrainModel = callback;
    }

    registerRunRecommendationCallback(callback) {
        this.#onRunRecommendation = callback;
    }

    attachEventListeners() {
        this.#trainModelBtn.addEventListener('click', () => {
            this.#onTrainModel();
        });

        this.#runRecommendationBtn.addEventListener('click', () => {
            this.#onRunRecommendation();
        });
    }

    // Método que o Controller usa para ler o que você digitou
    getUserTaskInput() {
        return {
            complexity: Number(this.#complexityInput.value),
            uncertainty: Number(this.#uncertaintyInput.value),
            technical_debt: Number(this.#techDebtInput.value)
        };
    }

    enableRecommendButton() {
        this.#runRecommendationBtn.disabled = false;
    }

    updateTrainingProgress(progress) {
        this.#trainModelBtn.disabled = true;
        this.#trainModelBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Treinando (${progress.toFixed(0)}%)`;

        if (progress === 100) {
            this.#trainModelBtn.disabled = false;
            this.#trainModelBtn.innerHTML = '<i class="bi bi-cpu"></i> Treinar Novo Modelo';
        }
    }

    // Exibe as probabilidades que vieram do Worker
    renderRecommendations(results) {
        // Ordena pela maior probabilidade para destacar o vencedor
        const sorted = [...results].sort((a, b) => b.probability - a.probability);
        
        const html = sorted.map(res => `
            <div class="mb-2">
                <div class="d-flex justify-content-between">
                    <span><strong>${res.points} SP</strong></span>
                    <span>${res.probability}%</span>
                </div>
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar ${res.probability > 50 ? 'bg-success' : 'bg-primary'}" 
                         role="progressbar" style="width: ${res.probability}%"></div>
                </div>
            </div>
        `).join('');

        this.#resultsDiv.innerHTML = `<h5>Estimativa de Esforço:</h5>${html}`;
    }
}