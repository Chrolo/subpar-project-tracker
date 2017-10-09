require('../../util/myJs'); //I need Object.map();
const {createInsertionObject, promiseQuery} = require('./utils.js');
const Logger = require('../../util/Logger');

//---------------------------------------------
//functions
function getPermissionsForId(connection, id) {
    if(!Number.isFinite(id)){
        Logger.error('getPermissionsForId', `Expected numeric Id, got ${id} <${typeof id}>`);
        return {};
    }
    return promiseQuery(connection, 'SELECT * FROM permissions WHERE id = ?;', [id]).then((results) => {
        if(results.length !== 1){
            Logger.error(`Permissions Error`, `Expected one row for permissionsId ${id}, got ${results.length}`);
            return {};
        }
        delete results[0].id;   //useless tag now
        return convertSQLPermissionsToEnums(results[0]);
    });
}

function insertNewPermissionsRule(connection, permissions){
    if(!permissions){
        throw new TypeError(`permissions must be specifed. Got '${permissions}'`);
    }
    //convert permissions to sql storage types:
    const sqlPermissions = convertEnumPermissionsToSql(permissions);
    const insertionObject = createInsertionObject('permissions', [sqlPermissions]);
    return promiseQuery(connection, insertionObject.sql, insertionObject.data);
}

function convertSQLPermissionsToEnums(sqlResultObject){
    return Object.map(sqlResultObject, (val, key) => {
        return convertSqlToEnum(key, val);
    });
}

function convertEnumPermissionsToSql(permissions){
    return Object.map(permissions, (val, key) => {
        return convertEnumToSql(key, val);
    });
}

//---------------------------------------------
// Data Constants

const DATA_LEVELS = [
    'public',
    'staff',
    'admin',
    'debug'
];
const OWNERSHIPS = ['none', 'own', 'all'];
const BOOLEAN = [false, true];

const FIELD_DATA = {
    dataViewLevel: DATA_LEVELS,
    taskUpdate: OWNERSHIPS,
    projectDetailUpdate: OWNERSHIPS,
    projectCreation: BOOLEAN,
    apiTokenCreate: BOOLEAN,
    apiTokenRevoke: BOOLEAN
};

function convertSqlToEnum(fieldName, value){
    if(FIELD_DATA[fieldName]){
        return FIELD_DATA[fieldName][value];
    }
    Logger.warn('permissions', `Permissions field name '${fieldName}' not known. Use one of ${Object.keys(FIELD_DATA)}`);
    return void 0;
}

function convertEnumToSql(fieldName, enumVal){
    if(!FIELD_DATA[fieldName]){
        Logger.warn('permissions', `Permissions field name '${fieldName}' not known. Use one of ${Object.keys(FIELD_DATA)}`);
        return void 0;
    }

    const index = FIELD_DATA[fieldName].indexOf(enumVal);
    if(index === -1){
        throw new TypeError(`Permissions field name '${fieldName}' does not have permission level ${enumVal}. Use one of ${FIELD_DATA[fieldName]}`);
    }
    return index;
}
//for the system output, we'll filter it to just be the JS values of above, but with CAPITAL KEYS
const ENUMS = Object.map(FIELD_DATA, (val) => {
    //from the array of values, create
    return val.reduce((acc, enumVal) => {
        const enumString = `${enumVal}`.toUpperCase(); //Force it to a string
        acc[enumString] = enumVal;
        return acc;
    }, {});
});
//---------------------------------------------

module.exports = {
    convertSqlToEnum,
    convertEnumToSql,
    ENUMS,
    getPermissionsForId,
    insertNewPermissionsRule
};
