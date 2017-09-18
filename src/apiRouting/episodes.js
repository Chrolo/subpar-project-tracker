const EpisodesRouter = require('express').Router(); //eslint-disable-line new-cap
const Logger = require('../util/Logger.js');

function EpisodesRouterFactory(mysqlConnectionPool){
    //TODO: remove this eslint disable
    function getConnection(){   //eslint-disable-line no-unused-vars
        return new Promise((resolve, reject) => {
            mysqlConnectionPool.getConnection((err, connection) => {
                if(err){
                    Logger.error('ConnectionPoolError', 'Failed to get connection from pool:\n', err);
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    EpisodesRouter.get(/\/(\d+)/, (req, res) => {
        Logger.info('[EpisodesRouter]', `Saw call to ${req.url} with params ${req.params}`);
        return res.status(501).send();
    });

    return EpisodesRouter;
}

module.exports = EpisodesRouterFactory;
