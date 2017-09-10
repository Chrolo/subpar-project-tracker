//imports
const schemas = require('./dataSchemas/index.js').schemas;


//Get AJV setup
const Ajv = require('ajv');
const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    jsonPointers: true,
});

//Add all the schemas to a main constructor
let availableSchemas= [];
Object.keys(schemas).forEach((schemaId)=>{
    ajv.addSchema(schemas[schemaId]);
    availableSchemas.push(schemaId);
});

//create a validator for each schema:
let validators = availableSchemas.reduce((acc,schemaId)=>{
    acc[schemaId] = ajv.compile(schemas[schemaId]);
    return acc;
},{});

module.exports= validators;
