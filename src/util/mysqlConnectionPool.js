/*Used for singleton pattern mysql connection pool*/
const mysql = require('mysql');
const Logger = require('./Logger.js');
const {promiseQuery} = require('../data/sql/utils.js');
let connectionPool = null;

function initialiseConnectionPoolFromConfig(config){
    connectionPool  = mysql.createPool(config);
    return promiseQuery(connectionPool, 'SELECT 1 + 1 AS solution').catch((error) => {
        connectionPool = null;  //something went wrong, so we don't have a connection pool after all
        Logger.error('connectionPool', `Failed to verify SQL connection with parameters: ${
            JSON.stringify({user: config.user, host: config.host, database: config.database})
        }\nError: `, error);
        throw error;
    });
}

function getConnection(){
    if(connectionPool === null) {
        return Promise.reject(new Error('Connection pool not yet initialised'));
    }
    return new Promise((resolve, reject) => {
        connectionPool.getConnection((err, connection) => {
            if(err){
                Logger.error('ConnectionPoolError', 'Failed to get connection from pool:\n', err);
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

function hasConnection(){
    return connectionPool !== null;
}

module.exports = {
    getConnection,
    hasConnection,
    initialiseConnectionPoolFromConfig
};
