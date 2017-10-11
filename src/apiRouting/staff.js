const StaffRouter = require('express').Router(); //eslint-disable-line new-cap
const Logger = require('../util/Logger.js');
const mysqlConnectionPool = require('../util/mysqlConnectionPool.js');
const {getStaffNames, getStaffInfoByName} = require('../data/sql/staff.js');
const filter = require('../data/models/filter.js');

StaffRouter.get('/', (req, res) => {
    Logger.info('staffRoute GET /', 'Saw request');
    //Return a list of projects on the database:
    return mysqlConnectionPool.getConnection().then((connection) => {
        return getStaffNames(connection).then((results) => {
            connection.release();
            Logger.info('staffRouter GET /', `Sending ${results.length} results.`);
            return res.send(results);
        }).catch((err) => {
            connection.release();
            return Promise.reject(err);
        });
    })
        .catch((err) => {
            Logger.error('GET /staff/', 'Error when retrieving list of projects', err);
            return res.status(500).send();
        });
});

StaffRouter.get('/:staffName', (req, res) => {
    Logger.info('GET staff/:staffName', 'Saw project request with params:', req.params);
    return mysqlConnectionPool.getConnection().then((connection) => {
        return getStaffInfoByName(connection, req.params.staffName).then((result) => {
            if(result === null){
                connection.release();
                return res.status(404).send();
            }
            Logger.silly('GET staff/:staffName', `Got raw project data as:`, JSON.stringify(result));

            //filter the result by project_schema.json
            result = filter(result, 'staffMember_schema.json', req.apiPermission.permissions.dataViewLevel);
            //then send it
            connection.release();
            return res.send(result);

        }).catch((err) => {
            connection.release();
            return Promise.reject(err);
        });
    })
        .catch((err) => {
            Logger.error('GET staff/:staffName', `Error when retrieving staff info for '${req.params.staffName}'`, err);
            return res.status(500).send();
        });
});

module.exports = StaffRouter;
