const Logger = require('../../util/Logger.js');
const {promiseQuery} = require('./utils.js');

function getTasksByEpisodeId(connection, episodeId){
    return promiseQuery(connection, 'SELECT * FROM tasks WHERE episodeId = ? ;', episodeId)
        .then((result) => {
            Logger.info('getTasksByEpisodeId', `Got ${result.length} results from query.`);
            Logger.debug('getTasksByEpisodeId', `Query for episodeId#${episodeId} gave results:`, result);
            return Promise.all(result.map((task) => {
                return hydrateTaskData(connection, task);
            }));
        });
}

function getTasksByStaffName(connection, staffName){
    return promiseQuery('SELECT * FROM tasks WHERE staffName = ? ;', staffName);
}

function hydrateTaskData(connection, task){
    return Promise.all([getTaskPreRequisiteTasks(connection, task.id)]).then((extraInfo) => {
        task.dependsOn = extraInfo[0];
        return task;
    });
}

function getTaskPreRequisiteTasks(connection, taskId) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM task_dependencies WHERE taskId = ? ;', taskId, (err, result) => {
            if(err){
                reject(err);
            } else {
                //Return an array of taskIds
                resolve(result.map(row => row.preTaskId));
            }
        });
    });
}

function setTaskCompletion(connection, taskId, status=true) {
    if(!Number.isFinite(taskId)){
        return Promise.reject(new Error(`Task Id must be an integer number, got ${taskId} : ${typeof taskId}`));
    }

    const completed= status ? 'NOW()' : 'NULL';
    return promiseQuery(connection, `UPDATE tasks SET completed = ${completed} WHERE id = ?`, taskId)
        .then((result) => {
            Logger.debug('setTaskCompletion', `Update to task#${taskId} to ${status?'complete':'incomplete'} gave result:`, result);
            //TODO: verify that UPDATE processed successfully?
            return true;
        });
}

function setAssignedStaffMember(connection, taskId, staffMember) {
    //TODO: Verify taskID and staff Member
    return promiseQuery(connection, 'UPDATE tasks SET staff = ? WHERE id = ?', [staffMember, taskId])
        .then((result) => {
            Logger.debug('setAssignedStaffMember', `Update to task#${taskId} to staff ${staffMember} gave result:`, result);
            //TODO: verify that UPDATE processed successfully?
            return true;
        });
}

function getTasksByEpisodeIdAndTaskName(connection, episodeId, taskname) {
    return getTasksByEpisodeId(connection, episodeId).then((results) => {
        return results.filter(row => row.taskName === taskname);
    });
}

module.exports = {
    getTasksByEpisodeId,
    getTasksByEpisodeIdAndTaskName,
    getTasksByStaffName,
    setAssignedStaffMember,
    setTaskCompletion
};
