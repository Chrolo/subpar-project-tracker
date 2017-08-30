const path = require('path');
const fs = require('fs');
const outputStruct = require('./dbDefLoader.js').schemas;
const OUTPUT_FILE = path.resolve(__dirname, './database.json');
//Get as a string:
const outputString = JSON.stringify(outputStruct, null, '  ');
fs.writeFileSync(OUTPUT_FILE, outputString);
console.log('Finished writing database definition to: ', OUTPUT_FILE);
