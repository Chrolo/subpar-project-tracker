//Puts together all the commands in this folder:
const fs = require('fs');
const path = require('path');
const Logger = require('../../util/Logger.js');

function loadCommands(vorpalInstance) {
    const filesFound= fs.readdirSync(__dirname);

    if(filesFound.length > 0){
        //For each file, add it to the schemas:
        filesFound.forEach((fileName) => {
            if(fileName !== 'index.js'){
                require(path.resolve(__dirname, fileName))(vorpalInstance);
            }
        });
    } else {
        Logger.error('Cli command loader', `Could not find any commands in ${__dirname}`);
    }
}

module.exports= loadCommands;
