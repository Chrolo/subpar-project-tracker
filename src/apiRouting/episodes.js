const EpisodesRouter = require('express').Router();

function EpisodesRouterFactory(mysqlConnectionPool){
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

    EpisodesRouter.get(/\/(\d+)/, (req, res, next)=>{
        console.log('[EpisodesRouter] Saw call to', req.url, ' which appears to be a numeric episode Id');
        console.log('[EpisodesRouter] params', req.paramas);
    });

    return EpisodesRouter;
}

module.exports = EpisodesRouterFactory;
