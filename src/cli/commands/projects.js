const {getStaffNames} = require('../../data/sql/staff');
const {getListOfProjects} = require('../../data/sql/projects');
const {createProjectFromTemplate} = require('../../data/projectProcessing');
const mysqlConnectionPool = require('../../util/mysqlConnectionPool');
require('../../util/myJs'); //dirty global hacks because I want Promise.props();

const COMMAND_ROOT = 'projects';

module.exports= (vorpalInstance) => {
    //Attach the commands:

    //The LIST command:
    vorpalInstance.command(`${COMMAND_ROOT} list`, 'List known projects')
        //TODO: add flags for more information?
        .action(function(){
            const self = this;  //eslint-disable-line no-invalid-this
            //check that we have a database connection:
            if(!mysqlConnectionPool.hasConnection()){
                self.log('Error: This command requires a database connection before it can be used.');
                return Promise.resolve(false);
            }
            return mysqlConnectionPool.getConnection()
                .then(getListOfProjects)
                .then((projects) => {
                    self.log(`Found ${projects.length} projects: `);
                    projects.forEach(name => self.log(`  ${name}`));
                    self.log('');
                });

        });

    //the Create command:
    vorpalInstance.command(`${COMMAND_ROOT} start`, 'Start a new project instance.')
        .action(function(){
            const self = this;  //eslint-disable-line no-invalid-this
            //check that we have a database connection:
            if(!mysqlConnectionPool.hasConnection()){
                self.log('Error: This command requires a database connection before it can be used.');
                return Promise.resolve(false);
            }

            return  mysqlConnectionPool.getConnection().then(connection => {

                return self.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Name of the project: ',
                        validate: function(data){
                            if(data === ''){
                                return 'Please enter a name for the project';
                            }
                            const done = this.async();
                            return getListOfProjects(connection, true)
                                .then(names => {
                                //Make sure the staff member exists
                                    return names.includes(data) ? `Another project exists with the name/alias '${data}'.`: true;
                                })
                                .then(done)
                                .catch(err => {
                                    throw err;
                                });
                        }
                    },
                    {
                        type: 'input',
                        name: 'episodeCount',
                        message: 'How many episodes is the project? ',
                        validate: (value) => {
                            if(value === ''){
                                return 'Please enter the episode count';
                            }
                            value = Number.parseInt(value, 10);
                            if(!Number.isInteger(value) || value < 0){
                                return 'Please enter a valid, positive integer';
                            }
                            return true;
                        },
                        filter: data => Number.parseInt(data, 10)
                    },
                    {
                        type: 'input',
                        name: 'projectLeaderName',
                        message: 'Who is the project leader? ',
                        filter: val => {
                            return (val ==='') ? null:val;
                        },
                        //*/
                        validate: function(data){
                            if(data === '') {
                                return 'Please enter a staff name';
                            }
                            const done = this.async();
                            return getStaffNames(connection)
                                .then(names => {
                                //Make sure the staff member exists
                                    return names.includes(data) ? true: `'${data}' is not a known staff member.`;
                                })
                                .then(done)
                                .catch(err => {
                                    throw err;
                                });
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
                        type: 'list',
                        name: 'projectType',
                        message: 'What type of project is this?',
                        choices: ["TV", "BD", "OVA", "FILM", "MISC"]
                    }
                ]).then((capturedConfig) => {

                    //Lets get task info:
                    self.log('Please enter task information:');
                    function captureAnotherTask(currentTasks =[]){

                        //Create the task filter funciton (because of shitty inquirer version in Vorpal)
                        const taskFilterFunc = (listStr) => {
                            if(listStr === ''){
                                return [];
                            }
                            const taskNames = listStr.split(/\s*,\s*/);
                            //convert names into ids:
                            return taskNames.map(name => {
                                return currentTasks.findIndex(task => task.taskName === name);
                            });
                        };

                        //Return the prompting function
                        return self.prompt([
                            {
                                type: 'input',
                                name: 'taskName',
                                message: 'Name of this task: ',
                                validate: function(taskName){
                                    //make sure it's not already listed
                                    return currentTasks.map(task => task.taskName).includes(taskName) ? `You've already specified a task named ${taskName}.`: true;
                                }
                            },
                            {
                                type: 'input',
                                name: 'staffName',
                                message: 'Who is responsible for this task? ',
                                filter: val => {
                                    return (val ==='') ? null:val;
                                },
                                //*/
                                validate: function(data){
                                    if(data === '') {
                                        return 'Please enter a staff name';
                                    }
                                    const done = this.async();
                                    return getStaffNames(connection)
                                        .then(names => {
                                        //Make sure the staff member exists
                                            return names.includes(data) ? true: `'${data}' is not a known staff member.`;
                                        })
                                        .then(done)
                                        .catch(err => {
                                            throw err;
                                        });
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
                                name: 'dependsOn',
                                message: 'What tasks, if any, does this one depend on? (Use a comma seperated list) ',
                                filter: taskFilterFunc,
                                validate: function(data){
                                    if(!(data instanceof Array)){
                                        //filter SHOULD'VE been called first, but I think this shitty old version of inquirer doesn't have that
                                        data = taskFilterFunc(data);
                                    }
                                    if(data.every(taskId => taskId !== -1)){
                                        return true;
                                    }
                                    return `One of the task names given was not found in the previous list of tasks. You currently have ${JSON.stringify(currentTasks.map((task => task.taskName)))}`;
                                }
                            },
                            {
                                input: 'confirm',
                                name: 'finalTask',
                                message: 'Is this the last task to add? ',
                                default: false
                            }
                        ]).then(taskInfo => {
                            const taskCopy = JSON.parse(JSON.stringify(taskInfo));
                            delete taskCopy.finalTask;              // delete the 'finalTask' field
                            taskCopy.id = currentTasks.length;      // Set the ID
                            currentTasks.push(taskCopy);

                            //Check if we need to go again:
                            if(taskInfo.finalTask){
                                return currentTasks;
                            }
                            self.log(`Current task list is ${JSON.stringify(currentTasks.map(task => task.taskName))}`);
                            return captureAnotherTask(currentTasks);
                        });
                    }
                    //Start asking for tasks
                    return captureAnotherTask().then((taskArray) => {
                        capturedConfig.defaultTasks = taskArray;
                        return capturedConfig;
                    });
                }).then((capturedConfig) => {
                //confirm the details:
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
                            return capturedConfig;
                        }
                        // if no, return null, so that next stage is skipped.
                        return null;
                    });
                }).then(projectTemplate => {
                    //Got a config then?
                    if(projectTemplate){
                    //Action the data:
                        return createProjectFromTemplate(connection, projectTemplate)
                            .then(() => {
                                connection.release();
                                return self.log(`Added new project: ${projectTemplate.name}`);
                            });
                    }
                    return null;
                }).catch(err => {
                    //if we've thrown to this level, drop the connection;
                    connection.release();
                    throw err;
                });
            });
        });
    //End of create commands
};
