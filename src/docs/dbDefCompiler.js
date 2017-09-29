const path = require('path');
const fs = require('fs');
const outputStruct = require('../data/models/dbDefLoader.js').databaseSchema;
const OUTPUT_FILE = path.resolve(__dirname, '../../docs/database.json');
//Get as a string:
const outputString = JSON.stringify(outputStruct, null, '    ');
fs.writeFileSync(OUTPUT_FILE, outputString);
console.log('Finished writing database definition to: ', OUTPUT_FILE);   //eslint-disable-line no-console
