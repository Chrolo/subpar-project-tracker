/* globals describe it*/
const {expect} = require('chai');
const permissionProcessing = require('./permissionProcessing.js');
const {ENUMS} = require('./sql/permissions.js');

describe('data/permissionProcessing', () => {
    describe('isAllowedToUpdateTask()', () => {
        const isAllowedToUpdateTask = permissionProcessing.isAllowedToUpdateTask;
        it('returns false if task or apiPermission are falsey', () => {
            const testTask = {staffName: 'BOB', id: 1};
            const testPermissions = {staffName: 'BOB', permissions: {taskUpdate: ENUMS.taskUpdate.ALL}};

            const testArgs = [[void 0, testPermissions], [null, testPermissions], [testTask, void 0], [testTask, null]];
            testArgs.forEach(args => {
                expect(isAllowedToUpdateTask(...args), `Expect ${args} to give false`).to.be.false; //eslint-disable-line no-unused-expressions
            });
        });

        describe('With permissions to update OWN tasks', () => {
            it('returns false if task\'s staffName does not match token\'s staffName.', () => {
                const testTask = {staffName: 'BOB', id: 1};
                const testPermissions = {
                    staffName: 'notBob',
                    permissions: {
                        taskUpdate: ENUMS.taskUpdate.OWN
                    }
                };
                expect(isAllowedToUpdateTask(testTask, testPermissions)).to.be.false;   //eslint-disable-line no-unused-expressions
            });

            it('returns true if task\'s staffName does match token\'s staffName.', () => {
                const testTask = {staffName: 'BOB', id: 1};
                const testPermissions = {
                    staffName: 'BOB',
                    permissions: {
                        taskUpdate: ENUMS.taskUpdate.OWN
                    }
                };
                expect(isAllowedToUpdateTask(testTask, testPermissions)).to.be.true;    //eslint-disable-line no-unused-expressions
            });

        });

        describe('With permissions to update ALL tasks', () => {
            it('returns true, whether the  task\'s staffName matches or not.', () => {
                const testPermissions = {
                    staffName: 'notBob',
                    permissions: {
                        taskUpdate: ENUMS.taskUpdate.ALL
                    }
                };
                const testTaskMatched = {staffName: 'BOB', id: 1};
                const testTaskNotMatched = {staffName: 'notBob', id: 1};

                expect(isAllowedToUpdateTask(testTaskMatched, testPermissions)).to.be.true; //eslint-disable-line no-unused-expressions
                expect(isAllowedToUpdateTask(testTaskNotMatched, testPermissions)).to.be.true;  //eslint-disable-line no-unused-expressions
            });
        });
    });
});
