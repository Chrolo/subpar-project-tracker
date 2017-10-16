const vorpal = require('vorpal')();
const argv = require('../argumentHandler');
const Logger = require('../util/Logger');

/* config */
//Setup the Logger:
Logger.setLogLevel('warn', true);
// load user config
require('../util/configFileHandler').loadSettingsFromFile(argv.config);

//Setup the CLI
require('./commands/index')(vorpal);
//Start up the CLI
vorpal
    .delimiter('subpar$')
    .show();
