const ApiKeyRouter = require('express').Router();   //eslint-disable-line new-cap
const {createNewApiKey} = require('../data/sql/api_keys.js');
const validators = require('../data/models/validators.js');
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

    ApiKeyRouter.post('/', (req, res) => {
        //Check authorisation:
        if(!req.apiPermission.permissions.apiTokenCreate){
            Logger.info('ApiKeyRouter::POST apiToken Creation', `un-authed attempt to create new api token.`, JSON.stringify({
                apiKey: req.apiPermission.apiKey,
                hostName: req.hostname
            }));
            return res.status(403).send(`You don't have apiToken creation priviledges`);
        }

        //Check the body
        if(!validators['postApiKey_schema.json'](req.body)){
            Logger.debug('ApiKeyRouter::POST create new API key', `Problems with body: ${JSON.stringify(validators['postApiKey_schema.json'].errors)}`);
            return res.status(400).send('Message body is not valid.');
        }

        //TODO: check they're not trying for higher permissions than what they have?

        return getConnection().then((connection) => {
            return createNewApiKey(connection, req.body).then((newApiKey) => {
                return res.status(201).send(`Created new API key ${newApiKey}`);
            });
        }).catch((err) => {
            Logger.error(`ApiKeyRouter`, `Error Adding new API key`, err);
            return res.status(500).send();
        });
    });

    return ApiKeyRouter;
}

module.exports = apiKeyRouterFactory;
