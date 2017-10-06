const path = require('path');
const fs = require('fs');
const Logger = require('./util/Logger.js');

//Setup the default config
const defaultSettings = {
    mysql: {
        user: 'subpar',
        host: 'localhost',
        database: 'subpar',
        connectionLimit: 10
    },
    logger: {
        level: 'info'
    },
    server: {
        port: 8080,
        hostname: void 0    //undefined
    }
};

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '../config.json');

let instanceSettings= defaultSettings;

function loadSettingsFromFile(configFile = DEFAULT_CONFIG_PATH){
    if(!configFile || typeof configFile !== 'string'){
        throw new TypeError(`Config file path must be string, was ${configFile} ${typeof configFile}.`);
    }

    //If non-default specified, resolve relative to process:
    if(configFile !== DEFAULT_CONFIG_PATH){
        configFile = path.resolve(process.cwd(), configFile);
    }

    let loadedFile = {};
    //load in the file (if it exists)
    if(fs.existsSync(configFile)){
        Logger.info('ConfigFileLoader', `Attempting to load from '${configFile}'`);
        try{
            loadedFile = require(configFile);
        } catch (err) {
            Logger.error(`ConfigFileLoader`, `File '${configFile}' could not be parsed.`, err);
            process.exit(1);
        }
    } else {
        Logger.warn(`ConfigFileLoader`, `No config file found. Assuming defaults.`);
    }

    //Set the new settings:
    instanceSettings = deepMergeObject(defaultSettings, loadedFile);
    return getConfig(); //for convienence, we return the settings to the user.
}

function getConfig(){
    //a copy of the settings, so they don't fuck shit up
    return JSON.parse(JSON.stringify(instanceSettings));
}

// Note, properties in object2 overwrite those in object2
function deepMergeObject(object1, object2){
    //deep clone object1
    const newObject = JSON.parse(JSON.stringify(object1));

    Object.keys(object2).forEach(key => {
        if(typeof newObject[key] === 'undefined'){
            newObject[key] = JSON.parse(JSON.stringify(object2[key]));
        } else if (typeof newObject[key] !== typeof object2[key]) {
            Logger.error(`ConfigFileLoader`, `Type mismatch in config. ${key} was seen as ${newObject[key]}(${typeof newObject[key]}) and ${object2[key]}(${typeof object2[key]})`);
        } else {
            if(typeof object2[key] === 'object'){
                newObject[key] = deepMergeObject(newObject[key], object2[key]);
            } else {
                newObject[key] = object2[key];
            }
        }
    });

    return newObject;

}

module.exports = {
    loadSettingsFromFile,
    getConfig
};
