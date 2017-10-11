/*globals describe it*/
const filter = require('./filter.js');
const {expect} = require('chai');
const testData = require('../../testUtils/testDataGenerators');

describe('/data/models/filter', () => {

    describe('for staff', () => {
        const fullData= testData.staff.max();

        it('filters at the "public" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            delete expected.id;
            delete expected.email;
            delete expected.timezone;

            //Get the actual result
            const actual = filter(fullData, 'staffMember_schema.json', 'public');

            //Compare
            expect(actual).to.deep.equal(expected);
        });
        it('filters at the "staff" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            delete expected.id;
            delete expected.email;

            //Get the actual result
            const actual = filter(fullData, 'staffMember_schema.json', 'staff');

            //Compare
            expect(actual).to.deep.equal(expected);
        });

        it('filters at the "admin" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            delete expected.id;
            //Get the actual result
            const actual = filter(fullData, 'staffMember_schema.json', 'admin');

            //Compare
            expect(actual).to.deep.equal(expected);
        });

        it('filters at the "debug" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            //--debug sees it all!--//

            //Get the actual result
            const actual = filter(fullData, 'staffMember_schema.json', 'debug');

            //Compare
            expect(actual).to.deep.equal(expected);
        });
    });

    describe('for tasks', () => {
        const fullData= testData.task.max();

        it('filters at the "public" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            delete expected.episodeId;

            //Get the actual result
            const actual = filter(fullData, 'task_schema.json', 'public');

            //Compare
            expect(actual).to.deep.equal(expected);
        });
        it('filters at the "staff" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            delete expected.episodeId;

            //Get the actual result
            const actual = filter(fullData, 'task_schema.json', 'staff');

            //Compare
            expect(actual).to.deep.equal(expected);
        });

        it('filters at the "admin" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            delete expected.episodeId;

            //Get the actual result
            const actual = filter(fullData, 'task_schema.json', 'admin');

            //Compare
            expect(actual).to.deep.equal(expected);
        });

        it('filters at the "debug" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullData));
            //delete the fields we don't expect to see:
            //--debug sees it all!--//

            //Get the actual result
            const actual = filter(fullData, 'task_schema.json', 'debug');

            //Compare
            expect(actual).to.deep.equal(expected);
        });
    });

    describe('for episodes', () => {
        const fullEpisodeData= testData.episode.max();

        it('filters at the "public" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullEpisodeData));
            //delete the fields we don't expect to see:
            delete expected.id;
            delete expected.projectId;

            //Get the actual result
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'public');

            //Compare
            expect(actual).to.deep.equal(expected);
        });
        it('filters at the "staff" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullEpisodeData));
            //delete the fields we don't expect to see:
            delete expected.id;
            delete expected.projectId;

            //Get the actual result
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'staff');

            //Compare
            expect(actual).to.deep.equal(expected);
        });

        it('filters at the "admin" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullEpisodeData));
            //delete the fields we don't expect to see:
            delete expected.id;
            delete expected.projectId;

            //Get the actual result
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'admin');

            //Compare
            expect(actual).to.deep.equal(expected);
        });

        it('filters at the "debug" dataLevel correctly', () => {
            const expected = JSON.parse(JSON.stringify(fullEpisodeData));
            //delete the fields we don't expect to see:
            //--debug sees it all!--//

            //Get the actual result
            const actual = filter(fullEpisodeData, 'episode_schema.json', 'debug');

            //Compare
            expect(actual).to.deep.equal(expected);
        });
    });

    //TODO: Add tests for episodeFiles
    //TODO: Add tests for projects    
});
