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

    describe('createInsertForData', () => {
        it('rejects unknown table names by returning null', () => {
            //silence the error:
            const tempErrorStorage = console.error; //eslint-disable-line no-console
            console.error = () => {};   //eslint-disable-line no-console, no-empty-function
            //test
            expect(utils.createInsertForData('RandomTableName', [])).to.equal(null);
            //re enable console.error
            console.error = tempErrorStorage;   //eslint-disable-line no-console

        });
        describe('for known database config', () => {
            it('returns the string to be used for the fields in fieldString key', () => {
                const expected = '(id,name,completed,projectType)';
                //I don't like this as the db spec may change, but this test shouldn't have to
                expect(utils.createInsertForData('projects', [{}]).fieldString).to.equal(expected);
            });

            it('returns the values in the correct order for the prepared statement-like string', () => {
                const testData = [{id: 1, name: 2}, {id: 5, completed: 7}];
                const expected = [
                    1,
                    "2",
                    null,
                    null,
                    5,
                    null,
                    7,
                    null
                ];
                //I don't like this as the db spec may change, but this test shouldn't have to
                const actual = utils.createInsertForData('projects', testData).values;

                expect(actual).to.deep.equal(expected);
            });

            it('returns the expected number of placeholder values', () => {
                const testData = [{}, {}, {}]; //we only care about row count
                const expected = testData.length * 4; /*rows x fields in each row*/
                //I don't like this as the db spec may change, but this test shouldn't have to
                const data = utils.createInsertForData('projects', testData);
                const actual = (data.string.match(/\?/g) || []).length;

                expect(actual).to.equal(expected);
                expect(data.values.length).to.equal(expected);
            });
        });
    });
});
