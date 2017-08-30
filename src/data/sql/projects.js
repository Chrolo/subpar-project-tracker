const {promiseQuery} = require('./utils.js');
const {getEpisodesForProjectId} = require('./episodes');

function getListOfProjects(connection){
    return new Promise((resolve, reject)=>{
        connection.query('SELECT name FROM projects;',(err,result)=>{
            if(err){
                console.error('[ProjectsSQL] getListOfProjects failed with error:', err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function getFullProjectInfoByName(connection, name){
    return getBasicProjectInfoByName(connection, name)
        .then((projectInfo)=>{
            //TODO: I need to retreive the rest of the data:
            return hydrateProjectData(connection, projectInfo);
        });
}

function getBasicProjectInfoByName(connection, projectName){
    //TODO: include aliases by using something like
    //'SELECT * FROM projects LEFT JOIN project_aliases on projects.id = project_aliases.projectId WHERE projects.name = 'Nichijou' OR project_aliases.alias = 'Nichijou'; '
    //note: this would require filtering results afterwards.
    return promiseQuery(connection, 'SELECT * FROM projects WHERE name = ?',[projectName])
        .then((result)=>{
            if(result.length != 1) {
                reject({
                    message:`[getFullProjectInfoByName] expected 1 result for ${name}, got ${result.length}`,
                    resCount: result.length
                });
            }
            return result[0];
    });
}

function getAliasesForProject(connection, projectId){
    return promiseQuery(connection,'SELECT * FROM project_aliases WHERE projectId = ? ;',[projectId])
    .then((rows)=>{
        //just return an array of the aliases
        return rows.map((row)=>{
            return row.alias;
        });
    });
}

function hydrateProjectData(connection, projectData){
    return Promise.all([
        getEpisodesForProjectId(connection, projectData.id),
        getAliasesForProject(connection,projectData.id)
    ]).then((res)=>{
        //assign the values in:
        projectData.episodes = res[0];
        projectData.aliases = res[1];
        //and resolve:
        return projectData;
    })
    .catch((err)=>{
        console.error('[hydrateProjectData] Failed to retrieve extra information\n',err);
        reject(err);
    });
}

module.exports= {
    getListOfProjects,
    getBasicProjectInfoByName,
    getFullProjectInfoByName
};
