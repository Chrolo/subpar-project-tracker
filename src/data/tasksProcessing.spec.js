/*global describe it*/
const expect = require('chai').expect;

const TasksProcessing = require('./tasksProcessing.js');

describe('TasksProcessing Module', () => {
    describe('getCurrentTaskIds', () => {
        it('filters a collection of tasks, returning ids of those that are ready to begin', () => {
            const testTaskList = {
                1: {completed: 'something Non-Null'},
                2: {dependsOn: [1]},
                3: {dependsOn: [2]},
                4: {completed: 'something Non-null'},
                5: {dependsOn: [1, 2]},
                6: {dependsOn: [1, 4]}
            };

            const expectedTasks = ["2", "6"];

            expect(TasksProcessing.getCurrentTaskIds(testTaskList)).to.deep.equal(expectedTasks);
        });

        it('filters an array of tasks, returning ids of those that are ready to begin', () => {
            const testTaskList = [
                {id: 1, completed: 'something Non-Null'},
                {id: 2, dependsOn: [1]},
                {id: 3, dependsOn: [2]},
                {id: 4, completed: 'something Non-null'},
                {id: 5, dependsOn: [1, 2]},
                {id: 6, dependsOn: [1, 4]}
            ];

            const expectedTasks = ["2", "6"];

            expect(TasksProcessing.getCurrentTaskIds(testTaskList)).to.deep.equal(expectedTasks);
        });

    });
});
