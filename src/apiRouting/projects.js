const ProjectsRouter = require('express').Router(); //eslint-disable-line new-cap
const Logger = require('../util/Logger.js');
const mysqlConnectionPool = require('../util/mysqlConnectionPool.js');
const {getListOfProjects, getFullProjectInfoByName, getBasicProjectInfoByName} = require('../data/sql/projects.js');
const {getEpisodeByNumberForProject} = require('../data/sql/episodes.js');
const {getTasksByEpisodeIdAndTaskName, setTaskCompletion, setAssignedStaffMember} = require('../data/sql/tasks.js');
const {isAllowedToUpdateTask} = require('../data/permissionProcessing.js');
const {createProjectFromTemplate} = require('../data/projectProcessing.js');
const filter = require('../data/models/filter.js');
const validators = require('../data/models/validators.js');

ProjectsRouter.get('/', (req, res) => {
    //Return a list of projects on the database:
    return mysqlConnectionPool.getConnection().then((connection) => {
        return getListOfProjects(connection).then((results) => {
            connection.release();
            Logger.info('ProjectsRouter GET projects', `Sending ${results.length} results.`);
            return res.send(results);
        }).catch((err) => {
            connection.release();
            return Promise.reject(err);
        });
    })
        .catch((err) => {
            Logger.error('GET /projects/', 'Error when retrieving list of projects', err);
            return res.status(500).send();
        });
});

ProjectsRouter.get('/:projectName', (req, res) => {
    Logger.info('GET projects/:projectName', 'Saw project request with params:', req.params);
    return mysqlConnectionPool.getConnection().then((connection) => {
        return getFullProjectInfoByName(connection, req.params.projectName).then((result) => {
            if(result === null){
                connection.release();
                return res.status(404).send();
            }
            Logger.silly('GET projects/:projectName', `Got raw project data as:`, JSON.stringify(result));

            //filter the result by project_schema.json
            result = filter(result, 'project_schema.json', req.apiPermission.permissions.dataViewLevel);
            //then send it
            connection.release();
            return res.send(result);

        }).catch((err) => {
            connection.release();
            return Promise.reject(err);
        });
    })
        .catch((err) => {
            Logger.error('GET projects/:projectName', `Error when retrieving project '${req.params.projectName}'`, err);
            return res.status(500).send();
        });
});

ProjectsRouter.get('/:projectName/episodes/:episodeNumber', (req, res) => {
    Logger.info('[ProjectsRouter/:projectName/episodes/:episodeNumber]', `saw request to ${req.url}`, req.params);
    return mysqlConnectionPool.getConnection().then((connection) => {
        return getBasicProjectInfoByName(connection, req.params.projectName)
            .then((projectInfo) => {
                return getEpisodeByNumberForProject(connection, req.params.episodeNumber, projectInfo.id);
            }).then((result) => {
                if(!result){
                    return res.status(404).send(`Couldn't find info for episode ${req.params.episodeNumber} for project ${req.params.projectName}`);
                }
                result = filter(result, 'episode_schema.json', req.apiPermission.permissions.dataViewLevel);
                connection.release();
                return res.send(result);
            }).catch((err) => {
                connection.release();
                return Promise.reject(err);
            });
    })
        .catch((err) => {
            Logger.error('ProjectsRouter/:projectName/episodes/:episodeNumber', `Error with GET on ${req.url}\n`, err);
            return res.status(500).send();
        });
});

ProjectsRouter.patch('/:projectName/episodes/:episodeNumber/tasks/:taskName', (req, res) => {
    Logger.info('PATCH projects/:projectName/episodes/:episodeNumber/tasks/:taskName', `Saw request to ${req.url} with params: ${JSON.stringify(req.params)}`);
    //Check the body is appropriate:
    if(!validators['taskUpdatePatch_schema.json'](req.body)){
        Logger.debug('ProjectRouter::PATCH project task', `Problems with taskUpdate body: ${JSON.stringify(validators['taskUpdatePatch_schema.json'].errors)}`);
        return res.status(400).send('Message body is not valid.');
    }

    //Then start processing
    return mysqlConnectionPool.getConnection().then((connection) => {
        return getBasicProjectInfoByName(connection, req.params.projectName)
            .then((projectInfo) => {
                return getEpisodeByNumberForProject(connection, req.params.episodeNumber, projectInfo.id);
            }).then((episodeInfo) => {
                //Make sure we got data
                if(!episodeInfo) {
                    return Promise.reject(new Error(`getEpisodeByNumberForProject returned a falsey value. ${JSON.stringify(episodeInfo)}`));
                }

                return getTasksByEpisodeIdAndTaskName(connection, episodeInfo.id, req.params.taskName);
            }).then((taskResult) => {
                if(taskResult.length === 1){
                    const task = taskResult[0];

                    //Check permissions:
                    if(!isAllowedToUpdateTask(task, req.apiPermission)){
                        return res.status(403).send('You do not have permissions to edit that task');
                    }

                    //determine actions to perform:
                    const updates = [];
                    if(typeof req.body.completed !== 'undefined'){
                        updates.push(setTaskCompletion(connection, task.id, req.body.completed));
                    }

                    if(typeof req.body.newStaff !== 'undefined'){
                        updates.push(setAssignedStaffMember(connection, task.id, req.body.newStaff));
                    }

                    return Promise.all(updates).then(() => {
                        return res.send(`Updated ${req.params.taskName} from ep${req.params.episodeNumber} of ${req.params.projectName}.`);
                    });

                }
                Logger.error(`ErrorUpdatingTask`, `Could not update ${req.params.taskName} from ep${req.params.episodeNumber} of ${req.params.projectName}. Found ${taskResult.length} matching tasks.`);
                connection.release();
                return res.status(400).send(`Couldn't find match for task ${req.params.taskName} from ep${req.params.episodeNumber} of ${req.params.projectName}.`);

            }).catch((err) => {
                Logger.error('ProjectRouter::PATCH task', 'An unhandled error occurred', err);
                connection.release();
                return res.status(500).send();
            });
    })
        .catch((err) => {
            Logger.error('ProjectRouter::PATCH task', `Error when patching on ${req.url}\n`, err);
            return res.status(500).send();
        });
});

ProjectsRouter.post('/', (req, res) => {
    //Check authorisation:
    if(!req.apiPermission.permissions.taskUpdate){
        return res.status(403).send(`You don't have project creation priviledges`);
    }

    //Check schema
    if(!validators['projectTemplate_schema.json'](req.body)){
        Logger.info('ProjectRouter::POST new Project', `The project template failed to validate`);
        Logger.debug('ProjectRouter::POST new Project', `Problems with project template: ${JSON.stringify(validators['projectTemplate_schema.json'].errors)}`);
        return res.status(400).send('Message body is not valid.');
    }

    return mysqlConnectionPool.getConnection().then((connection) => {
        return createProjectFromTemplate(connection, req.body).then(() => {
            connection.release();
            return res.status(201).send(`Created Project ${req.body.name}`);
        }).catch((err) => {
            connection.release();

            //Check if it was a known error
            if(err.customTag === 'STAFF404'){
                return res.status(400).send(`${err.message}`);
            }

            return Promise.reject(err);
        });
    }).catch((err) => {
        Logger.error('ProjectRouter::POST new Project', `Error when attempting to create new project`, err);
        return res.status(500).send();
    });
});

module.exports = ProjectsRouter;
