const {getPermissionsForApiKey} = require('../data/sql/api_keys.js');
const Logger = require('../util/Logger.js');
const mysqlConnectionPool = require('../util/mysqlConnectionPool.js');

module.exports = (req, res, next) => {
    //Check permissions and attach to request object.
    mysqlConnectionPool.getConnection().then((connection) => {
        //Get the API token:
        const apiKey = req.headers['x-api-key'];
        //TODO: allow api token as query parameter too?

        if(!apiKey){
            Logger.info('ApiKeyMiddleware', 'Access attempted without API key');
            //TODO: Server config to allow default view permissions without API token?
            return res.status(401).send('Please remember to include your API token!');
        }

        return getPermissionsForApiKey(connection, apiKey)
            .then((result) => {
                //release the connection
                connection.release();
                //if no permissions have been found for that API token:
                if(!result){
                    //TODO: Server config to allow default view permissions without API token?
                    Logger.debug('ApiKeyMiddleware', `Couldn't find entry for '${apiKey}'`);
                    return res.status(403).send('Token not recognised');
                }

                //Attach the permissions data
                req.apiPermission = result;
                Logger.silly('ApiKeyMiddleware', `Attaching permissions to request:`, JSON.stringify(result));

                return next();
            }).catch((err) => {
                connection.release();
                return Promise.reject(err);
            });
    })
        .catch((err) => {
            Logger.error(`ApiKeyMiddleware`, `Error when determining Api permissions for '${req.headers['x-api-key']}'\n`, err);
            return res.status(500).send();
        });
};
