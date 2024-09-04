import Asana from 'asana'

const WORKSPACE_GID = process.env.ASANA_GID;

let asanaTaskInstance, asanaStoriesInstance, asanaUsersInstance;

const asanaConfig = () => {
    let client = Asana.ApiClient.instance;

    let token = client.authentications['token'];
    token.accessToken = process.env.ASANA_PAT;

    asanaTaskInstance = new Asana.TasksApi();
    asanaStoriesInstance = new Asana.StoriesApi();
    asanaUsersInstance = new Asana.UsersApi();
}

const getTask = async (taskId) => {
    try {
        let opts = {};
        const result = await asanaTaskInstance.getTask(taskId, opts);
    
        return result
    } catch (error) {
        console.error(error.response.body);
    }
}

const updateTask = async (taskId, firstTimeResponse) => {
    try {
        let body = {"data": {"custom_fields": {"1207992413705337": firstTimeResponse}}};
        let opts = {};
        const result = await asanaTaskInstance.updateTask(body, taskId, opts);
    
        return result
    } catch (error) {
        console.error(error.response.body);        
    }
}

const getStoriesFromTask = async (taskId) => {
    try {
        let opts = {};
        const results = await asanaStoriesInstance.getStoriesForTask(taskId, opts);
    
        return results
    } catch (error) {
        console.error(error.response.body);        
    }
}

const getUsersInATeam = async (teamId) => {
    try {
        let opts = {};
        const results = await asanaUsersInstance.getUsersForTeam(teamId, opts);
    
        return results
    } catch (error) {
        console.error(error.response.body);
    }
}

export { asanaConfig, getTask, getStoriesFromTask, getUsersInATeam, updateTask}