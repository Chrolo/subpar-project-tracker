const ApiKeyRouter = require('express').Router();   //eslint-disable-line new-cap
const {getPermissionsForApiKey} = require('../data/sql/api_keys.js');
const Logger = require('../util/Logger.js');

function apiKeyRouterFactory(mysqlConnectionPool){

    function getConnection(){
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

    ApiKeyRouter.all('*', (req, res, next) => {
        //Check permissions and attach to request object.
        getConnection().then((connection) => {
            //Get the API token:
            const apiKey = req.headers['x-api-key'];
            //TODO: allow api token as query parameter too?

            if(!apiKey){
                //TODO: Server config to allow default view permissions without API token?
                res.status(401).send('Please remember to include your API token!');
            }

            return getPermissionsForApiKey(connection, apiKey)
                .then((result) => {
                    //release the connection
                    connection.release();
                    //if no permissions have been found for that API token:
                    if(!result){
                        //TODO: Server config to allow default view permissions without API token?
                        return res.status(403).send('Token not recognised');
                    }

                    //Attach the permissions data
                    req.apiPermission = result;

                    return next();
                }).catch((err) => {
                    connection.release();
                    return Promise.reject(err);
                });
        })
            .catch((err) => {
                Logger.error(`ApiKeyRouter`, `Error when determining Api permissions for '${req.headers['x-api-key']}'\n`, err);
                res.status(500).send();
            });
    });

    return ApiKeyRouter;
}

module.exports = apiKeyRouterFactory;
