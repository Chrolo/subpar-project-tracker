const app = require('express')();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const argv = require('./argumentHandler.js');

/* config */
const config = require('./configFileLoader.js')(argv.config);

// App Startup:

    //get database Connection pool ready:
    const connectionPool  = mysql.createPool(config.mysql);

//verify connection and exit if failed:
new Promise((res,rej)=>{
    console.info(`Verifying connection to ${config.mysql.user}@${config.mysql.host}`);
    connectionPool.query('SELECT 1 + 1 AS solution', (error) => {
        if (error) {
            console.error('[Startup] Failed to verify SQL connection',
            '\nwith parameters:', {
                user: config.mysql.user,
                host: config.mysql.host,
                database: config.mysql.database

            },
            '\nError: ',error);
            process.exit(1);
            rej();
        } else {
            console.info('Database Connection successful.');
            res();
        }
    });
}).then(()=>{
    console.info('Creating server instance');
    //add some core express parts
    app.use(bodyParser.json());

    //Import and assign routers:
    const ApiKeyRouter = require('./apiRouting/apiKeyRouter.js')(connectionPool);
    const ProjectsRouter = require('./apiRouting/projects.js')(connectionPool);
    const EpisodesRouter = require('./apiRouting/episodes.js')(connectionPool);

    app.use('*',ApiKeyRouter);
    app.use('/projects',ProjectsRouter);
    app.use('/episodes', EpisodesRouter);
    console.log('Routers applied');

    console.info('Starting server');
    app.listen(config.server.port, ()=>{
        console.log(`[SubPar] API started on port ${config.server.port}`);
    });
}).catch((err)=>{
    console.error('An Unhandled exception occured:\n', err);
    process.exit(1);
});
