const {promiseQuery} = require('./utils.js');
const Logger = require('../../util/Logger.js');

//---------------------------------------------
//functions
function getPermissionsForId(connection, id) {
    if(!Number.isFinite(id)){
        Logger.error('getPermissionsForId', `Expected numeric Id, got ${id} <${typeof id}>`);
        return {};
    }
    return promiseQuery(connection, 'SELECT * FROM permissions WHERE id = ?;', [id]).then((results) => {
        if(results.length !== 1){
            Logger.error(`Permissions Error`, `Expected one frow for permissionsId ${id}, got ${results.length}`);
            return {};
        }
        delete results[0].id;   //useless tag now
        return convertSQLPermissionsToEnums(results[0]);
    });
}

function convertSQLPermissionsToEnums(sqlResultObject){
    return Object.keys(sqlResultObject).reduce((acc, key) => {
        acc[key] = convertDataType(sqlResultObject[key], key);
        return acc;
    }, {});
}

//---------------------------------------------
// Data Constants

const DATA_LEVELS = {
    PUBLIC: {js: 'public', sql: 0},
    STAFF: {js: 'staff', sql: 1},
    ADMIN: {js: 'admin', sql: 2},
    DEBUG: {js: 'debug', sql: 3}
};
const OWNERSHIPS = {
    NONE: {js: null, sql: 0},
    OWN: {js: 'own', sql: 1},
    ALL: {js: 'all', sql: 2}
};
const BOOLEAN = {
    TRUE: {js: true, sql: 0},
    FALSE: {js: false, sql: 1}
};

const FIELD_DATA = {
    dataViewLevel: DATA_LEVELS,
    taskUpdate: OWNERSHIPS,
    projectDetailUpdate: OWNERSHIPS,
    projectCreation: BOOLEAN,
    apiTokenCreate: BOOLEAN,
    apiTokenRevoke: BOOLEAN
};

function filterToJsValues(dataObject){
    return dataObject.js;
}
function filterToSqlValues(dataObject){ //eslint-disable-line no-unused-vars
    return dataObject.sql;
}
function convertDataType(value, fieldName, from= 'sql', to = 'js'){
    if(FIELD_DATA[fieldName]){
        const fieldType = FIELD_DATA[fieldName];
        const enumData = Object.keys(fieldType).find(possibleEnumKey => fieldType[possibleEnumKey][from]===value);
        const definition = fieldType[enumData];
        if(definition){
            return definition[to];
        }
        return void 0; //given data for mapping undefined

    }
    Logger.error('permissions', `Field name '${fieldName}' Not declared.`);
    return void 0;

}

//for the system output, we'll filter it to just be the JS values of above
const ENUMS = Object.keys(FIELD_DATA).reduce((acc, field) => {
    const dataType = FIELD_DATA[field];
    const reducedDataType = Object.keys(dataType).reduce((acc2, key) => {
        acc2[key] = filterToJsValues(dataType[key]);
        return acc2;
    }, {});
    acc[field] = reducedDataType;
    return acc;
}, {});
//---------------------------------------------

module.exports = {
    ENUMS,
    convertDataType,
    getPermissionsForId
};
