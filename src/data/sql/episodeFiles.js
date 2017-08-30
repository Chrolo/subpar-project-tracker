function getFilesForEpisode(connection, episodeId){
    return new Promise((resolve, reject)=>{
        connection.query('SELECT * FROM episode_files WHERE episodeId= ? ;', [episodeId], (err, res)=>{
            if(err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function insertEpisodeFile(connection, episodeFileObject){
    return new Promise((resolve,reject)=>{
        connection.query('INSERT INTO episode_files ()');
    });
}


module.exports = {
    getFilesForEpisode
};
