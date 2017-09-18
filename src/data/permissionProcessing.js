const {ENUMS} = require('./sql/permissions.js');

function isAllowedToUpdateTask(task, apiPermission){
    //if either are undefined, say falsey
    if(!task || !apiPermission){
        return false;
    }

    const updatePermissions = apiPermission.permissions.taskUpdate;
    //what level of permission do they have?
    if(updatePermissions === ENUMS.taskUpdate.ALL){
        //Can update any tasks:
        return true;
    } else if(updatePermissions === ENUMS.taskUpdate.OWN && task.staffName === apiPermission.staffName){
        //Can update their own tasks, and this is one of them.
        return true;
    }

    return false;
}

module.exports= {
    isAllowedToUpdateTask
};
