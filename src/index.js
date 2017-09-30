const app = require('express')();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const argv = require('./argumentHandler.js');
const Logger = require('./util/Logger.js');

/* config */
const config = require('./configFileLoader.js')(argv.config);
//Setup the Logger:
Logger.setLogLevel(config.logger.level);
Logger.debug('config', 'Starting with configuration of', config);

// App Startup:

//get database Connection pool ready:
const connectionPool  = mysql.createPool(config.mysql);

//verify connection and exit if failed:
new Promise((res, rej) => {
    Logger.info('mysqlConnection', `Verifying connection to ${config.mysql.user}@${config.mysql.host}`);
    connectionPool.query('SELECT 1 + 1 AS solution', (error) => {
        if (error) {
            Logger.error('mysqlConnection', `Failed to verify SQL connection with parameters: ${
                JSON.stringify({user: config.mysql.user, host: config.mysql.host, database: config.mysql.database})
            }\nError: `, error);
            process.exit(1);
            rej();
        } else {
            Logger.info('mysqlConnection', 'Database Connection successful.');
            res();
        }
    });
}).then(() => {
    Logger.info('ServerStartup', 'Creating server instance');
    //add some core express parts
    app.use(bodyParser.json());

    //Import and assign routers:
    const RequestLogger = require('./apiRouting/requestLogger.js');
    const ApiKeyRouter = require('./apiRouting/apiKeyRouter.js')(connectionPool);
    const ProjectsRouter = require('./apiRouting/projects.js')(connectionPool);
    const EpisodesRouter = require('./apiRouting/episodes.js')(connectionPool);

    app.use('*', RequestLogger);
    app.use('*', ApiKeyRouter);
    app.use('/projects', ProjectsRouter);
    app.use('/episodes', EpisodesRouter);
    Logger.info('ServerStartup', 'Routers applied');

    Logger.info('ServerStartup', 'Starting server');
    app.listen(config.server.port, config.server.hostname, () => {
        Logger.info('ServerStartup', `API started listening on ${config.server.hostname ? config.server.hostname:''}:${config.server.port}`);
    });
}).catch((err) => {
    Logger.error('ServerStartup', 'An Unhandled exception occured:\n', err);
    process.exit(1);
});
