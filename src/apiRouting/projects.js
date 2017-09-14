const ProjectsRouter = require('express').Router();
const { getListOfProjects, getFullProjectInfoByName, getBasicProjectInfoByName} = require('../data/sql/projects.js');
const { getEpisodeByNumberForProject } = require('../data/sql/episodes.js');
const { getTasksByEpisodeIdAndTaskName, setTaskCompletion } = require('../data/sql/tasks.js');
const { isAllowedToUpdateTask } = require('../data/permissionProcessing.js');
const filter = require('../data/models/filter.js');
const validators = require('../data/models/validators.js');


function ProjectsRouterFactory(mysqlConnectionPool){

    function getConnection(){
        return new Promise((resolve, reject)=>{
            mysqlConnectionPool.getConnection((err, connection)=>{
                if(err){
                    console.error('[ConnectionPoolError] Failed to get connection from pool:\n', err);
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    ProjectsRouter.get('/',(req,res,next)=>{
        //Return a list of projects on the database:
        getConnection().then((connection) => {
                return getListOfProjects(connection).then((result)=>{
                    connection.release();
                    return res.send(result);
                }).catch((err)=>{
                    connection.release();
                    return Promise.reject(err);
                });
        })
        .catch((err)=>{
            console.error('[Error] Error when retrieving list of projects', err);
            return res.status(500).send();
        });
    });

    ProjectsRouter.get('/:projectName', (req, res)=>{
        console.log('Saw project request with params:', req.params);
        getConnection().then((connection)=>{
            return getFullProjectInfoByName(connection, req.params.projectName).then((result)=>{
                if(result === null){
                    return res.status(404).send();
                }

                //filter the result by project_schema.json
                result = filter(result, 'project_schema.json', req.apiPermission.permissions.dataViewLevel);
                //then send it
                return res.send(result);

            }).catch((err)=>{
                connection.release();
                return Promise.reject(err);
            });
        })
        .catch((err)=>{
            console.error(`[Error] Error when retrieving project '${req.params.projectName}': `, err);
            return res.status(500).send();
        });
    });

    ProjectsRouter.get('/:projectName/episodes/:episodeNumber',(req,res,next)=>{
        //TODO: retrieve and send episode information
        console.log('[ProjectsRouter] saw request to', req.url, ' with params', req.params);
        getConnection().then((connection)=>{

            return getBasicProjectInfoByName(connection, req.params.projectName)
            .then((projectInfo)=>{
                return getEpisodeByNumberForProject(connection, req.params.episodeNumber, projectInfo.id);
            }).then((result)=>{
                if(!result){
                    return res.status(404).send(`Couldn't find info for episode ${req.params.episodeNumber} for project ${req.params.projectName}`);
                }
                result = filter(result,'episode_schema.json',req.apiPermission.permissions.dataViewLevel);
                return res.send(result);
            }).catch((err)=>{
                connection.release();
                return Promise.reject(err);
            });
        })
        .catch((err)=>{
            console.error(`[Error] Error with GET on ${req.url}\n`, err);
            return res.status(500).send();
        });
    })

    ProjectsRouter.patch('/:projectName/episodes/:episodeNumber/tasks/:taskName',(req, res)=>{
        //Check the body is appropriate:
        if(!validators['taskUpdatePatch_schema.json'](req.body)){
            return res.status(400).send('Message body is not valid.');
        }

        //Then start processing
        getConnection().then((connection)=>{
            return getBasicProjectInfoByName(connection, req.params.projectName)
            .then((projectInfo)=>{
                return getEpisodeByNumberForProject(connection, req.params.episodeNumber, projectInfo.id);
            }).then((episodeInfo)=>{
                //Make sure we got data
                if(!episodeInfo) {return Promise.reject({message:'getEpisodeByNumberForProject returned a falsey value.', data: episodeInfo});}

                return getTasksByEpisodeIdAndTaskName(connection, episodeInfo.id, req.params.taskName);
            }).then((taskResult)=>{
                if(taskResult.length === 1){
                    const task = taskResult[0];

                    //Check permissions:
                    if(!isAllowedToUpdateTask(task,req.apiPermission)){
                        return res.status(403).send('You do not have permissions to edit that task');
                    }


                    //determine actions to perform:
                    let updates = [];
                    if(typeof req.body.completed !== 'undefined'){
                        updates.push(setTaskCompletion(connection, task.id, req.body.completed));
                    }

                    if(typeof req.body.newStaff !== 'undefined'){
                        updates.push(setAssignedStaffMember(connection, task.id, req.body.newStaff));
                    }

                    return Promise.all(updates).then(()=>{
                        res.send(`Updated ${req.params.taskName} from ep${req.params.episodeNumber} of ${req.params.projectName}.`);
                    });

                } else {
                    console.error(`[ErrorUpdatingTask] Could not update ${req.params.taskName} from ep${req.params.episodeNumber} of ${req.params.projectName}. Found ${taskResult.length} matching tasks.`);
                    connection.release();
                    res.status(400).send(`Couldn't find match for task ${req.params.taskName} from ep${req.params.episodeNumber} of ${req.params.projectName}.`);
                }
            }).catch((err)=>{
                connection.release();
                console.error('[ProjectRouter::PATCH task]', err);
                return res.status(500).send();
            });
        })
        .catch((err)=>{
            console.error(`[Error] Error when patching on ${req.url}\n`, err);
            return res.status(500).send();
        });
    });

    return ProjectsRouter;
}

module.exports = ProjectsRouterFactory;
