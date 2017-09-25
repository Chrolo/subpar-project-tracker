const {promiseQuery, stripNullFieldsFromResults} = require('./utils.js');
//const Logger = require('../../util/Logger.js');   //TODO re-enable logger

function getFilesForEpisode(connection, episodeId){
    return promiseQuery(connection, 'SELECT * FROM episode_files WHERE episodeId= ? ;', [episodeId])
        .then(stripNullFieldsFromResults);
}

/*  //TODO: finish 'insertEpisodeFile' function
function insertEpisodeFile(connection, episodeFileObject){
    return promiseQuery(connection, 'INSERT INTO episode_files ()');
}
//*/

module.exports = {
    getFilesForEpisode
};
