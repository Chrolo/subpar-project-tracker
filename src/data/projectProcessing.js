const validators = require('./models/validators.js');
//const Logger = require('../util/Logger.js');
const {insertNewProject, insertProjectAliases} = require('./sql/projects');
const {insertNewEpisodes} = require('./sql/episodes');
const {insertTaskBatchFromTemplate} = require('./sql/tasks');
const {getStaffInfoByName} = require('./sql/staff');
const {convertInsertResultToNewIdsArray} = require('./sql/utils');

function createProjectFromTemplate(connection, projectTemplate){
    //verify the template:
    if(!validators['projectTemplate_schema.json'](projectTemplate)){
        throw new TypeError(`Given template failed to match schema. ${JSON.stringify(validators['projectTemplate_schema.json'].errors)}`);
    }

    return getStaffInfoByName(connection, projectTemplate.projectLeaderName)
        .then((leaderInfo) => {
            if(!leaderInfo){
                const error = new Error(`No staff member found for '${projectTemplate.projectLeaderName}'`);
                error.customTag = 'STAFF404';
                return Promise.reject(error);
            }

            const projectInfo = {
                name: projectTemplate.name,
                projectType: projectTemplate.projectType,
                projectLeaderId: leaderInfo.id
            };
            //Create the project listing:
            return insertNewProject(connection, projectInfo);
        }).then((result) => {
            const projectId = result.insertId;

            //Then add all episodes
            //create episode bases
            const episodesInfo = new Array(projectTemplate.episodeCount)
                .fill(null).map((v, i) => {
                    return {
                        "projectId": projectId,
                        "episodeName": `${projectTemplate.name} ${i<9?'0':''}${i+1}`,   //example: `ProjectName 03`
                        "episodeNumber": i+1
                    };
                });

            const episodeCreationPromise = insertNewEpisodes(connection, episodesInfo).then(convertInsertResultToNewIdsArray);

            //Add any aliases:
            const aliasInsertionPromise = projectTemplate.aliases ? insertProjectAliases(connection, projectId, projectTemplate.aliases) : true;

            return Promise.all([
                episodeCreationPromise,
                aliasInsertionPromise
            ]).then(promises => promises[0]); //only care about the reulst of createEpisodesPromise

        }).then((newEpisodeIds) => {
            return Promise.all(
                //Then create tasks for each episode:
                newEpisodeIds.map((episodeId) => {
                    const tasks = JSON.parse(JSON.stringify(projectTemplate.defaultTasks));
                    //Add the staffId and episodeId to each task:
                    return Promise.all(tasks.map((task) => {
                        return getStaffInfoByName(connection, task.staffName)
                            .then((assignedStaffInfo) => {
                                if(!assignedStaffInfo){
                                    const error = new Error(`No staff member found for '${task.staffName}'`);
                                    error.customTag = 'STAFF404';
                                    return Promise.reject(error);
                                }

                                task.episodeId = episodeId;
                                task.staffId = assignedStaffInfo.id;
                                delete task.staffName;
                                return task;
                            });
                    }));
                })) //with all the tasks for each episode:
                .then((tasksPerEpisode) => {
                    //Promise the creation of each batch of tasks:
                    return Promise.all(tasksPerEpisode.map((episodeTasksTemplate) => {
                        return insertTaskBatchFromTemplate(connection, episodeTasksTemplate);
                    }));
                });
        });
}

module.exports = {
    createProjectFromTemplate
};
