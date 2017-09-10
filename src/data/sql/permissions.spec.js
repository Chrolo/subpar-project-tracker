const { expect } = require('chai');
const { convertDataType, ENUMS } = require('./permissions.js');

describe('data/sql/permissions',()=>{
    describe('convertDataType',()=>{
        it('handles unknown values by returning `undefined`',()=>{
            const data = [
                {js:'notBasic', sql:'not0' },
                {js:'notStaff', sql:'not1' },
                {js:'notAdmin', sql:'not3' }
            ];
            data.forEach((testData)=>{
                //NOTE: 'projectView' is a DATA_LEVELS field
                expect(convertDataType(testData.js,'projectView','js','sql'),`Failed JS->SQL for '${testData.js}'. `).to.equal(void 0); //check JS conversion
                expect(convertDataType(testData.sql,'projectView','sql','js'),`Failed SQL->JS for '${testData.sql}'. `).to.equal(void 0); //check JS conversion
            });
        });

        it('converts DATA_LEVELS correctly',()=>{
            const data = [
                {js:'basic', sql:0 },
                {js:'staff', sql:1 },
                {js:'admin', sql:2 }
            ];
            data.forEach((testData)=>{
                //NOTE: 'projectView' is a DATA_LEVELS field
                expect(convertDataType(testData.js,'projectView','js','sql'),`Failed JS->SQL for '${testData.js}'. `).to.equal(testData.sql); //check JS conversion
                expect(convertDataType(testData.sql,'projectView','sql','js'),`Failed SQL->JS for '${testData.sql}'. `).to.equal(testData.js); //check JS conversion
            });
        });

        it('converts OWNERSHIPS correctly',()=>{
            const data = [
                {js:null, sql:0 },
                {js:'own', sql:1 },
                {js:'all', sql:2 }
            ];
            data.forEach((testData)=>{
                //NOTE: 'taskUpdate' is a OWNERSHIPS field
                expect(convertDataType(testData.js,'taskUpdate','js','sql'),`Failed JS->SQL for '${testData.js}'. `).to.equal(testData.sql); //check JS conversion
                expect(convertDataType(testData.sql,'taskUpdate','sql','js'),`Failed SQL->JS for '${testData.sql}'. `).to.equal(testData.js); //check JS conversion
            });
        });
    });

    describe('ENUMS',()=>{
        it('has expected values',()=>{
            const expectedValues = {
                projectView: { BASIC: 'basic', STAFF: 'staff', ADMIN: 'admin'},
                taskUpdate: {NONE: null, OWN: 'own', ALL: 'all'},
                projectDetailUpdate: {NONE: null, OWN: 'own', ALL: 'all'},
                projectCreation: { TRUE: true, FALSE: false },
                apiTokenCreate: { TRUE: true, FALSE: false },
                apiTokenRevoke: { TRUE: true, FALSE: false }
            };

            expect(ENUMS, `\n${JSON.stringify(ENUMS)}\n-vs-\n${JSON.stringify(expectedValues)}\n`).to.deep.equal(expectedValues);
        });
    });
});
