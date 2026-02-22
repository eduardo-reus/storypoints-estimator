import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

let _model = null;

// 1. Definição da Escala de Fibonacci (Nossas 6 Classes)
const FIBONACCI = [1, 2, 3, 5, 8, 13];

// 2. Normalização dos Inputs (Valores Brutos -> 0 a 1)
// Complexidade: 1-10 | Incerteza e Dívida: 1-5
const normalize = (val, max) => val / max;

// 3. Preparação dos Dados para o TensorFlow
function prepareData(tasks) {
    const inputs = [];
    const outputs = [];

    tasks.forEach(task => {
        // Criando o vetor de entrada [Complexidade, Incerteza, Dívida Técnica]
        inputs.push([
            normalize(task.complexity, 10),
            normalize(task.uncertainty, 5),
            normalize(task.technical_debt, 5)
        ]);

        // Criando a saída One-Hot para Fibonacci
        // Ex: se pontos = 5, vira [0, 0, 0, 1, 0, 0]
        const outputLine = new Array(FIBONACCI.length).fill(0);
        const index = FIBONACCI.indexOf(task.points);
        if (index !== -1) outputLine[index] = 1;
        outputs.push(outputLine);
    });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(outputs),
        inputDim: 3,
        outputDim: FIBONACCI.length
    };
}

// 4. Arquitetura da Rede Neural (Baseada na sua sugestão de 80 neurônios)
async function trainModel({ users }) {
    // No seu projeto, as tasks agora são carregadas aqui
    const response = await fetch('/data/tasks.json');
    const tasks = await response.json();

    const data = prepareData(tasks);
    
    const model = tf.sequential();

    // Camada de Entrada com seus 80 neurônios e ReLU
    model.add(tf.layers.dense({
        inputShape: [data.inputDim],
        units: 80,
        activation: 'relu'
    }));

    // Camada Oculta para refinamento
    model.add(tf.layers.dense({
        units: 40,
        activation: 'relu'
    }));

    // Camada de Saída: 6 neurônios (FIBONACCI) com Softmax
    model.add(tf.layers.dense({
        units: data.outputDim,
        activation: 'softmax'
    }));

    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    // Treinamento
    await model.fit(data.xs, data.ys, {
        epochs: 100,
        batchSize: 16,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                postMessage({
                    type: workerEvents.trainingLog,
                    epoch,
                    loss: logs.loss,
                    accuracy: logs.acc
                });
            }
        }
    });

    _model = model;
    postMessage({ type: workerEvents.trainingComplete });
}

// 5. Lógica de Predição (Estimativa)
function recommend({ userTask }) {
    if (!_model) return;

    // Normaliza a nova tarefa que veio da UI
    const input = tf.tensor2d([[
        normalize(userTask.complexity, 10),
        normalize(userTask.uncertainty, 5),
        normalize(userTask.technical_debt, 5)
    ]]);

    const prediction = _model.predict(input);
    const scores = prediction.dataSync(); // Probabilidades [p1, p2, p3, p5, p8, p13]
    
    // Envia os resultados de volta para a UI
    const results = FIBONACCI.map((val, i) => ({
        points: val,
        probability: (scores[i] * 100).toFixed(2)
    }));

    postMessage({
        type: workerEvents.recommend,
        recommendations: results
    });
}

// Listeners do Worker
const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: recommend,
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};