const {createInsertionObject, promiseQuery, stripNullFieldsFromResults} = require('./utils.js');
const Logger = require('../../util/Logger.js');
const {getEpisodesForProjectId} = require('./episodes');

function getListOfProjects(connection){
    return promiseQuery(connection, 'SELECT name FROM projects;');
}

function getFullProjectInfoByName(connection, name){
    return getBasicProjectInfoByName(connection, name)
        .then((projectInfo) => {
            Logger.silly('getFullProjectInfoByName', 'Retreived basic info', projectInfo);
            return hydrateProjectData(connection, projectInfo);
        });
}

function getBasicProjectInfoByName(connection, projectName){
    return promiseQuery(connection, 'SELECT projects.* FROM projects LEFT JOIN project_aliases on projects.id = project_aliases.projectId WHERE projects.name = ? OR project_aliases.alias = ? LIMIT 1;', [projectName, projectName])
        .then(results => stripNullFieldsFromResults(results, ['completed']))
        .then((result) => {
            if(result.length > 1) {
                return Promise.reject(new Error(`[getFullProjectInfoByName] expected 1 result for ${projectName}, got ${result.length}`));
            } else if(result.length === 0){
                return null;
            }
            return result[0];
        }).catch((err) => {
            Logger.error('getBasicProjectInfoByName', 'Query error', err);
            return Promise.reject(err);
        });
}

function getAliasesForProject(connection, projectId){
    return promiseQuery(connection, 'SELECT * FROM project_aliases WHERE projectId = ? ;', [projectId])
        .then((rows) => {
        //just return an array of the aliases
            return rows.map((row) => {
                return row.alias;
            });
        });
}

function hydrateProjectData(connection, projectData){
    if(!projectData){
        return projectData;
    }

    return Promise.all([
        getEpisodesForProjectId(connection, projectData.id),
        getAliasesForProject(connection, projectData.id)
    ]).then((res) => {
        //assign the values in:
        projectData.episodes = res[0];
        projectData.aliases = res[1];
        //and resolve:
        return projectData;
    })
        .catch((err) => {
            Logger.error('hydrateProjectData', 'Failed to retrieve extra information\n', err);
            Promise.reject(err);
        });
}

function insertNewProject(connection, projectDetails){
    const insertionData = createInsertionObject('projects', projectDetails);
    return promiseQuery(connection, insertionData.sql, insertionData.data);
}

function insertProjectAliases(connection, projectId, aliases){
    const rows = aliases.map(alias => {
        return {projectId, alias};
    });
    const insertionObject = createInsertionObject('project_aliases', rows);
    return promiseQuery(connection, insertionObject.sql, insertionObject.data);
}

module.exports= {
    getListOfProjects,
    getBasicProjectInfoByName,
    getFullProjectInfoByName,
    insertNewProject,
    insertProjectAliases
};
