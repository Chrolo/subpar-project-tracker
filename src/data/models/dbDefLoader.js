const fs = require('fs');
const path = require('path');
const TABLES_FOLDER_PATH = path.resolve(__dirname,'./tables/');


let databaseSchema = {};

function refreshSchemas() {
    const filesFound= fs.readdirSync(TABLES_FOLDER_PATH);
    if(filesFound.length > 0){
        databaseSchema = {
            name: 'subpar', //default database name
            tables: filesFound.map((tableDefFile)=>{
                const filePath = path.resolve(TABLES_FOLDER_PATH,tableDefFile);
                const fileContent = fs.readFileSync(filePath, "utf8");
                try{
                    return JSON.parse(fileContent);
                } catch (err) {
                    console.error(`[JsonFileLoader] File '${filePath}' could not be parsed.`, err);
                    return void 0;
                }
            })
        };

    } else {
            console.error('[dbDefLoader] Could not find any table definitions in: ', TABLES_FOLDER_PATH);
    }
}

function getTableSchema(tableName){
    return schemas.tables.find( tableObject => tableObject.name == tableName);
}

//Call it to get initial schema load
refreshSchemas();
module.exports= {
    getTableSchema,
    databaseSchema,
    refreshSchemas
};
