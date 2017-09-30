/*globals describe it*/
const proxyquire = require('proxyquire');
const expect = require('chai').expect;
require('../../util/Logger.js').setLogLevel('warn');    //Stop debug messages

describe('data/sql/tasks', () => {
    describe('insertTaskBatchFromTemplate', () => {
        it('Adds the tasks and dependencies from the template, adjusting the Ids given to the ones returned by the mysql insertion', (done) => {
            const tasksTemplate = [
                {
                    "id": 1,
                    "taskName": "task one",
                    "completed": null,
                    "staffName": "bob1",
                    "dependsOn": [],
                    "lastUpdated": null,
                    "episodeId": 3
                },
                {
                    "id": 2,
                    "taskName": "task two",
                    "completed": null,
                    "staffName": "bob2",
                    "dependsOn": [1],
                    "lastUpdated": null,
                    "episodeId": 3
                },
                {
                    "id": 3,
                    "taskName": "task three",
                    "completed": null,
                    "staffName": "bob3",
                    "dependsOn": [1, 2],
                    "lastUpdated": null,
                    "episodeId": 3
                }
            ];
            //setup the promiseQuery stubs:
            const promiseQuerySpy = (() => {
                const calledWith = [];
                const stubbedMysqlResults = [
                    {
                        insertId: 11
                    },
                    {
                        insertId: 12
                    },
                    {
                        insertId: 13
                    } //First results are from inserting task and we need the new ID
                ];

                return {
                    calledWith,
                    func: (...args) => {
                        calledWith.push(args);
                        return Promise.resolve((calledWith.length - 1 < stubbedMysqlResults.length) ? stubbedMysqlResults[calledWith.length - 1] : true);
                    }
                };
            })();
            //stub createInsertionObject
            const createInsertionObjectSpy = (() => {
                const calledWith = [];
                return {
                    calledWith,
                    func: (...args) => {
                        calledWith.push(args);
                        return {
                            sql: 'sqlString',
                            data: ['fake', 'data']
                        };
                    }
                };
            })();

            //proxyquire the tasks module:
            const tasks = proxyquire('./tasks.js', {
                './utils.js': {
                    promiseQuery: promiseQuerySpy.func,
                    createInsertionObject: createInsertionObjectSpy.func
                }
            });
            //---Stubbed---//

            //Run and assert
            tasks.insertTaskBatchFromTemplate(null, tasksTemplate).then(() => {
                //Assertions:
                expect(promiseQuerySpy.calledWith.length, 'Expect there to have been 3 queries.').to.equal(3);

                //assert the initial inserts expected:
                const expectedInsertData = [
                    {
                        "taskName": "task one",
                        "completed": null,
                        "staffName": "bob1",
                        "lastUpdated": null,
                        "episodeId": 3
                    },
                    {
                        "taskName": "task two",
                        "completed": null,
                        "staffName": "bob2",
                        "lastUpdated": null,
                        "episodeId": 3
                    },
                    {
                        "taskName": "task three",
                        "completed": null,
                        "staffName": "bob3",
                        "lastUpdated": null,
                        "episodeId": 3
                    }
                ];
                //Check the task insertions
                const actualInsertsForTableTask = createInsertionObjectSpy.calledWith.filter(insert => insert[0] === 'tasks');
                expect(actualInsertsForTableTask.length, 'Expect only Insertion call to `tasks` (all insertions in one batch)').to.equal(1);
                const insertedData = actualInsertsForTableTask[0][1];
                expect(insertedData).to.deep.equal(expectedInsertData);

                //Assert that task_dependencies were created correctly,
                // base on the new insertIds returned from previous insertions:
                const expectedTaskDependencyInserts = [
                    [
                        {
                            taskId: 12,
                            preTaskId: 11
                        }
                    ],
                    [
                        {
                            taskId: 13,
                            preTaskId: 11
                        },
                        {
                            taskId: 13,
                            preTaskId: 12
                        }
                    ]
                ];
                const actualDependencyInserts = createInsertionObjectSpy.calledWith.filter(insert => insert[0] === 'task_dependencies');
                expect(actualDependencyInserts.length, `Expected ${expectedTaskDependencyInserts.length} inserts for task dependencies`).to.equal(expectedTaskDependencyInserts.length);

                expectedTaskDependencyInserts.forEach((expectedInsert) => {
                    const index = actualDependencyInserts.findIndex(insert => insert[1][0].taskId === expectedInsert[0].taskId);
                    expect(index, `Expected to find insert for task ${JSON.stringify(expectedInsert)} in ${JSON.stringify(actualDependencyInserts)}`).to.not.equal(-1);
                    const matchedInsertion = actualDependencyInserts[index];
                    //check that each dependency was inserted:
                    expectedInsert.forEach((taskDependency) => {
                        const dataIndex = matchedInsertion[1].findIndex(row => row.taskId === taskDependency.taskId && row.preTaskId === taskDependency.preTaskId);
                        expect(dataIndex, `Expected to find match for ${JSON.stringify(taskDependency)} in ${JSON.stringify(matchedInsertion)}`).to.not.equal(-1);
                    });
                });

                //Finished assertions
                done();
            }).catch(done);
        });
    });

    describe('deleteTasksForEpisodeId', () => {
        //setup the promiseQuery stubs:
        const promiseQuerySpy = (() => {
            const calledWith = [];
            const stubbedMysqlResults = [[{id: 3}]];    //It first does a SELECT for ids related to episodeId

            return {
                calledWith,
                func: (...args) => {
                    calledWith.push(args);
                    return Promise.resolve((calledWith.length - 1 < stubbedMysqlResults.length) ? stubbedMysqlResults[calledWith.length - 1] : true);
                }
            };
        })();
        const tasks = proxyquire('./tasks.js', {
            './utils.js': {
                promiseQuery: promiseQuerySpy.func
            }
        });

        it('sends a DELETE action for all tasks related to the given id', (done) => {
            const testEpisodeId = 5;
            tasks.deleteTasksForEpisodeId({}, testEpisodeId).then(() => {
                //Check there was a call to DELETE on tasks
                const deletesOnTasks = promiseQuerySpy.calledWith.filter((call) => {
                    const matches = call[1].match(/DELETE FROM tasks/);
                    return matches && matches.length;
                });
                expect(deletesOnTasks.length, 'Expected 1 action to DELETE from tasks').to.equal(1);
                const deleteTask = deletesOnTasks[0];
                expect(deleteTask[1].match(/episodeId\s+=\s+\?/).length, `Expected to see a clause to match episodeId`).to.equal(1);
                expect(deleteTask[2], `Expected deletion to call against episodeId ${testEpisodeId}`).to.equal(testEpisodeId);
                done();

            }).catch(done);
        });
    });
});
