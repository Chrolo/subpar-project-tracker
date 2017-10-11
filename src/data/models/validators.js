//imports
const schemas = require('./dataSchemas/index.js').schemas;

//Get AJV setup
const Ajv = require('ajv');
const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    jsonPointers: true,
    extendRefs: 'fail',
    removeAdditional: true  //strip out anything that's not meant to be there
});

//Add all the schemas to a main constructor
const availableSchemas= [];
Object.keys(schemas).forEach((schemaId) => {
    ajv.addSchema(schemas[schemaId]);
    availableSchemas.push(schemaId);
});

//create a validator for each schema:
const validators = availableSchemas.reduce((acc, schemaId) => {
    acc[schemaId] = ajv.compile(schemas[schemaId]);
    return acc;
}, {});

module.exports= validators;
