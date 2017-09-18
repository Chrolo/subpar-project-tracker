const {getTasksByEpisodeId} = require('./tasks.js');
const {getFilesForEpisode} = require('./episodeFiles.js');
const {promiseQuery} = require('./utils.js');
const Logger = require('../../util/Logger.js');

function getEpisodesForProjectId(connection, projectId) {
    return promiseQuery(connection, 'SELECT * FROM episodes WHERE projectId = ?', [projectId])
        .then((episodeResult) => {
            //Get details of each episode:
            return Promise.all(episodeResult.map((episode) => {
                //hydrate data:
                return Promise.all([
                    getTasksByEpisodeId(connection, episode.id),
                    getFilesForEpisode(connection, episode.id)
                ]).then((results) => {
                    //Add details to the object
                    episode.tasks = results[0];
                    episode.files = results[1];
                    return episode;
                });
            }));
        })
        .catch((error) => {
            Logger.error('getEpisodesForProjectId', 'Unexpected error', error);
            return Promise.reject(error);
        });
}

function getEpisodeByNumberForProject(connection, episodeNumber, projectId){
    return promiseQuery(connection, 'SELECT * FROM episodes WHERE projectId = ? AND episodeNumber = ?;', [projectId, episodeNumber])
        .then((results) => {
            if(results.length > 1){
                Logger.error('getEpisodeByNumberForProject', `Expected 1 result got ${results.length}`, {projectId, episodeNumber});
                return Promise.reject(new Error(`[getEpisodeByNumberForProject] Expected 1 result got ${results.length}`));
            }
            return results[0];
        });
}

module.exports = {
    getEpisodesForProjectId,
    getEpisodeByNumberForProject
};
