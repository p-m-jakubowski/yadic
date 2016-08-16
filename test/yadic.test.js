'use strict';

var path = require('path');

var Yadic = require('../yadic');

describe('yadic', function() {
   
    describe('constructor', function() {
        
        it('should load modules from path', function() {
            new Yadic({
                constructorModule: path.join(__dirname, './modules/constructor-module'),
                factoryModule: path.join(__dirname, './modules/factory-module'),
                plainModule: path.join(__dirname, './modules/plain-module'),
                singletonModule: path.join(__dirname, './modules/singleton-module')
            });
        });

        it('should load plain modules', function() {
            new Yadic({
                functionModule: function() {},
                objectModule: {}
            });
        });

        it('should throw an error for invalid path', function() {
            expect(function() {
                new Yadic({
                    module: './a/b/c'
                });
            }).toThrow();
        });

        it('should throw when module is null or undefined', function() {
            expect(function() {
                new Yadic({
                    module: null
                });
            }).toThrow();

            expect(function() {
                new Yadic({
                    module: undefined
                });
            }).toThrow();
        });

    });

    describe('#add', function() {
        
        it('should add modules to existing container', function() {
            var yadic = new Yadic({});
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            yadic.add({
                constructorModule: Constructor
            });

            return yadic.get('constructorModule');
        });

    });

    describe('#get', function() {

        it('should create instance from constructor when @type is `constructor`', function() {
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            var yadic = new Yadic({
                constructorModule: Constructor
            });

            return yadic.get('constructorModule').then(function(mod) {
                expect(mod instanceof Constructor).toBe(true);
            });
        });

        it('should create different instance from constructor for each call', function() {
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            var yadic = new Yadic({
                constructorModule: Constructor
            });

            return yadic.get('constructorModule').then(function(modA) {
                return yadic.get('constructorModule').then(function(modB) {
                    expect(modA).not.toBe(modB);
                });
            });
        });

        it('should create instance from factory when @type is `factory`', function() {
            var factory = jest.fn(function() {
                return {name: 'instance'};
            });
            factory['@type'] = 'factory';

            var yadic = new Yadic({
                factoryModule: factory
            });

            return yadic.get('factoryModule').then(function(mod) {
                expect(mod).toEqual({name:'instance'});
            });
        });

        it('should create different instance from factory for each call', function() {
            var factory = jest.fn(function() {
                return {name: 'instance'};
            });
            factory['@type'] = 'factory';

            var yadic = new Yadic({
                factoryModule: factory
            });

            return yadic.get('factoryModule').then(function(modA) {
                return yadic.get('factoryModule').then(function(modB) {
                    expect(modA).not.toBe(modB);
                });
            });
        });

        it('should return a singleton', function() {
            var Singleton = function() {
                return {};
            };
            Singleton['@type'] = 'constructor';
            Singleton['@singleton'] = true;

            var yadic = new Yadic({
                singletonModule: Singleton
            });

            return yadic.get('singletonModule').then(function(modA) {
                return yadic.get('singletonModule').then(function(modB) {
                    expect(modA).toBe(modB);
                });
            });
        });

        it('should return plain module', function() {
            var plain = {};
            var yadic = new Yadic({
                plainModule: plain
            });

            return yadic.get('plainModule').then(function(mod) {
                expect(mod).toBe(plain);
            });
        });

        it('should return module with injected dependencies', function() {
            var plain = {};
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            var ConstructorWithDependencies = jest.fn();
            ConstructorWithDependencies['@type'] = 'constructor';
            ConstructorWithDependencies['@inject'] = ['plainModule', 'constructorModule'];

            var yadic = new Yadic({
                constructorModule: Constructor,
                plainModule: plain,
                constructorWithDependencies: ConstructorWithDependencies
            });

            return yadic.get('constructorWithDependencies').then(function(mod) {
                expect(mod instanceof ConstructorWithDependencies).toBe(true);
                expect(ConstructorWithDependencies.mock.calls[0][0]).toBe(plain);
                expect(ConstructorWithDependencies.mock.calls[0][1] instanceof Constructor).toBe(true);
            });
        });

        it('should reject for unknown module', function() {
            var yadic = new Yadic({});

            return yadic.get('unknown-module').then(function() {
                    expect(false).toBe(true);
                })
                .catch(function(error) {
                    expect(error instanceof Error).toBe(true);
                });
        });

        it('should reject for unknown dependencies to inject', function() {
            var ConstructorWithDependencies = jest.fn();
            ConstructorWithDependencies['@type'] = 'constructor';
            ConstructorWithDependencies['@inject'] = ['unknownDependency'];

            var yadic = new Yadic({
                constructorWithDependencies: ConstructorWithDependencies
            });

            return yadic.get('constructorWithDependencies').then(function() {
                    expect(false).toBe(true);
                })
                .catch(function(error) {
                    expect(error instanceof Error).toBe(true);
                });
        });

        it('should reject for module with unknown type', function() {
            var mod = function() {};
            mod['@type'] = 'unknown';

            var yadic = new Yadic({
                unknownTypeModule: mod
            });

            return yadic.get('unknownTypeModule').then(function() {
                    expect(false).toBe(true);
                })
                .catch(function(error) {
                    expect(error instanceof Error).toBe(true);
                });
        });

    });

});
