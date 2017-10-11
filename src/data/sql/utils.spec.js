/*globals describe it*/
const expect = require('chai').expect;
const utils = require('./utils.js');

describe('data/sql/utils', () => {

    describe('prepareDataForInsert', () => {
        it('turns `undefined` or `null` into `null`', () => {
            const checks = [null, void 0];
            checks.forEach((check) => {
                expect(utils.prepareDataForInsert(check, 'TEXT'), `expected ${check} to return null`).to.equal(null);
            });
        });
        describe('INT type', () => {
            it('rounds down non-Integers ', () => {
                expect(utils.prepareDataForInsert(10.9, 'INT')).to.equal(10);
            });

            it('returns null for values that can\'t be numbers', () => {
                const checks = [
                    null,
                    'a',
                    ['a'],
                    {
                        food: 'bar'
                    },
                    void 0
                ];
                checks.forEach((check) => {
                    expect(utils.prepareDataForInsert(check, 'INT'),
                        `expected '${JSON.stringify(check)}' to return null`)
                        .to.equal(null);
                });
            });

            it('leaves integer numbers unchanged', () => {
                const checks = [0, 1, -1];
                checks.forEach((check) => {
                    expect(utils.prepareDataForInsert(check, 'INT'))
                        .to.equal(check);
                });
            });
        });

        describe('TEXT or VARCHAR types', () => {
            it('forces most types to be strings', () => {
                const checks = [{value: 0, string: '0'}, {value: 5.6, string: '5.6'}, {value: 'text', string: 'text'}];
                checks.forEach((check) => {
                    expect(utils.prepareDataForInsert(check.value, 'TEXT')).to.equal(check.string);
                    expect(utils.prepareDataForInsert(check.value, 'VARCHAR')).to.equal(check.string);
                });
            });
        });

        describe('DATE type', () => {
            it('accepts Date objects without editing them', () => {
                const checks = [new Date(), new Date('2017-08-14')];
                checks.forEach((check) => {
                    expect(utils.prepareDataForInsert(check, 'DATE')).to.equal(check);
                });
            });

            it('accepts string representations of dates and converts them to Date objects', () => {
                const checks = ['2001-09-11'];

                checks.forEach((check) => {
                    const expected = new Date(check);
                    const actual = utils.prepareDataForInsert(check, 'DATE');

                    expect(actual).to.not.be.null; //eslint-disable-line no-unused-expressions
                    expect(actual.getUTCMilliseconds()).to.equal(expected.getUTCMilliseconds());
                });

            });
        });

    });

    describe('createInsertStringForData', () => {
        it('rejects unknown table names by returning null', () => {
            //silence the error:
            const tempErrorStorage = console.error; //eslint-disable-line no-console
            console.error = () => {};   //eslint-disable-line no-console, no-empty-function
            //test
            expect(utils.createInsertStringForData('RandomTableName', [])).to.equal(null);
            //re enable console.error
            console.error = tempErrorStorage;   //eslint-disable-line no-console

        });
        describe('for known database config', () => {
            it('returns the string to be used for the fields in fieldString key', () => {
                const expected = '(id,name,completed,projectType,projectLeaderId)';
                //I don't like this as the db spec may change, but this test shouldn't have to
                expect(utils.createInsertStringForData('projects', [{}]).fieldString).to.equal(expected);
            });

            it('returns the values in the correct order for the prepared statement-like string', () => {
                const testData = [{id: 1, name: 2}, {id: 5, completed: 7}];
                const expected = [
                    1,      //1: id
                    "2",    //1: name
                    null,   //1: completed
                    null,   //1: projectType
                    null,   //1: projectLeaderId
                    5,      //2: id
                    null,   //2: name
                    7,      //2: completed
                    null,   //2: projectType
                    null    //2: projectLeaderId
                ];
                //I don't like this as the db spec may change, but this test shouldn't have to
                const actual = utils.createInsertStringForData('projects', testData).values;

                expect(actual).to.deep.equal(expected);
            });

            it('returns the expected number of placeholder values', () => {
                const testData = [{}, {}, {}]; //we only care about row count
                const expected = testData.length * 5; /*rows x fields in each row*/
                //I don't like this as the db spec may change, but this test shouldn't have to
                const data = utils.createInsertStringForData('projects', testData);
                const actual = (data.string.match(/\?/g) || []).length;

                expect(actual).to.equal(expected);
                expect(data.values.length).to.equal(expected);
            });
        });
    });

    describe('createInsertionObject', () => {
        it('creates an expected sql string for given data', () => {
            const testData = [{id: 1, name: 2}, {id: 5, completed: 7}];
            const expected = {
                sql: 'INSERT INTO projects (id,name,completed,projectType,projectLeaderId) VALUES (?,?,?,?,?),(?,?,?,?,?);',
                data: [
                    1,
                    "2",
                    null,
                    null,
                    null,
                    5,
                    null,
                    7,
                    null,
                    null
                ]
            };

            expect(utils.createInsertionObject('projects', testData)).to.deep.equal(expected);
        });
    });

    describe('convertInsertResultToNewIdsArray', () => {
        it('returns an array of Ids from inserted rows', () => {
            const expected = [25, 26, 27, 28];
            const actual = utils.convertInsertResultToNewIdsArray({
                insertId: 25,
                affectedRows: 4
            });
            expect(actual).to.deep.equal(expected);
        });
    });

    describe('stripNullFieldsFromResults', () => {
        it('removes row fields who \'s value is null', () => {
            const input= [
                {
                    fansubbing: 'really',
                    shows: {off: 'the', top: 3, attributes: ' of'},
                    nerds: ['obession', 'creativity', null],
                    extra: null
                },
                {
                    mostly: null,
                    fields: null,
                    object: {with: null},
                    array: ['with', null]
                }
            ];
            const expected = [
                {
                    fansubbing: 'really',
                    shows: {off: 'the', top: 3, attributes: ' of'},
                    nerds: ['obession', 'creativity', null]
                },
                {
                    object: {with: null},
                    array: ['with', null]
                }
            ];
            const actual = utils.stripNullFieldsFromResults(input);

            expect(actual).to.deep.equal(expected);
        });

        it('keeps any fields specified in the `ignoredFields` array', () => {
            const input= [
                {
                    fansubbing: 'really',
                    shows: {off: 'the', top: 3, attributes: ' of'},
                    nerds: ['obession', 'creativity', null],
                    extra: null
                },
                {
                    mostly: null,
                    fields: null,
                    object: {with: null},
                    array: ['with', null]
                }
            ];
            const igonoredFields = ['mostly', 'fields'];
            const expected = [
                {
                    fansubbing: 'really',
                    shows: {off: 'the', top: 3, attributes: ' of'},
                    nerds: ['obession', 'creativity', null]
                },
                {
                    mostly: null,
                    fields: null,
                    object: {with: null},
                    array: ['with', null]
                }
            ];
            const actual = utils.stripNullFieldsFromResults(input, igonoredFields);

            expect(actual).to.deep.equal(expected);
        });
    });
});
