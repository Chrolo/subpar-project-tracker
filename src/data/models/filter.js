//imports
const Logger = require('../../util/Logger.js');
const schemas = require('./dataSchemas/index.js').schemas;
//const validators = require('./validators.js');

const FILTER_LEVELS = ["public", "staff", "admin", "debug"];
const ASSUMED_LEVEL = 'debug';

const Ajv = require('ajv');

function shouldBeIncluded(permissionLevelGiven, dataLevelRequired){
    if(!dataLevelRequired) {
        dataLevelRequired=ASSUMED_LEVEL;
    }
    return FILTER_LEVELS.indexOf(dataLevelRequired) <= FILTER_LEVELS.indexOf(permissionLevelGiven);
}

function filterObjectBySchemaIdAndAccess(object, schemaId, accessLevel){
    Logger.debug('Filter', `About to filter using schema ${schemaId} at dataLevel ${accessLevel}`);
    if(!FILTER_LEVELS.includes(accessLevel)){
        throw new Error(`Access level "${accessLevel}" is unknown to the system. Try one of ${JSON.stringify(FILTER_LEVELS)}`);
    }
    if(!Object.keys(schemas).includes(schemaId)){
        throw new Error(`Schema "${schemaId}" is unknown to the system. Try one of ${JSON.stringify(Object.keys(schemas))}`);
    }

    //create copy of object to return
    const returnedObject = JSON.parse(JSON.stringify(object));

    //create an AJV instance for this call:
    const ajv = new Ajv({
        allErrors: false, //might want to set to true if debugging
        verbose: false,
        jsonPointers: true,
        removeAdditional: 'all'     // this option will do our filtering for us
    });

    //Add the dataLevel keyword:
    ajv.addKeyword('dataLevel', {
        modifying: true,
        compile: function (sch) {
            if(shouldBeIncluded(accessLevel, sch)){
                return () => true;
            }
            return (data, path, obj, propName) => {
                delete obj[propName]; //The data removal function
                return true;
            };

        }
    });

    //It'll need ALL the schemas:
    Object.keys(schemas).forEach((aSchemaId) => {
        ajv.addSchema(schemas[aSchemaId]);
    });

    const validate = ajv.compile(schemas[schemaId]);
    const result = validate(returnedObject);

    if(result){
        return returnedObject;
    }

    const message = `Something went wrong filtering for ${schemaId}. Filter returned false.`;
    Logger.error('Filter', message, validate.errors);
    Logger.silly('Filter', 'original object was:', JSON.stringify(object, null, '  '));
    throw new Error(message);

}

module.exports= filterObjectBySchemaIdAndAccess;
