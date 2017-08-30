/**
This is a wrapper for the console logs at the moment. In the future I hope to integrate with with
a proper logging system;
*/

/**
Level: [alias]
0: error,
1: warn,
2: log,
3: info
4: debug
*/

let config = {
    logLevel:0,
    /*
    logToFile: false,
    logFilePath: null
    */
};

function setLogLevel(level){
    logLevel = level;
}


function formatLogMessage(tag, message){
    return `[${tag}] ${message}.`;
}

function error(tag, message, ...data){
    logMessage(0,tag, message, ...data);
}

function log(tag,message, ...data){
    logMessage(2,tag, message, ...data);
}

function warn(tag, message, ...data){
    logMessage(1,tag, message, ...data);
}

function info(tag, message, ...data){
    logMessage(3,tag, message, ...data);
}


function logMessage(level, tag, message, ...data) {
    if(logLevel <= level) {
        return;
    }

    const string = formatLogMessage(tag, message);

    switch(level) {
        case 0:
            console.error(string,...data);
        break;
    const string = formatLogMessage(tag, message);

    switch(level) {
        case 0:
            console.error(string,...data);
        break;
        case 1:
            console.warn(string,...data);
        break;
        case 2:
            console.log(string,...data);
        break;
        case 3:
            console.info(string,...data);
        break;
        case 4:
            console.info(string,...data);
        break;
    }

}

module.exports = {
    setLogLevel,
    error, warn, log, info
};
