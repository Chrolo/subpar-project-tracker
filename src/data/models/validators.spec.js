/*globals describe it*/
const {expect} = require('chai');
const validators = require('./validators.js');

function objectCloneAndExpand(...args){
    return args.reduce((acc, object) => {
        const clone = JSON.parse(JSON.stringify(object), null);
        return Object.assign(acc, clone);
    }, {});
}

describe('data/models/validators', () => {

    it('Has loaded expected schemas', () => {
        const expectedSchemas = [
            'episodeFile_schema.json',
            'episode_schema.json',
            'permissions_schema.json',
            'postApiKey_schema.json',
            'project_schema.json',
            'projectTemplate_schema.json',
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
        const minValidData = {
            "taskName": "TS",
            "staffName": "Chrolo"
        };
        const maxData = objectCloneAndExpand(minValidData, {
            "id": 5,
            "lastUpdated": "2017-09-11T12:45:32.000Z",
            "completed": null,
            "episodeId": 1,
            "dependsOn": [7, 6]
        });

        it('passes a correct task', () => {
            expect(validators['task_schema.json'](minValidData), `Expected minimum data to pass validation, but got errors: \n${JSON.stringify(validators['task_schema.json'].errors, null, '  ')}\n`).to.be.true; //eslint-disable-line no-unused-expressions
            expect(validators['task_schema.json'](maxData), `Expected maximum data to pass validation, but got errors: \n${JSON.stringify(validators['task_schema.json'].errors, null, '  ')}\n`).to.be.true;   //eslint-disable-line no-unused-expressions
        });

        it('fails an incorrect task', () => {
            const invalidDataSet= [
                {
                    "taskName": "TS",
                    "staffName": 105 // field is wrong type
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
        const minValidData = {
            "episodeNumber": 2
        };
        const maxData = objectCloneAndExpand(minValidData, {
            "id": 2,
            "tasks": [
                {
                    "taskName": "TS",
                    "staffName": "Chrolo"
                }
            ],
            "completed": null,
            "files": []
        });

        it('passes a correct episode', () => {
            expect(validators['episode_schema.json'](minValidData), `Expected minimum data to pass validation, but got errors: \n${JSON.stringify(validators['episode_schema.json'].errors, null, '  ')}\n`).to.be.true;    //eslint-disable-line no-unused-expressions
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
});
