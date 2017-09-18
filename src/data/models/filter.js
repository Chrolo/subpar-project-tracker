//imports
const Logger = require('../../util/Logger.js');
const schemas = require('./dataSchemas/index.js').schemas;
//const validators = require('./validators.js');

const FILTER_LEVELS = ["public", "staff", "admin", "debug"];
const ASSUMED_LEVEL = 'debug';

const Ajv = require('ajv');

function filterSchemaByDataLevel(initialSchema, datalevel){
    //Takes from global `schema` def to fill in $refs
    if(typeof initialSchema !== 'object'){
        return initialSchema;
    }

    //Arrays must be treated differently
    if(initialSchema instanceof Array){
        return initialSchema.map((arr) => {
            return filterSchemaByDataLevel(arr, datalevel);
        });
    }

    //It's an object!
    if(initialSchema.properties){
        //I'm using the 'properties' key to find object definitions, where I can strip out fields if needed.
        const propertyKeys = Object.keys(initialSchema.properties);
        //now i'm going to generate a new set of properties, stripping out the ones to be filtered out.
        initialSchema.properties = propertyKeys.reduce((acc, propertyKey) => {
            let fieldDef = initialSchema.properties[propertyKey];
            const fieldDataLevel = Object.keys(fieldDef).includes('dataLevel') ? fieldDef.dataLevel : ASSUMED_LEVEL;
            if(shouldBeIncluded(fieldDataLevel, datalevel)){
                if(fieldDef.type === 'object' || fieldDef.properties){
                    //it should be included, but if it's an object, should all it's children?
                    fieldDef = filterSchemaByDataLevel(fieldDef, datalevel);
                }
                acc[propertyKey] = fieldDef;
            }
            return acc;
        }, {});

        return initialSchema;
    }
    // for non-object definitions, loop through each key:
    return Object.keys(initialSchema).reduce((acc, key) => {
        acc[key] = filterSchemaByDataLevel(initialSchema[key], datalevel);
        return acc;
    });

}

function shouldBeIncluded(dataLevel, permissionLevel){
    if(!dataLevel) {
        dataLevel=ASSUMED_LEVEL;
    }
    return FILTER_LEVELS.indexOf(dataLevel) <= FILTER_LEVELS.indexOf(permissionLevel);
}

function filterObjectBySchemaIdAndAccess(object, schemaId, accessLevel){
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
        extendRefs: 'fail',
        removeAdditional: 'all'     // this option will do our filtering for us
    });

    //Filter and add all the schemas
    const schemaCopies = {};
    Object.keys(schemas).forEach((schemaId_2) => {      //eslint-disable-line camelcase
        //copy schema to stop it fucking up the rest of the system:
        schemaCopies[schemaId_2] = JSON.parse(JSON.stringify(schemas[schemaId_2])); //eslint-disable-line camelcase
        //Add the modified schema to the compiler
        ajv.addSchema(filterSchemaByDataLevel(schemaCopies[schemaId_2], accessLevel), schemaId_2);
    });
    const validate = ajv.compile(filterSchemaByDataLevel(schemaCopies[schemaId], accessLevel));
    const result = validate(returnedObject);

    if(result){
        return returnedObject;
    }

    const message = `Something went wrong filtering for ${schemaId}. Filter returned false.`;
    Logger.error('Filter', message, validate.errors);
    Logger.debug('Filter', 'original object was:', object);
    throw new Error(message);

}

module.exports= filterObjectBySchemaIdAndAccess;
