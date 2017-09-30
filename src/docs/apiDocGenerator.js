//Because Otherwise I never update the schemas in the swagger docs
const path = require('path');
const fs = require('fs');

//get the template
const apiTemplate = require('./api-spec.template.json');
//get a copy of the schemas:
const schemas = JSON.parse(JSON.stringify(require('../data/models/dataSchemas/index.js').schemas));

const OUTPUT_FILE = path.resolve(__dirname, '../../docs/api-spec.json');

//Go through each schema and change any $refs to point to #/definitions
const definitions = Object.keys(schemas).reduce((acc, schemaName) => {
    acc[schemaName] = removeNonCompliantSchemaParts(replaceRefKeys(schemas[schemaName]));
    return acc;
}, {});

//Add all schemas into the #/components/schemas/ section
apiTemplate.components.schemas = Object.assign({}, apiTemplate.components.schemas, definitions);

//Output file
const outputString = JSON.stringify(apiTemplate, null, '    ');
fs.writeFileSync(OUTPUT_FILE, outputString);
console.log(`API document written to ${OUTPUT_FILE}`); //eslint-disable-line no-console

// Misc utility functions
function replaceRefKeys (object, rootSchema) {
    if(typeof rootSchema === 'undefined'){  //if root schema wasn't specified, assume we're at the top level
        rootSchema = object;
    }

    if((typeof object !== 'object') || (object === null)){
        return object;
    } else if (object instanceof Array) {
        return object.map((item) => {
            return replaceRefKeys(item, rootSchema);
        });
    }

    return Object.keys(object).reduce((acc, key) => {
        if(key === '$ref') {
            if(object[key].includes('#')){
                return getJsonPointerObjectValue(rootSchema, object[key]);
            }
            acc[key] = `#/components/schemas/${object[key]}`;

        } else {
            acc[key] = replaceRefKeys(object[key], rootSchema);
        }
        return acc;
    }, {});
}

function removeNonCompliantSchemaParts(object){
    // Turns out OpenApi Schemas is based on JSON Schema v00 ;_;
    // and it's so strict I can't have custom properties and such
    const fieldsToRemove = ['$id', 'id', 'dataLevel', 'permissionTypes'];
    // And swagger v2 doesn't like some of the cool JSON Schema stuff i've been doing.
    if(typeof object !== 'object' || (object === null)){
        return object;
    } else if (object instanceof Array) {
        return object.map((item) => {
            return removeNonCompliantSchemaParts(item);
        });
    }
    return Object.keys(object).reduce((acc, key) => {
        if(!fieldsToRemove.includes(key)) {

            //if key is 'type' and the value is an array: it can't handle arrays....
            if(key === 'type' && (object[key] instanceof Array)){
                object[key] = object[key][0]; //just use the first of the types as the primary type.
            }

            acc[key] = removeNonCompliantSchemaParts(object[key]);
        }
        return acc;
    }, {});
}

function getJsonPointerObjectValue(object, jsonPointer){
    const matches = jsonPointer.match(/#?(.+)/);
    return matches[1].split('/').reduce((acc, key) => {
        if(key === ''){ //because there might be an initial blank piece
            return acc;
        }
        if(!acc){   //if it's not defined, return it back up
            return acc;
        }
        return acc[key];

    }, object);

}
