const { getTasksByEpisodeId } = require('./tasks.js');
const { getFilesForEpisode } = require('./episodeFiles.js');
const {promiseQuery} = require('./utils.js');

function getEpisodesForProjectId(connection, projectId) {
    return new Promise((resolve, reject)=>{
        connection.query('SELECT * FROM episodes WHERE projectId = ?', [projectId],(err, episodeResult)=>{
            if(err){
                reject(err);
            } else {
                //Get details of each episode:
                Promise.all(episodeResult.map((episode)=>{
                    console.log('episode returned',episode);
                    return Promise.all([
                        getTasksByEpisodeId(connection,episode.id),
                        getFilesForEpisode(connection, episode.id)
                    ]).then((results)=>{
                        //Add details to the object
                        episode.tasks = results[0];
                        episode.files = results[1];
                        return episode;
                    });
                })).then(resolve);  //then resolve with all the info
            }
        })
    });
}

function getEpisodeByNumberForProject(connection, episodeNumber, projectId){
    return promiseQuery(connection, 'SELECT * FROM episodes WHERE projectId = ? AND episodeNumber = ?;',[projectId,episodeNumber]);
}


module.exports = {
    getEpisodesForProjectId,
    getEpisodeByNumberForProject
};
