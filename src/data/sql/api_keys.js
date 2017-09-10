const { promiseQuery } = require('./utils.js');
const uuidv4 = require('uuid/v4');
const { getPermissionsForId } = require('./permissions.js');

let apiKeyCache = {
    updated: 0,
    keys:[]
};

const CACHE_EXPIRY_LENGTH_MS = 60*1000; //1 minute

function getPermissionsForApiKey(connection, apiKey){
    if(!apiKey || apiKey.length !== 36){    //TODO: enable length check
        return Promise.reject(`[api_key] Api Key not specified, saw '${apiKey}'[${typeof apiKey}]`);
    }

    //Check cache expiry
    if(apiKeyCache.updated + CACHE_EXPIRY_LENGTH_MS < Date.now()){
        return refreshApiKeysCache(connection).then(()=>getApiKeyDataFromCache(apiKey));
    } else {
        return Promise.resolve(getApiKeyDataFromCache(apiKey));
    }

}

function createNewApiKey(connection, options){
    //Create new key:
    options.apiKey = uuidv4();

    const insertionData = createInsertForData('api_keys',[options]);
    return promiseQuery(connection,insertionData.string, insertionData.values)
        .then((result,fields)=>{
            console.log('[ApiTokenGenerate] results were:\n',result,'\n---\n',fields);
        });
}

function refreshApiKeysCache(connection){
    return promiseQuery(connection, 'SELECT * FROM api_keys;').then((apiKeyResults)=>{
        //Load in the permissions for those keys
        return Promise.all(
            apiKeyResults.map((apiKey)=>{
                return getPermissionsForId(connection, apiKey.permissionId).then((permissions)=>{
                    apiKey.permissions = permissions;
                    return apiKey;
                })
            })
        );
    }).then((results)=>{
        //Log those keys into the database.
        apiKeyCache.keys = results;
        apiKeyCache.updated = Date.now();
        return true;
    }).catch((error)=>{
        console.error('[ApiCacheError] ',error);
        apiKeyCache.keys = [];
        apiKeyCache.updated = 0;
    });
}

function getApiKeyDataFromCache(apiKey){
    return apiKeyCache.keys.find((key)=>{
        return key.apiKey === apiKey;
    });
}

module.exports= {
    createNewApiKey,
    getPermissionsForApiKey
};
