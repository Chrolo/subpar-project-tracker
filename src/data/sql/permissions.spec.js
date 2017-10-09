/*globals describe it*/
const {expect} = require('chai');
const {convertSqlToEnum, convertEnumToSql, ENUMS} = require('./permissions.js');
const Logger = require('../../util/Logger');

describe('data/sql/permissions', () => {

    describe('convertSqlToEnum', () => {
        it('handles unknown fields by returning `undefined`', () => {
            const tests = [4, 'four', '4', void 0, null];
            Logger.toggleLogMute();  //next bit throws a bunch of error message to console that we don't care about.
            tests.forEach((testData) => {
                expect(convertSqlToEnum(testData, 'someTestData'), `Failed SQL->JS for '${testData}'.`).to.equal(void 0);
            });
            Logger.toggleLogMute();
        });

        it('handles unknown values by returning `undefined`', () => {
            const tests = [4, 'four', '4', void 0, null];
            tests.forEach((testData) => {
                //NOTE: 'dataViewLevel' is a DATA_LEVELS field, which only has data for 0-3
                expect(convertSqlToEnum('dataViewLevel', testData), `Failed SQL->JS for '${testData}'.`).to.equal(void 0);
            });
        });

        it('converts DATA_LEVELS correctly', () => {
            const tests = [
                {input: 0, expect: 'public'},
                {input: 1, expect: 'staff'},
                {input: 2, expect: 'admin'},
                {input: 3, expect: 'debug'}
            ];
            tests.forEach((testData) => {
                //NOTE: 'dataViewLevel' is a DATA_LEVELS field
                expect(convertSqlToEnum('dataViewLevel', testData.input), `Failed SQL->JS for '${testData.input}'.`).to.equal(testData.expect);
            });
        });

        it('converts OWNERSHIPS correctly', () => {
            const tests = [
                {input: 0, expect: 'none'},
                {input: 1, expect: 'own'},
                {input: 2, expect: 'all'}
            ];
            tests.forEach((testData) => {
                //NOTE: 'taskUpdate' is an OWNERSHIPS field
                expect(convertSqlToEnum('taskUpdate', testData.input), `Failed SQL->JS for '${testData.input}'.`).to.equal(testData.expect);
            });

        });
    });

    describe('convertEnumToSql', () => {

        it('handles unknown fields by returning undefined', () => {
            const tests = [4, 'four', '4', void 0, null];
            Logger.toggleLogMute(); //next bit throws a bunch of error message to console that we don't care about.
            tests.forEach((testData) => {
                expect(convertEnumToSql(testData, 'someValue'), `Failed JS->SQL for '${testData}'.`).to.equal(void 0);
            });
            Logger.toggleLogMute();
        });

        it('handles unknown values by returning throwing a TypeError', () => {
            const tests = [4, 'four', '4', void 0, null];
            tests.forEach((testData) => {
                //NOTE: 'dataViewLevel' is a DATA_LEVELS field, which only has data for 'public', 'staff', 'admin' or 'debug'
                const thrower= () => {
                    convertEnumToSql('dataViewLevel', testData);
                };
                expect(thrower, `Failed to throw for '${testData}'.`).to.throw(TypeError);
            });
        });

        it('converts DATA_LEVELS correctly', () => {
            const tests = [
                {input: 'public', expect: 0},
                {input: 'staff', expect: 1},
                {input: 'admin', expect: 2},
                {input: 'debug', expect: 3}
            ];
            tests.forEach((testData) => {
                //NOTE: 'dataViewLevel' is a DATA_LEVELS field
                expect(convertEnumToSql('dataViewLevel', testData.input), `Failed JS->SQL for '${testData.input}'.`).to.equal(testData.expect);
            });
        });

        it('converts OWNERSHIPS correctly', () => {
            const tests = [
                {input: 'none', expect: 0},
                {input: 'own', expect: 1},
                {input: 'all', expect: 2}
            ];
            tests.forEach((testData) => {
                //NOTE: 'taskUpdate' is an OWNERSHIPS field
                expect(convertEnumToSql('taskUpdate', testData.input), `Failed JS->SQL for '${testData.input}'.`).to.equal(testData.expect);
            });
        });

        it('converts BOOLEANS correctly', () => {
            const tests = [
                {input: false, expect: 0},
                {input: true, expect: 1}
            ];
            tests.forEach((testData) => {
                //NOTE: 'projectCreation' is an BOOLEANS field
                expect(convertEnumToSql('projectCreation', testData.input), `Failed JS->SQL for '${testData.input}'.`).to.equal(testData.expect);
            });
        });
    });

    describe('ENUMS', () => {
        it('has expected values', () => {
            const expectedValues = {
                dataViewLevel: {PUBLIC: 'public', STAFF: 'staff', ADMIN: 'admin', DEBUG: 'debug'},
                taskUpdate: {NONE: 'none', OWN: 'own', ALL: 'all'},
                projectDetailUpdate: {NONE: 'none', OWN: 'own', ALL: 'all'},
                projectCreation: {TRUE: true, FALSE: false},
                apiTokenCreate: {TRUE: true, FALSE: false},
                apiTokenRevoke: {TRUE: true, FALSE: false}
            };

            expect(ENUMS, `\n${JSON.stringify(ENUMS)}\n-vs-\n${JSON.stringify(expectedValues)}\n`).to.deep.equal(expectedValues);
        });
    });
});
