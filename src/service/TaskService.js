export class TaskService {
    #tasksPath = './data/tasks.json';

    // Busca todas as 100 tarefas para alimentar o treinamento da rede neural
    async getTasks() {
        try {
            const response = await fetch(this.#tasksPath);
            if (!response.ok) throw new Error('Erro ao carregar tasks.json');
            return await response.json();
        } catch (error) {
            console.error("Falha no TaskService:", error);
            return [];
        }
    }

    // Caso precise buscar uma tarefa específica por ID no futuro
    async getTaskById(id) {
        const tasks = await this.getTasks();
        return tasks.find(task => task.id === id);
    }
}