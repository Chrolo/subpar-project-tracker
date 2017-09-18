const path = require('path');
const fs = require('fs');
const Logger = require('../../util/Logger.js');
const outputStruct = require('./dbDefLoader.js').databaseSchema;
const OUTPUT_FILE = path.resolve(__dirname, '../../../docs/database.json');
//Get as a string:
const outputString = JSON.stringify(outputStruct, null, '    ');
fs.writeFileSync(OUTPUT_FILE, outputString);
Logger.log('Finished writing database definition to: ', OUTPUT_FILE);
