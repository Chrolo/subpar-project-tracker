const {getTableSchema} = require('../models/dbDefLoader.js');

function createInsertForData(tableName, rows){
    //Check table is known to us:
    const tableSchema = getTableSchema(tableName);

    if(!tableSchema){
        console.error(`[sql/util::createInsertForData] Table '${tableName}' is not specified in schemas.`);
        return null;
    }

    //get fields:
    const fields = tableSchema.fields;
    const fieldString = `(${fields.map(field=>field.name).join()})`;

    let values = [];
    let stringSections = [];
    const stringSection = '('+fields.map(()=>'?').join() + ')';

    rows.forEach((row)=>{
        fields.forEach(field =>{
            values.push(prepareDataForInsert(row[field.name],field.type));
        });
        stringSections.push(stringSection);
    });

    return {
        fieldString,
        values,
        string: stringSections.join()
    };
}

function createInsertStringForData(tableName, rows){
    const insertionData = createInsertForData(tableName, rows);
    if(!insertionData) {
        return null;
    }

    return {
        sql: `INSERT INTO ${tableName} ${insertionData.fieldString} VALUES ${insertionData.string};`,
        data: insertionData.values
    };
}

/**
This is here to make sure data is in the correct type for the mysql parser to process and escape it.
it does not perform escaping itself.
*/
function prepareDataForInsert(data, dataType) {
    if(!dataType){
        console.warn(`[sql/util::prepareDataForInsert] No data type given for value ${data}. Returning unchanged.`);
        return data;
    }

    if(data === null || data === void 0) {
        return null;
    }

    //Strip out any SQL length declarations
    dataType = dataType.replace(/\(\d+\)/,'');

    switch(dataType){
        case 'TEXT':
        case 'VARCHAR':
            return data+'';
        break;

        case 'INT':
            if(!Number.isFinite(data)){ return null; }
            return Math.floor(data);
        break;

        case 'DATE':
            //TODO: Implement DATE type transform
            if(typeof data === 'string'){
                //if string, check is correct format
                const date = Date.parse(data);
                if(date){
                    return new Date(data);
                } else {
                    console.error(`[sql/util::prepareDataForInsert] invalid string for date type: Expected 'yyyy-mm-dd', got '${data}'`);
                    return null;
                }
            } else if (data instanceof Date) {
                //if Date object, all is good
                return data;
            }
        break;

        default:
            console.warn(`[sql/util::prepareDataForInsert] Unknown dataType ${dataType}.`);
    }
    //unprocessed:
    return data;
}

function promiseQuery(connection, ...args){
    return new Promise((resolve, reject)=>{
        connection.query(...args, (err,res)=>{
            if(err){
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}


module.exports = {
    createInsertForData,
    prepareDataForInsert,
    promiseQuery
};
