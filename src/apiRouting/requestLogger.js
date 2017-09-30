const Logger = require('../util/Logger.js');

module.exports = (req, res, next) => {
    Logger.info('RequestLogger', `${req.method} ${req.originalUrl} from ${req.hostname}`);
    next();
};
