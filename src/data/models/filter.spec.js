/*globals describe it*/
const filter = require('./filter.js');
const {expect} = require('chai');

describe('/data/models/filter', () => {

    describe('for episodes', () => {
        const fullEpisodeData={
            "id": 1,    //debug
            "projectId": 1, //Not in schema, so should assume 'debug'
            "episodeName": "Nichijou ep01", //public
            "episodeNumber": 1, //public
            "completed": null,  //public
            "tasks": [
                {
                    "id": 5,                //public
                    "taskName": "TS",       //public
                    "staffName": "Chrolo",  //public
                    "lastUpdated": null,    //public
                    "completed": null,      //public
                    "episodeId": 1,         //debug
                    "dependsOn": [7, 6]      //public
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
            "files": [
                {
                    "fileName": "[Chrolo] Nichijou 01 - [1080p][Flac].mkv", //public
                    "ftpFilePath": "/projects/bds/nichijou/01/",            //staff
                    "version": 3,                                           //public
                    "quality": "720p"                                       //public
                }
            ]
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
                "files": [
                    {
                        "fileName": "[Chrolo] Nichijou 01 - [1080p][Flac].mkv", //public
                        "version": 3,                                           //public
                        "quality": "720p"                                       //public
                    }
                ]
            };
            const validators = require('./validators.js');
            validators['episode_schema.json'](fullEpisodeData);
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'public');

            expect(actual).to.deep.equal(expected);

        });
        it('filters at the "staff" dataLevel correctly', () => {
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
                "files": [
                    {
                        "fileName": "[Chrolo] Nichijou 01 - [1080p][Flac].mkv",
                        "ftpFilePath": "/projects/bds/nichijou/01/",
                        "version": 3,
                        "quality": "720p"
                    }
                ]
            };
            const validators = require('./validators.js');
            validators['episode_schema.json'](fullEpisodeData);
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'staff');

            expect(actual).to.deep.equal(expected);

        });

        /*/
        it('filters at the "admin" dataLevel correctly',()=>{
            const expeted = {};
        });
        it('filters at the "debug" dataLevel correctly',()=>{
            const expeted = {};
        });
        //*/

    });
});
