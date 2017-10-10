const fs = require('fs');
const path = require('path');
const Logger = require('../../util/Logger.js');
const TABLES_FOLDER_PATH = path.resolve(__dirname, './tables/');

let databaseSchema = {};

function refreshSchemas() {
    const filesFound= fs.readdirSync(TABLES_FOLDER_PATH);
    if(filesFound.length > 0){
        //Define the database:
        databaseSchema = {
            name: 'subpar', //default database name
            tables: filesFound.reduce((acc, tableDefFile) => {
                const filePath = path.resolve(TABLES_FOLDER_PATH, tableDefFile);
                const tableSchema = require(filePath);
                acc[tableSchema.name] = tableSchema;
                return acc;
            }, {})
        };

    } else {
        Logger.error('dbDefLoader', `Could not find any table definitions in ${TABLES_FOLDER_PATH}`);
    }
}

function getTableSchema(tableName){
    return databaseSchema.tables[tableName];
}

//Call it to get initial schema load
refreshSchemas();
module.exports= {
    getTableSchema,
    databaseSchema,
    refreshSchemas
};
