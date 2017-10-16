const fs = require('fs');
const configHandler = require('../../util/configFileHandler');
const {LOG_LEVELS} = require('../../util/Logger');

const COMMAND_ROOT = 'config';

module.exports= (vorpalInstance) => {
    //Attach the commands:

    //the Create command:
    vorpalInstance.command(`${COMMAND_ROOT} create`, 'Create a configuration file for the system')
        //TODO: add flags for more information?
        .action(function(){
            const self = this;  //eslint-disable-line no-invalid-this
            const defaultSettings= configHandler.getDefaultConfig();
            return self.prompt([
                {
                    type: 'input',
                    name: 'server.port',
                    message: 'What port should the instance start on? ',
                    default: defaultSettings.server.port,
                    filter: (data) => {
                        return data === '' ? undefined : Number(data);
                    },
                    validate: (value) => {
                        value = Number.parseInt(value, 10);
                        if(!Number.isInteger(value)){
                            return 'Please enter a valid integer';
                        } else if(value > 65535 || value < 0){
                            return 'Please enter a valid port number between 0-65535';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'server.hostname',
                    message: 'Hostname for server? ',
                    default: defaultSettings.server.hostname,
                    filter: (data) => {
                        return data === '' ? undefined : data;
                    }
                },
                {
                    type: 'input',
                    name: 'mysql.host',
                    message: 'host for the mysql database: ',
                    default: defaultSettings.mysql.host
                },
                {
                    type: 'input',
                    name: 'mysql.user',
                    message: 'User for the mysql connection: ',
                    default: defaultSettings.mysql.user
                },
                {
                    type: 'password',
                    name: 'mysql.password',
                    message: 'Password for the mysql connection: ',
                    filter: (data) => {
                        return data === '' ? undefined : data;
                    }
                },
                {
                    type: 'input',
                    name: 'mysql.database',
                    message: 'Name of database to use: ',
                    default: defaultSettings.mysql.database
                },
                {
                    type: 'list',
                    name: 'logger.level',
                    message: 'Select a logging level: ',
                    choices: LOG_LEVELS,
                    default: defaultSettings.logger.level
                }
            ]).then((capturedConfig) => {
                //Put the config together
                const config = {
                    server: {
                        hostname: capturedConfig['server.hostname'],
                        port: capturedConfig['server.port']
                    },
                    mysql: {
                        host: capturedConfig['mysql.host'],
                        user: capturedConfig['mysql.user'],
                        password: capturedConfig['mysql.password'],
                        database: capturedConfig['mysql.database']
                    },
                    logger: {
                        level: capturedConfig['logger.level']
                    }
                };
                //Minimise it:
                return configHandler.minimiseConfig(config);
            }).then((config) => {
                //Create the file:
                fs.writeFileSync(configHandler.DEFAULT_CONFIG_PATH, JSON.stringify(config, null, '    '));
                self.log(`Configuration written to '${configHandler.DEFAULT_CONFIG_PATH}'`);
                return true;
            });

        });
};
