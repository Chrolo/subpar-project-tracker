const app = require('express')();
const bodyParser = require('body-parser');
const argv = require('./argumentHandler.js');
const Logger = require('./util/Logger.js');
const mysqlConnectionPool = require('./util/mysqlConnectionPool.js');

/* config */
const config = require('./configFileLoader.js').loadSettingsFromFile(argv.config);
//Setup the Logger:
Logger.setLogLevel(config.logger.level);
Logger.debug('config', 'Starting with configuration of', config);

// App Startup:
//get database Connection pool ready:
mysqlConnectionPool.initialiseConnectionPoolFromConfig(config.mysql)
    .catch((err) => {
        Logger.error('DatabaseConnectionPoolCreation', err);
        process.exit(1);    //We can't run the server without the database, so exit now.
    })
    .then(() => {
        Logger.info('ServerStartup', 'Creating server instance');
        //add some core express parts
        app.use(bodyParser.json());

        //Import and assign routers:
        const RequestLogger = require('./apiRouting/requestLogger.js');
        const ApiKeyMiddleware = require('./apiRouting/apiKeyMiddleware.js');
        const ApiKeyRouter = require('./apiRouting/apiKeyRouter.js');
        const ProjectsRouter = require('./apiRouting/projects.js');
        const EpisodesRouter = require('./apiRouting/episodes.js');

        app.use('*', RequestLogger);
        app.use('*', ApiKeyMiddleware);

        app.use('/api-keys', ApiKeyRouter);
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
