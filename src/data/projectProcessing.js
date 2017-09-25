const validators = require('./models/validators.js');
//const Logger = require('../util/Logger.js');
const {insertNewProject, insertProjectAliases} = require('./sql/projects');
const {insertNewEpisodes} = require('./sql/episodes');
const {insertTaskBatchFromTemplate} = require('./sql/tasks');
const {convertInsertResultToNewIdsArray} = require('./sql/utils');

function createProjectFromTemplate(connection, projectTemplate){
    //verify the template:
    if(!validators['projectTemplate_schema.json'](projectTemplate)){
        throw new TypeError(`Given template failed to match schema. ${JSON.stringify(validators['projectTemplate_schema.json'].errors)}`);
    }

    const projectInfo = {
        name: projectTemplate.name,
        projectType: projectTemplate.projectType
    };

    //Create the project listing:
    return insertNewProject(connection, projectInfo).then((result) => {
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
        //Then create tasks for each episode:
        const tasksPerEpisode = newEpisodeIds.map((episodeId) => {
            //Take a copy of the defaultTasks
            const tasks = JSON.parse(JSON.stringify(projectTemplate.defaultTasks));
            //Add the episodeId to each task:
            return tasks.map((task) => {
                task.episodeId = episodeId;
                return task;
            });
        });

        //Promise the creation of each batch of tasks:
        return Promise.all(tasksPerEpisode.map((episodeTasksTemplate) => {
            return insertTaskBatchFromTemplate(connection, episodeTasksTemplate);
        }));
    });
}

module.exports = {
    createProjectFromTemplate
};
