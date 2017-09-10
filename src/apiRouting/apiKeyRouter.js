const ApiKeyRouter = require('express').Router();
const { getPermissionsForApiKey, createNewApiKey } = require('../data/sql/api_keys.js');

function ApiKeyRouterFactory(mysqlConnectionPool){

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

    ApiKeyRouter.all('*',(req,res,next)=>{
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
                    .then((result)=>{
                    //release the connection
                    connection.release();
                    //if no permissions have been found for that API token:
                    if(!result){
                        //TODO: Server config to allow default view permissions without API token?
                        return res.status(403).send('Token not recognised');
                    }

                    //Attach the permissions data
                    req.apiPermission = result;

                    next();
                }).catch((err)=>{
                    connection.release();
                    return Promise.reject(err);
                });
        })
        .catch((err)=>{
            console.error(`[Error] Error when determining Api permissions for '${apiKey}'\n`, err);
            res.status(500).send();
        });
    });

    //TODO: REMOVE THIS
    console.error('[ApiKeyRouterFactory] REMOVE CODE ALLOWING CREATION OF API_TOKENS');
    ApiKeyRouter.post('/apiTokens/',(req,res)=>{
        console.log('[creating api token] saw headers: \n\t',req.headers);
        if(req.headers.host !== 'localhost:1337'){
            res.status(403).send();
        } else {
            //TODO: get body-parser
            const apiTokenData = {
                temp: req.body.temp //TODO: fill out correct data.
            };

            createNewApiKey(connection,req.body).then((result)=>{
                res.status(200).json({
                    token:result.apiKey
                });
            }).catch((err)=>{
                console.error('[ApiKeyRouter] Error creating new API token.\n', err);
                res.status(500).send();
            });
        }
    })

    return ApiKeyRouter;
}

module.exports = ApiKeyRouterFactory;
