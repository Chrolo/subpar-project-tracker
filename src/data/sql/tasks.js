const mysql = require('mysql');
const {promiseQuery} = require('./utils.js');

function getTasksByEpisodeId(connection, episodeId){
    return new Promise((resolve, reject)=>{
        connection.query('SELECT * FROM tasks WHERE episodeId = ? ;', episodeId,(err,result)=>{
            if(err){
                reject(err);
            } else {
                Promise.all(result.map((task)=>{
                    return hydrateTaskData(connection,task);
                })).then(resolve);
            }
        });
    });
}

function getTasksByStaffName(connection, staffName){
    return new Promise((resolve, reject)=>{
        connection.query('SELECT * FROM tasks WHERE staffName = ? ;', staffName,(err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function hydrateTaskData(connection, task){
    return Promise.all([
        getTaskPreRequisiteTasks(connection, task.id)
    ]).then((extraInfo)=>{
        task.dependsOn = extraInfo[0];
        return task;
    });
}

function getTaskPreRequisiteTasks(connection, taskId) {
    return new Promise((resolve,reject)=>{
        connection.query('SELECT * FROM task_dependencies WHERE taskId = ? ;', taskId,(err,result)=>{
            if(err){
                reject(err);
            } else {
                //Return an array of taskIds
                resolve(result.map(row=>row.preTaskId));
            }
        });
    });
}

function setTaskComplete(connection, taskId) {
    if(!Number.isFinite(taskId)){
        return Promise.reject(`Task Id must be an integer number, got ${taskId} : ${typeof taskId}`);
    }

    return promiseQuery(connection,'UPDATE tasks SET completed = NOW() WHERE taskId = ?', taskId).
    then((result)=>{
        console.log('[setTaskComplete] returned: ',result);
        return result;
    });
}

function updateAssignedStaffMember(connection, taskId, staffMember) {
    //TODO: Verify taskID and staff Member
    return promiseQuery(connection,'UPDATE tasks SET staff = ? WHERE taskId = ?', [staffMember,taskId]).
    then((result)=>{
        console.log('[setTaskComplete] returned: ',result);
        return result;
    });
}

function getTasksByEpisodeIdAndTaskName(connection, episodeId, taskname) {
    return getTasksByEpisodeId(connection, episodeId).then((result)=>{
        return result.filter( row => row.name === taskname );
    });
}

module.exports = {
    getTasksByEpisodeId,
    getTasksByStaffName,
    setTaskComplete
};
