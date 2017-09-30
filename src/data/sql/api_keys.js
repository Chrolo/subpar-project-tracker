const {promiseQuery} = require('./utils.js');
const uuidv4 = require('uuid/v4');
const Logger = require('../../util/Logger.js');
const {getPermissionsForId} = require('./permissions.js');
const {createInsertForData} = require('./utils.js');

const apiKeyCache = {
    updated: 0,
    keys: []
};

const CACHE_EXPIRY_LENGTH_MS = 60*1000; //1 minute

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

    const insertionData = createInsertForData('api_keys', [options]);
    return promiseQuery(connection, insertionData.string, insertionData.values)
        .then((result, fields) => {
            Logger.info('ApiTokenGenerate', `results were:\n, ${JSON.stringify(result)}\n---\n${JSON.stringify(fields)}`);
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
    getPermissionsForApiKey
};
