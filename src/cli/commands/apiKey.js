const permissionsValues = require('../../data/sql/permissions').FIELD_DATA;
const {createNewApiKey, getListOfApiKeys} = require('../../data/sql/api_keys.js');
const {getStaffNames} = require('../../data/sql/staff.js');
const mysqlConnectionPool = require('../../util/mysqlConnectionPool.js');
const Logger = require('../../util/Logger.js');

const APIKEY_COMMAND_ROOT = 'apiKey';

module.exports= (vorpalInstance) => {
    //Attach the commands:

    //the Create command:
    vorpalInstance.command(`${APIKEY_COMMAND_ROOT} create`, 'Create a new api key for a user')
        .action(function(){
            const self = this;  //eslint-disable-line no-invalid-this
            return self.prompt([
                {
                    type: 'list',
                    name: 'staffName',
                    message: 'Staff member this key is assigned to (if any): ',
                    filter: val => {
                        return (val ==='(none)') ? null:val;
                    },
                    //*/
                    choices: function(){
                        const done = this.async();
                        mysqlConnectionPool.getConnection()
                            .then(getStaffNames)
                            .then( staff => staff.concat('(none)'))
                            .catch(err => console.error(err))
                            .then(done);
                    }
                    /*/ // I want to use Promises, but vorpal locked itself down to Inquirer v0.11 o_o
                    choices: function (){
                        return new Promise(res=>res(['bob']));
                        return mysqlConnectionPool.getConnection().then(getStaffNames)
                            .then((staff)=>{
                                return staff.concat('');
                            });
                    }
                    //*/
                },
                {
                    type: 'input',
                    name: 'email',
                    message: 'API token user\'s email: ',
                    validate: (value) => {
                        const pass = value.match(/^[\w\d.+_-]+@(?:[\w\d-]+\.)*[\w]{2,}$/i);
                        if (pass) {
                            return true;
                        }
                        return 'Please enter a valid email address.';
                    }
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'description of this token (how will it be used? where?, etc)',
                    filter: val => {
                        return (val ==='') ? null:val;
                    }
                },
                {
                    type: 'list',
                    name: 'dataViewLevel',
                    message: 'What dataViewLevel should this API token have?',
                    choices: permissionsValues.dataViewLevel
                },
                {
                    type: 'list',
                    name: 'taskUpdate',
                    message: 'What kind of tasks should it be able to update?',
                    choices: permissionsValues.taskUpdate
                },
                {
                    type: 'list',
                    name: 'projectDetailUpdate',
                    message: 'What kind of projects should it be able to update?',
                    choices: permissionsValues.projectDetailUpdate
                },
                {
                    type: 'confirm',
                    name: 'projectCreation',
                    message: 'Can this user create new projects?',
                    default: false
                },
                {
                    type: 'confirm',
                    name: 'apiTokenCreate',
                    message: 'Can this user create new api tokens using the Api?',
                    default: false
                },
                {
                    type: 'confirm',
                    name: 'apiTokenRevoke',
                    message: 'Can this user revoke Api tokens?',
                    default: false
                }
            ]).then((capturedConfig) => {
                //Format the config into a nice format
                return {
                    description: capturedConfig.description,
                    staffName: capturedConfig.staffName,
                    email: capturedConfig.email,
                    permissions: {
                        dataViewLevel: capturedConfig.dataViewLevel,
                        taskUpdate: capturedConfig.taskUpdate,
                        projectDetailUpdate: capturedConfig.projectDetailUpdate,
                        projectCreation: capturedConfig.projectCreation,
                        apiTokenCreate: capturedConfig.apiTokenCreate,
                        apiTokenRevoke: capturedConfig.apiTokenRevoke
                    }
                };
            }).then((tokenConfig) => {
                //confirm the details:
                self.log(tokenConfig);
                return self.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmation',
                        message: 'Are the above details correct?',
                        default: true
                    }
                ]).then(data => {
                    //check confirmation
                    if(data.confirmation){
                        return tokenConfig;
                    }
                    // if no, return null, so that next stage is skipped.
                    return null;
                });
            }).then((tokenConfig) => {
                if(tokenConfig){
                    //Action the data:
                    return mysqlConnectionPool.getConnection()
                        .then((connection) => {
                            return createNewApiKey(connection, tokenConfig).then((newApiKey) => {
                                self.log(`New Api token created: ${newApiKey}`);
                            }).catch((err) => {
                                connection.release();
                                Logger.error('Cli:ApiTokenCreate', 'Failure while creating new API token', err);
                                throw err;
                            });
                        });
                }
                return null;
            });
        });
    //End of create command

    vorpalInstance.command(`${APIKEY_COMMAND_ROOT} revoke [apiToken]`, 'Used to revoke an API token. Token can be given as an argument if known.')
        .autocomplete({
            data: () => mysqlConnectionPool.getConnection().then(getListOfApiKeys)
        })
        .action(function(){
            const self = this;  //eslint-disable-line no-invalid-this
            self.log('NOT IMPLEMENTED');
            return Promise.reject();
        });
};
