/*globals describe it*/
const {expect} = require('chai');
const validators = require('./validators.js');
const testData = require('../../testUtils/testDataGenerators');

describe('data/models/validators', () => {

    it('Has loaded expected schemas', () => {
        const expectedSchemas = [
            'episodeFile_schema.json',
            'episode_schema.json',
            'permissions_schema.json',
            'postApiKey_schema.json',
            'project_schema.json',
            'projectTemplate_schema.json',
            'staffMember_schema.json',
            'task_schema.json',
            'taskUpdatePatch_schema.json'
        ];
        const loadedValidators = Object.keys(validators);
        expect(loadedValidators.length, `Expected a validator for each schema.`).to.equal(expectedSchemas.length);
        expectedSchemas.forEach((expected) => {
            expect(loadedValidators).to.include(expected);
        });
    });

    describe('task validation', () => {
        const minData = testData.task.min();
        const maxData = testData.task.max();

        it('passes a correct minimum task', () => {
            expect(validators['task_schema.json'](maxData), `Expected maximum data to pass validation, but got errors: \n${JSON.stringify(validators['task_schema.json'].errors, null, '  ')}\n`).to.be.true;   //eslint-disable-line no-unused-expressions
        });
        it('passes a correct maximum task', () => {
            expect(validators['task_schema.json'](minData), `Expected minimum data to pass validation, but got errors: \n${JSON.stringify(validators['task_schema.json'].errors, null, '  ')}\n`).to.be.true; //eslint-disable-line no-unused-expressions
        });

        it('fails an incorrect task', () => {
            const invalidDataSet= [
                {
                    "taskName": "TS",
                    "staff": 105 // field is wrong type
                },
                {
                    "staffName": "Chrolo" //missing required field
                }
            ];
            invalidDataSet.forEach((invalidData) => {
                expect(validators['task_schema.json'](invalidData), `${JSON.stringify(invalidData)}\n`).to.be.false;    //eslint-disable-line no-unused-expressions
            });
        });
    });

    describe('episode validation', () => {
        const minValidData = testData.episode.min();
        const maxData = testData.episode.max();

        it('passes a correct minimum episode', () => {
            expect(validators['episode_schema.json'](minValidData), `Expected minimum data to pass validation, but got errors: \n${JSON.stringify(validators['episode_schema.json'].errors, null, '  ')}\n`).to.be.true;    //eslint-disable-line no-unused-expressions
        });
        it('passes a correct maximum episode', () => {
            expect(validators['episode_schema.json'](maxData), `Expected maximum data to pass validation, but got errors: \n${JSON.stringify(validators['episode_schema.json'].errors, null, '  ')}\n`).to.be.true;         //eslint-disable-line no-unused-expressions
        });

        it('fails an incorrect episode', () => {
            const invalidDataSet= [
                {
                    "episodeNumber": "two" // field is wrong type
                },
                {
                    "id": 2 //missing required field
                }
            ];
            invalidDataSet.forEach((invalidData) => {
                expect(validators['episode_schema.json'](invalidData), `${JSON.stringify(invalidData)}\n`).to.be.false; //eslint-disable-line no-unused-expressions
            });
        });
    });

    //TODO: Add tests for episodeFiles
    //TODO: Add tests for staff    
    //TODO: Add tests for projects
});
