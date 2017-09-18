/*globals describe it*/
const filter = require('./filter.js');
const {expect} = require('chai');

describe('/data/models/filter', () => {

    describe('for episodes', () => {
        const fullEpisodeData={
            "id": 1,
            "projectId": 1, //Not in schema, so should assume 'debug'
            "episodeName": "Nichijou ep01",
            "episodeNumber": 1,
            "completed": null,
            "tasks": [
                {
                    "id": 5,
                    "taskName": "TS",
                    "staffName": "Chrolo",
                    "lastUpdated": null,
                    "completed": null,
                    "episodeId": 1,
                    "dependsOn": [7, 6]
                },
                {
                    "id": 6,
                    "taskName": "ENC",
                    "staffName": "Chrolo",
                    "lastUpdated": null,
                    "completed": "2001-09-10T23:00:00.000Z",
                    "episodeId": 1,
                    "dependsOn": []
                },
                {
                    "id": 7,
                    "taskName": "TL",
                    "staffName": "notChrolo",
                    "lastUpdated": null,
                    "completed": null,
                    "episodeId": 1,
                    "dependsOn": [6]
                }
            ],
            "files": []
        };

        it('filters at the "public" dataLevel correctly', () => {
            const expected = {
                "episodeName": "Nichijou ep01",
                "episodeNumber": 1,
                "completed": null,
                "tasks": [
                    {
                        "id": 5,
                        "taskName": "TS",
                        "staffName": "Chrolo",
                        "lastUpdated": null,
                        "completed": null,
                        "dependsOn": [7, 6]
                    },
                    {
                        "id": 6,
                        "taskName": "ENC",
                        "staffName": "Chrolo",
                        "lastUpdated": null,
                        "completed": "2001-09-10T23:00:00.000Z",
                        "dependsOn": []
                    },
                    {
                        "id": 7,
                        "taskName": "TL",
                        "staffName": "notChrolo",
                        "lastUpdated": null,
                        "completed": null,
                        "dependsOn": [6]
                    }
                ],
                "files": []
            };
            const validators = require('./validators.js');
            validators['episode_schema.json'](fullEpisodeData);
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'public');

            expect(actual).to.deep.equal(expected);

        });

        //TODO fill out with complete test set.
        /*/
        it('filters at the "staff" dataLevel correctly',()=>{
            const expeted = {};
        });
        it('filters at the "admin" dataLevel correctly',()=>{
            const expeted = {};
        });
        it('filters at the "debug" dataLevel correctly',()=>{
            const expeted = {};
        });
        //*/

    });
});
