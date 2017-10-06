const EpisodesRouter = require('express').Router(); //eslint-disable-line new-cap
const Logger = require('../util/Logger.js');
//const mysqlConnectionPool = require('../util/mysqlConnectionPool.js');

EpisodesRouter.get(/\/(\d+)/, (req, res) => {
    Logger.info('[EpisodesRouter]', `Saw call to ${req.url} with params ${req.params}`);
    return res.status(501).send();
});

module.exports = EpisodesRouter;
