const {promiseQuery} = require('./utils.js');
const uuidv4 = require('uuid/v4');
const Logger = require('../../util/Logger.js');
const {getPermissionsForId, insertNewPermissionsRule} = require('./permissions.js');
const {createInsertionObject} = require('./utils.js');

const apiKeyCache = {
    updated: 0,
    keys: []
};

const CACHE_EXPIRY_LENGTH_MS = 60*1000; //1 minute

function getListOfApiKeys(connection){
    return promiseQuery(connection, 'SELECT apiKey FROM api_keys;').then(results => {
        return results.map(row => row.apiKey);
    });
}

function getPermissionsForApiKey(connection, apiKey){
    if(!apiKey || apiKey.length !== 36){
        Logger.debug('getPermissionsForApiKey', `Saw invalid uuid: '${apiKey}'`);
        return Promise.reject(new Error(`Api Key not specified, saw '${apiKey}'[${typeof apiKey}]`));
    }

    //Check cache expiry
    if(apiKeyCache.updated + CACHE_EXPIRY_LENGTH_MS < Date.now()){
        return refreshApiKeysCache(connection).then(() => getApiKeyDataFromCache(apiKey));
    }
    Logger.silly('getPermissionsForApiKey', 'Using cached permissions');
    return Promise.resolve(getApiKeyDataFromCache(apiKey));

}

function createNewApiKey(connection, options){
    //Create new key:
    options.apiKey = uuidv4();

    return insertNewPermissionsRule(connection, options.permissions)
        .then((results) => {
            if(typeof results.insertId === 'undefined'){
                throw new Error(`insertNewPermissionsRule returned no insertId. Saw: ${results}`);
            }

            //Add the permissions Id
            options.permissionId = results.insertId;
            const insertionData = createInsertionObject('api_keys', [options]);
            return promiseQuery(connection, insertionData.sql, insertionData.data)
                .then(() => {
                    Logger.info('ApiTokenGenerate', `Added new APIkey '${options.apiKey}'`);
                    Logger.debug('ApiTokenGenerate', `new APIkey object is`, JSON.stringify(options));
                    return options.apiKey;
                });
        });
}

function refreshApiKeysCache(connection){
    Logger.debug('ApiKeyCache', 'Refreshing API key cache');
    return promiseQuery(connection, 'SELECT * FROM api_keys;').then((apiKeyResults) => {
        //Load in the permissions for those keys
        return Promise.all(
            apiKeyResults.map((apiKey) => {
                return getPermissionsForId(connection, apiKey.permissionId).then((permissions) => {
                    apiKey.permissions = permissions;
                    return apiKey;
                });
            })
        );
    }).then((results) => {
        //Log those keys into the database.
        apiKeyCache.keys = results;
        apiKeyCache.updated = Date.now();
        Logger.debug('ApiKeyCache', `Caching ${results.length} keys`);
        return true;
    }).catch((error) => {
        Logger.error('ApiKeyCacheError', 'Unexpected occurred when refreshing APIKeyCache', error);
        apiKeyCache.keys = [];
        apiKeyCache.updated = 0;
    });
}

function getApiKeyDataFromCache(apiKey){
    return apiKeyCache.keys.find((key) => {
        return key.apiKey === apiKey;
    });
}

module.exports= {
    createNewApiKey,
    getListOfApiKeys,
    getPermissionsForApiKey
};
