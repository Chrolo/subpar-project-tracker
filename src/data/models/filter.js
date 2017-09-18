//imports
const schemas = require('./dataSchemas/index.js').schemas;
//const validators = require('./validators.js');

const FILTER_LEVELS = [
    "public", "staff", "admin", "debug"
];
const ASSUMED_LEVEL = 'debug';

const Ajv = require('ajv');

function filterSchemaByDataLevel(initialSchema, datalevel){
    //Takes from global `schema` def to fill in $refs
    if(typeof initialSchema !== 'object'){
        return initialSchema;
    }

    //Arrays ,ust be treated differently
    if(initialSchema instanceof Array){
        return initialSchema.map(getExpandedSchema, datalevel);
    } else {
        //It's an object!
        if(Object.keys(initialSchema).includes('properties')){
            //I'm using the 'properties' key to find object definitions, where I can strip out fields if needed.
            const propertyKeys = Object.keys(initialSchema.properties);
            //now i'm going to generate a new set of properties, stripping out the ones to be filtered out.
            initialSchema.properties = propertyKeys.reduce((acc, propertyKey)=>{
                const fieldDef = initialSchema.properties[propertyKey];
                const fieldDataLevel = Object.keys(fieldDef).includes('dataLevel') ? fieldDef.dataLevel : ASSUMED_LEVEL;
                if(shouldBeIncluded(fieldDataLevel,datalevel)){
                    acc[propertyKey] = fieldDef;
                }
                return acc;
            },{});

            return initialSchema;
        }

        return Object.keys(initialSchema).reduce((acc,key)=>{
            if(typeof initialSchema[key] === 'object'){
                if(initialSchema[key] instanceof Array) {
                    acc[key] = initialSchema[key].map(getExpandedSchema, datalevel);
                } else {
                    acc[key] = getExpandedSchema(initialSchema[key], datalevel);
                }
            } else {
                // for non-objects, just put it back
                acc[key] = initialSchema[key];
            }
            return acc;
        });
    }
}

function shouldBeIncluded(dataLevel, permissionLevel){
    if(!dataLevel) {dataLevel=ASSUMED_LEVEL;}
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
    let schemaCopies = {};
    Object.keys(schemas).forEach((schemaId_2)=>{
        //copy schema to stop it fucking up the rest of the system:
        schemaCopies[schemaId_2] = JSON.parse(JSON.stringify(schemas[schemaId_2]));
        //Add the modified schema to the compiler
        ajv.addSchema(filterSchemaByDataLevel(schemaCopies[schemaId_2],accessLevel),schemaId_2);
    });
    const validate = ajv.compile(filterSchemaByDataLevel(schemaCopies[schemaId],accessLevel))
    const result = validate(returnedObject);

    if(result){
        return returnedObject;
    } else {
        const message = `[Filter] Something went wrong filtering for ${schemaId}. Filter returned false.`;
        console.error(message, validate.errors);
        throw new Error(message);
    }
}

module.exports= filterObjectBySchemaIdAndAccess;
