//Puts together all the scheamas in this folder:
const fs = require('fs');
const path = require('path');


let schemas = {};

function refreshSchemas() {
    const filesFound= fs.readdirSync(__dirname);
    
    if(filesFound.length > 0){
        //For each file, add it to the schemas:
        schemas = filesFound.reduce((acc,fileName)=>{
            if(fileName !== 'index.js'){
                acc[fileName] = require(path.resolve(__dirname,fileName));
            }
            return acc;
        },{});
    } else {
            console.error('[SchemaLoader] Could not find any schemas in: ', __dirname);
    }
}

//Call it to get initial schema load
refreshSchemas();
module.exports= {
    schemas,
    refreshSchemas
};
