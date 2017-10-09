/* globals describe it*/
require('./myJs.js'); //Import those crazy globals
const {expect} = require('chai');

class FunctionSpy {
    constructor(func){
        this.spiedFunc= func;
        this.calledWith=[];
        this.func = this.func.bind(this);
    }

    func(...args){
        this.calledWith.push(args);
        if(this.spiedFunc){
            return this.spiedFunc(...args);
        }
        return void 0;
    }
}

describe('[util/myjs.js] My custom prototype extenders', () => {

    describe('Object.map();', () => {
        it('Calls the callback with the value and key for each entry in the object', () => {
            const spy = new FunctionSpy();
            const testObject = {test: 'with', about: 3, keys: () => {}}; //eslint-disable-line no-empty-function
            const testObjectKeys = Object.keys(testObject);
            //call the forEach method
            Object.map(testObject, spy.func);
            //Check results
            testObjectKeys.forEach((key) => {
                //filter the times it was called down to the one for this key
                const filteredArgs = spy.calledWith.filter(args => args[1]===key);
                //Check the key has been called:
                expect(filteredArgs.length, `Expected only one call for key ${key}, saw ${filteredArgs.length}`).to.equal(1);
                //Check it was called with the correct value
                const instanceArgs = filteredArgs[0]; //take out the (only) set of args
                expect(instanceArgs[0], 'Expected first arguement to callback to be the value').to.equal(testObject[key]);
            });
        });

        it('returns an object with the same keys, but with values returned from callback', () => {
            const testObject = {test: 'with', about: 3, keys: () => {}}; //eslint-disable-line no-empty-function
            const actual = Object.map(testObject, (v, k) => k);
            //expect all the keys to have value === key
            expect(actual).to.deep.equal({test: 'test', about: 'about', keys: 'keys'});
        });
    });

    describe('Object.prototype.forEach();', () => {
        it('calls the callback for each key in the object, with `(value, key)` as args', () => {
            const spy = new FunctionSpy();
            const testObject = {test: 'with', about: 3, keys: () => {}}; //eslint-disable-line no-empty-function
            const testObjectKeys = Object.keys(testObject);
            //call the forEach method
            testObject.forEach(spy.func);
            //Check results
            testObjectKeys.forEach((key) => {
                //filter the times it was called down to the one for this key
                const filteredArgs = spy.calledWith.filter(args => args[1]===key);
                //Check the key has been called:
                expect(filteredArgs.length, `Expected only one call for key ${key}, saw ${filteredArgs.length}`).to.equal(1);
                //Check it was called with the correct value
                const instanceArgs = filteredArgs[0]; //take out the (only) set of args
                expect(instanceArgs[0]).to.equal(testObject[key]);
            });
        });

        it('passes the full object as the 3rd argument to the callback', () => {
            const spy = new FunctionSpy();
            const testObject = {test: 'with', about: 3, keys: () => {}};    //eslint-disable-line no-empty-function
            const testObjectKeys = Object.keys(testObject);
            //call the forEach method
            testObject.forEach(spy.func);
            //Check results
            expect(spy.calledWith.length).to.equal(testObjectKeys.length);
            spy.calledWith.forEach((argSet) => {
                expect(argSet[2]).to.equal(testObject);
            });
        });

        it('does not show up in Object.keys(obj) calls', () => {
            const testObject = {
                these: 2,
                are: 3,
                keys: 5
            };

            expect(Object.keys(testObject)).to.not.include('forEach');
        });
    });

    describe('Promise.props();', () => {

        it('returns values against the properties they went in on', (done) => {
            const testPromiseObject = {
                a: 1,
                b: 2,
                c: Promise.resolve(3)
            };
            const expected = {
                a: 1, b: 2, c: 3
            };

            Promise.props(testPromiseObject)
                .then((result) => {
                    expect(result).to.deep.equal(expected);
                    done();
                })
                .catch((err) => {
                    done(`Test threw error: ${err}`);
                });
        });

        it('throws if one of the promises fails', (done) => {
            const testPromiseObject = {
                a: 1,
                b: 2,
                c: Promise.reject('failed')     //eslint-disable-line prefer-promise-reject-errors
            };

            Promise.props(testPromiseObject)
                .then((result) => {
                    done(`The promise should not have resolved. Resolved with: ${result}`);
                })
                .catch((err) => {
                    expect(err).to.equal('failed');
                    done();
                }).catch((err) => {
                    done(`Should't have thrown twice. Saw: ${err}`);
                });
        });

    });
});
