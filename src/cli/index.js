const vorpal = require('vorpal')();
const argv = require('../argumentHandler');
const Logger = require('../util/Logger');
const mysqlConnectionPool = require('../util/mysqlConnectionPool');

/* config */
//Setup the Logger:
Logger.setLogLevel('warn', true);
// load user config
const config = require('../configFileLoader').loadSettingsFromFile(argv.config);

// App Startup:
//get database Connection pool ready:
mysqlConnectionPool.initialiseConnectionPoolFromConfig(config.mysql)
    .then(() => {
        //Setup the CLI
        require('./commands/index')(vorpal);
        //Start up the CLI
        vorpal
            .delimiter('subpar$')
            .show();
    });
