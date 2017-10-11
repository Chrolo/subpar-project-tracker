const {promiseQuery, stripNullFieldsFromResults} = require('./utils.js');

function getStaffInfoByName(connection, staffName) {
    return promiseQuery(connection, 'SELECT * FROM staff WHERE name=?;', [staffName])
        .then(stripNullFieldsFromResults)
        .then((results) => {
            return results[0];
        });
}

function getStaffInfoById(connection, id){
    return promiseQuery(connection, 'SELECT * FROM staff WHERE id=?;', [id])
        .then(stripNullFieldsFromResults)
        .then((results) => {
            return results[0];
        });
}

function getAllStaffInfo(connection){
    return promiseQuery(connection, 'SELECT * FROM staff;')
        .then(stripNullFieldsFromResults);
}

function getStaffNames(connection){
    return getAllStaffInfo(connection)
        .then(res => res.map(row => row.name));
}

module.exports = {
    getAllStaffInfo,
    getStaffNames,
    getStaffInfoByName,
    getStaffInfoById
};
