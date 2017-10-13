const permissionsValues = require('../../data/sql/permissions').FIELD_DATA;
const {getStaffNames, getStaffInfoByName, insertNewStaffMember} = require('../../data/sql/staff.js');
const mysqlConnectionPool = require('../../util/mysqlConnectionPool.js');
const Logger = require('../../util/Logger.js');

const COMMAND_ROOT = 'staff';

module.exports= (vorpalInstance) => {
    //Attach the commands:

    //The LIST command:
    vorpalInstance.command(`${COMMAND_ROOT} list`, 'List known staff members')
        //TODO: add flags for more information?
        .action(function(){
            const self = this;
            return mysqlConnectionPool.getConnection()
                .then(getStaffNames)
                .then((staffNames)=>{
                    staffNames.forEach(name => self.log(name));
                    self.log('');
                });

        });

    //the Create command:
    vorpalInstance.command(`${COMMAND_ROOT} add`, 'Add details of a new staff member.')
        .action(function(){
            const self = this;  //eslint-disable-line no-invalid-this
            return self.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'The main name of this staff member: ',
                    filter: val => {
                        return (val ==='') ? null:val;
                    },
                    //*/
                    validate: function(data){
                        if(data === '') {
                            return 'Please enter a staff name';
                        }
                        const done = this.async();
                        mysqlConnectionPool.getConnection()
                            .then(getStaffNames)
                            .then(names => {
                                //Make sure the staff member doesn't already exist
                                return names.includes(data) ? `'${data}' already exists as a member.` : true;
                            })
                            .then(done)
                            .catch(err => {throw err});
                    }
                    /*/ // I want to use Promises, but Vorpal locked itself down to Inquirer v0.11 o_o
                    //TODO: change to promise chain if vorpal ever updates.
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
                    message: 'Staff member\'s email: ',
                    validate: (value) => {
                        if(value===''){
                            return true;
                        }
                        const pass = value.match(/^[\w\d.+_-]+@(?:[\w\d-]+\.)*[\w]{2,}$/i);
                        if (pass) {
                            return true;
                        }
                        return 'Please enter a valid email address.';
                    },
                    filter: (val)=>{ return val===''? null: val;}
                },
                {
                    type: 'input',
                    name: 'ircName',
                    message: 'Their name on IRC: ',
                    filter: (val)=>{ return val===''? null: val;}
                },
                {
                    type: 'input',
                    name: 'discordTag',
                    message: 'Their discord tag (eg Bob#1234): ',
                    filter: (val)=>{ return val===''? null: val;}
                },
                {
                    type: 'input',
                    name: 'timezone',
                    message: 'What timezone are they in? ',
                    filter: (val)=>{ return val===''? null: val;},
                    //choices: //TODO Get list of available timezones
                }
            ]).then((capturedConfig) => {
                //Format the config into a nice format
                return capturedConfig;
                //confirm the details:
                self.log(config);
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
                        return config;
                    }
                    // if no, return null, so that next stage is skipped.
                    return null;
                });
            }).then((staffConfig) => {
                if(staffConfig){
                    //Action the data:
                    return mysqlConnectionPool.getConnection()
                        .then((connection) => {
                            return insertNewStaffMember(connection, staffConfig)
                            .then((res)=>{
                                return self.log(`Added new staff member: ${staffConfig.name}`);
                            })
                            .catch((err) => {
                                connection.release();
                                Logger.error('Cli:StaffAdd', 'Failure while adding new staff', err);
                                throw err;
                            });
                        });
                }
                return null;
            });
        });
    //End of create commands
};
