const Logger = require('../../util/Logger.js');
const {createInsertionObject, promiseQuery} = require('./utils.js');
const {getStaffInfoById} = require('./staff');

function getTasksByEpisodeId(connection, episodeId){
    return promiseQuery(connection, 'SELECT * FROM tasks WHERE episodeId = ? ;', episodeId)
        .then((result) => {
            Logger.debug('getTasksByEpisodeId', `Got ${result.length} results from query for Episode ${episodeId}`);
            Logger.silly('getTasksByEpisodeId', `Query for episodeId#${episodeId} gave results:`, result);
            return Promise.all(result.map((task) => {
                return hydrateTaskData(connection, task);
            }));
        });
}

function getTasksByStaffName(connection, staffName){
    return promiseQuery('SELECT tasks.* from tasks LEFT JOIN staff ON tasks.staffId=staff.id WHERE staff.name=?;', staffName)
        .then((result) => {
            Logger.debug('getTasksByStaffName', `Got ${result.length} results from query for Episode ${staffName}`);
            Logger.silly('getTasksByStaffName', `Query for ${staffName} gave results:`, result);
            return Promise.all(result.map((task) => {
                return hydrateTaskData(connection, task);
            }));
        });
}

function hydrateTaskData(connection, task){
    return Promise.all([
        getTaskPreRequisiteTasks(connection, task.id),
        getStaffInfoById(connection, task.staffId)
    ]).then((extraInfo) => {
        task.dependsOn = extraInfo[0];
        task.staff=extraInfo[1];
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

function insertNewTasks(connection, tasks){
    const insertionObject = createInsertionObject('tasks', tasks);
    return promiseQuery(connection, insertionObject.sql, insertionObject.data);
}

function insertTaskDependencies(connection, thisTask, dependsOn){
    const rows = dependsOn.map(preTaskId => {
        return {taskId: thisTask, preTaskId};
    });
    const insertionObject = createInsertionObject('task_dependencies', rows);
    return promiseQuery(connection, insertionObject.sql, insertionObject.data);
}

function insertTaskBatchFromTemplate(connection, taskBatch){
    //create initial map for ids:
    const idMap = taskBatch.reduce((acc, task) => {
        acc[task.id] = null;
        return acc;
    }, {});

    //Create tasks
    const tasksRows = taskBatch.map((taskDefinition) => {
        //take a copy:
        const newTaskDefinition = JSON.parse(JSON.stringify(taskDefinition));
        //remove uncessary data
        delete newTaskDefinition.id;
        delete newTaskDefinition.dependsOn;
        return newTaskDefinition;
    });

    return insertNewTasks(connection, tasksRows)
        .then((result) => {
            return taskBatch.map((taskDefinition, index) => {
                idMap[taskDefinition.id] = result.insertId+index;       // add new ID to the mapper.
                taskDefinition.id = result.insertId+index;              // replace with new ID
                return taskDefinition;                          //return the old definition, with new ID
            });
        }).then((results) => {
            //sort out the dependencies
            return results.map((taskDefinition) => {
                if(taskDefinition.dependsOn){
                    //If it has dependencies, map them
                    taskDefinition.dependsOn = taskDefinition.dependsOn.map((oldId) => {
                        if(typeof idMap[oldId] === 'undefined' || idMap[oldId] === null){
                            Logger.warn('insertTaskBatchFromTemplate', `Couldn't find new ID for task ${oldId} in data ${JSON.stringify(idMap)}`);
                        }
                        return idMap[oldId];
                    });
                }
                return taskDefinition;
            });
        }).then((results) => {
            //Add all the dependencies
            return Promise.all(results.map(taskDefinition => {
                if(!taskDefinition.dependsOn || taskDefinition.dependsOn.length < 1){
                    return Promise.resolve();
                }
                return insertTaskDependencies(connection, taskDefinition.id, taskDefinition.dependsOn);
            }));
        });
}

module.exports = {
    getTasksByEpisodeId,
    getTasksByEpisodeIdAndTaskName,
    getTasksByStaffName,
    insertNewTasks,
    insertTaskBatchFromTemplate,
    insertTaskDependencies,
    setAssignedStaffMember,
    setTaskCompletion
};
