const mysqlConnectionPool = require('../../util/mysqlConnectionPool');
// load user config
const config = require('../../util/configFileHandler').getConfig();

//Functions to setup the database:
const COMMAND_ROOT = 'database';

module.exports = (vorpalInstance) => {
    vorpalInstance.command(`${COMMAND_ROOT} connect [hostname] [user] [database]`, 'Connect to the database.')
        .option('-c, --config', 'Get the configuration from the config file')
        .action(function(args){
            const self = this;  //eslint-disable-line no-invalid-this
            if(args.options.config) {
                self.log('Attempting connection with config file settings.');
                return mysqlConnectionPool.initialiseConnectionPoolFromConfig(config.mysql)
                    .then(logConnectionSucess(self));
            }
            return self.prompt([
                {
                    type: 'input',
                    name: 'host',
                    message: 'Host of the database: ',
                    when: () => !args.hostname
                },
                {
                    type: 'input',
                    name: 'user',
                    message: 'Username for databse connection: ',
                    when: () => !args.user
                },
                {
                    type: 'input',
                    name: 'password',
                    message: 'Password for databse connection: ',
                    filter: (data) => {
                        return data === '' ? null: data;
                    }
                },
                {
                    type: 'input',
                    name: 'database',
                    message: 'Database to connect to: ',
                    when: () => !args.database,
                    default: config.mysql.database
                }
            ]).then((mysqlConfig) => {
                self.log('config is:', mysqlConfig);
                return mysqlConnectionPool.initialiseConnectionPoolFromConfig(mysqlConfig)
                    .then(logConnectionSucess(self));
            }).catch((err) => {
                self.log('Error connecting to databse: ', err);
            });
        });
};

function logConnectionSucess(vorpalInstance){
    return () => {
        vorpalInstance.log('Connection successful');
    };
}
