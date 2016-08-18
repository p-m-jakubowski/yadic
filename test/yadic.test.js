'use strict';

var path = require('path');

var Yadic = require('../yadic');

describe('yadic', function() {
   
    describe('constructor', function() {
        
        it('should load modules of different types', function() {
            new Yadic({
                A: function() {},
                B: {},
                C: 'string',
                D: 1,
                E: null,
                F: undefined
            });
        });

    });

    describe('#add', function() {
        
        it('should add modules to existing container', function() {
            var yadic = new Yadic({});
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            yadic.add({
                constructorComponent: Constructor
            });

            return yadic.get('constructorComponent');
        });

    });

    describe('#get', function() {

        it('should create instance from constructor when @type is `constructor`', function() {
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            var yadic = new Yadic({
                constructorComponent: Constructor
            });

            return yadic.get('constructorComponent').then(function(component) {
                expect(component instanceof Constructor).toBe(true);
            });
        });

        it('should create different instance from constructor for each call', function() {
            var Constructor = function() {};
            Constructor['@type'] = 'constructor';

            var yadic = new Yadic({
                constructorComponent: Constructor
            });

            return yadic.get('constructorComponent').then(function(componentA) {
                return yadic.get('constructorComponent').then(function(componentB) {
                    expect(componentA).not.toBe(componentB);
                });
            });
        });

        it('should create instance from factory when @type is `factory`', function() {
            var factory = jest.fn(function() {
                return {name: 'instance'};
            });
            factory['@type'] = 'factory';

            var yadic = new Yadic({
                factoryComponent: factory
            });

            return yadic.get('factoryComponent').then(function(component) {
                expect(component).toEqual({name:'instance'});
            });
        });

        it('should create different instance from factory for each call', function() {
            var factory = jest.fn(function() {
                return {name: 'instance'};
            });
            factory['@type'] = 'factory';

            var yadic = new Yadic({
                factoryComponent: factory
            });

            return yadic.get('factoryComponent').then(function(componentA) {
                return yadic.get('factoryComponent').then(function(componentB) {
                    expect(componentA).not.toBe(componentB);
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
                singletonComponent: Singleton
            });

            return yadic.get('singletonComponent').then(function(componentA) {
                return yadic.get('singletonComponent').then(function(componentB) {
                    expect(componentA).toBe(componentB);
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

            var ConstructorWithDependencies = function(plain, constructorComponent) {
                this.plain = plain;
                this.constructorComponent = constructorComponent;
            };
            ConstructorWithDependencies['@type'] = 'constructor';
            ConstructorWithDependencies['@inject'] = ['plainModule', 'constructorComponent'];

            var yadic = new Yadic({
                constructorComponent: Constructor,
                plainModule: plain,
                constructorWithDependencies: ConstructorWithDependencies
            });

            return yadic.get('constructorWithDependencies').then(function(component) {
                expect(component instanceof ConstructorWithDependencies).toBe(true);
                expect(component.plain).toBe(plain);
                expect(component.constructorComponent instanceof Constructor).toBe(true);
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
            var ConstructorWithDependencies = function() {};
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
                unknownTypeComponent: mod
            });

            return yadic.get('unknownTypeComponent').then(function() {
                    expect(false).toBe(true);
                })
                .catch(function(error) {
                    expect(error instanceof Error).toBe(true);
                });
        });

        it('should use proto-yadic for undefined modules', function() {
            var protoModuleA = {};
            var protoYadic = new Yadic({
                moduleA: protoModuleA,
            });
            var yadic = new Yadic({}, protoYadic);

            return yadic.get('moduleA', function(mod) {
                expect(mod).toBe(protoModuleA);
            });
        });

        it('should not use proto-yadic for defined modules', function() {
            var protoModuleA = {};
            var protoYadic = new Yadic({
                moduleA: protoModuleA,
            });
            var moduleA = {};
            var yadic = new Yadic({
                moduleA: moduleA
            }, protoYadic);

            return yadic.get('moduleA', function(mod) {
                expect(mod).toBe(moduleA);
            });
        });

        it('should use local yadic first when inject dependencies', function() {
            var moduleA = {};
            var Constructor = function(moduleA, moduleB) {
                this.moduleA = moduleA;
                this.moduleB = moduleB;
            };
            Constructor['@type'] = 'constructor';
            Constructor['@inject'] = ['moduleA', 'moduleB'];
            Constructor['@yadic'] = {
                moduleA: moduleA
            };

            var moduleB = {};
            var yadic = new Yadic({
                constructorComponent: Constructor,
                moduleA: {},
                moduleB: moduleB
            });

            return yadic.get('constructorComponent').then(function(component) {
                expect(component.moduleA).toBe(moduleA);
                expect(component.moduleB).toBe(moduleB);
            });
        });

        describe('local yadic', function() {
            
            it('should use modules from parent yadic', function() {
                var LocalConstructor = function(mod) {
                    this.mod = mod;
                };
                LocalConstructor['@type'] = 'constructor';
                LocalConstructor['@inject'] = ['mod'];

                var Constructor = function(localComponent) {
                    this.localComponent = localComponent;
                };
                Constructor['@type'] = 'constructor';
                Constructor['@inject'] = ['localComponent'];
                Constructor['@yadic'] = {
                    localComponent: LocalConstructor
                };

                var mod = {};
                var yadic = new Yadic({
                    constructorComponent: Constructor,
                    mod: mod
                });

                return yadic.get('constructorComponent').then(function(component) {
                    expect(component.localComponent.mod).toBe(mod);
                });
            });

        });

    });

});
