const {getTableSchema} = require('../models/dbDefLoader.js');
const Logger = require('../../util/Logger.js');

function createInsertStringForData(tableName, rows){
    //Check table is known to us:
    const tableSchema = getTableSchema(tableName);

    if(!tableSchema){
        Logger.error(`sql/util::createInsertForData`, `Table '${tableName}' is not specified in schemas.`);
        return null;
    }

    //get fields:
    const fields = tableSchema.fields;
    const fieldString = `(${fields.map(field => field.name).join()})`;

    const values = [];
    const stringSections = [];
    const stringSection = `(${fields.map(() => '?').join()})`;

    rows.forEach((row) => {
        fields.forEach(field => {
            values.push(prepareDataForInsert(row[field.name], field.type));
        });
        stringSections.push(stringSection);
    });

    return {
        fieldString,
        values,
        string: stringSections.join()
    };
}

function createInsertionObject(tableName, rows){
    if(!(rows instanceof Array)){
        rows = [rows];
    }

    const insertionData = createInsertStringForData(tableName, rows);
    if(!insertionData) {
        return null;
    }

    return {
        sql: `INSERT INTO ${tableName} ${insertionData.fieldString} VALUES ${insertionData.string};`,
        data: insertionData.values
    };
}

/**
This is here to make sure data is in the correct type for the mysql parser to process and escape it.
it does not perform escaping itself.
*/
function prepareDataForInsert(data, dataType) {
    if(!dataType){
        Logger.warn('[sql/util::prepareDataForInsert]', `No data type given for value ${data}. Returning unchanged.`);
        return data;
    }

    if(data === null || data === void 0) {
        return null;
    }

    //Strip out any SQL length declarations
    dataType = dataType.replace(/\(\d+\)/, '');

    switch(dataType){
        case 'TEXT':
        case 'VARCHAR':
        case 'CHAR':
            return `${data}`;

        case 'INT':
            if(!Number.isFinite(data)){
                return null;
            }
            return Math.floor(data);

        case 'DATE':
        case 'DATETIME':
            if(typeof data === 'string'){
                //if string, check is correct format
                const date = Date.parse(data);
                if(date){
                    return new Date(data);
                }
                Logger.error('sql/util::prepareDataForInsert', `invalid string for date type: Expected 'yyyy-mm-dd', got '${data}'`);
                return null;

            } else if (data instanceof Date) {
                //if Date object, all is good
                return data;
            }
            break;

        default:
            Logger.warn('sql/util::prepareDataForInsert', `Unknown dataType ${dataType}.`);
    }
    //unprocessed:
    return data;
}

function promiseQuery(connection, ...args){
    return new Promise((resolve, reject) => {
        connection.query(...args, (err, res, fields) => {
            if(err){
                reject(err);
            } else {
                resolve(res, fields);
            }
        });
    });
}

function convertInsertResultToNewIdsArray(insertResult){
    const initialInsertId = insertResult.insertId;
    const insertedRows = insertResult.affectedRows;
    return new Array(insertedRows).fill(null).map((v, i) => ((initialInsertId)+i));
}

function stripNullFieldsFromResults(results, ignoredFields = []){
    return results.map((result) => {
        return Object.keys(result).reduce((acc, key) => {
            if(result[key] !== null || ignoredFields.includes(key)){
                acc[key] = result[key];
            }
            return acc;
        }, {});
    });
}

module.exports = {
    createInsertionObject,
    createInsertStringForData,
    convertInsertResultToNewIdsArray,
    prepareDataForInsert,
    promiseQuery,
    stripNullFieldsFromResults
};
