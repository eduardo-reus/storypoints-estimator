import { TaskService } from './service/TaskService.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { WorkerController } from './controller/WorkerController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { ModelView } from './view/ModelTrainingView.js';
import { TFVisorView } from './view/TFVisorView.js';
import Events from './events/events.js';

// 1. Inicialização do Worker (Caminho absoluto para o WSL/Navegador)
const worker = new Worker('./src/workers/modelTrainingWorker.js', { type: 'module' });

// 2. Instância do Service Único (Singleton de Dados)
const taskService = new TaskService();

// 3. Instâncias das Views
const modelView = new ModelView();
const tfVisorView = new TFVisorView();

// 4. Injeção de Dependências nos Controllers
WorkerController.init({
    worker,
    events: Events
});

TFVisorController.init({
    tfVisorView,
    events: Events
});

ModelController.init({
    modelView,
    taskService,
    events: Events
});

console.log("🚀 Story Points Estimator inicializado com sucesso!");