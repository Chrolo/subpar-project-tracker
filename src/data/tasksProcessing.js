/*
This file is to handle processing actions for tasks, such as determining the currently blocking tasks
and returning when a task was complete.
*/

function convertArrayOfTasksToCollection(arrayOfTasks){
    return arrayOfTasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
    }, {});
}

function convertCollectionOfTasksToArray(collectionOfTasks) {
    return Object.keys(collectionOfTasks).map((id) => {
        return collectionOfTasks[id];
    });
}

/**
    @param tasks a collection of tasks (as a collection object with TaskIds as keys)
 @returns an array of current taskIds.
*/
function getCurrentTaskIds(tasks){
    //If given an array, convert to collection:
    if(tasks instanceof Array) {
        tasks = convertArrayOfTasksToCollection(tasks);
    }

    const taskIds = Object.keys(tasks);

    const currentTasks = [];

    taskIds.forEach((id) => {
        //If completed, expect to see non-null value.
        if(!tasks[id].completed) {
            const isReadyToStart = tasks[id].dependsOn.reduce((acc, dependantId) => {
                return acc && !!tasks[dependantId].completed;
            }, true);

            if(isReadyToStart){
                currentTasks.push(id);
            }
        }
    });
    return currentTasks;
}

module.exports = {
    convertArrayOfTasksToCollection,
    convertCollectionOfTasksToArray,
    getCurrentTaskIds
};
