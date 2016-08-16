'use strict';

var path = require('path');

var Yadic = require('../yadic');

describe('yadic', function() {
    var yadic;
   
    beforeEach(function() {
        yadic = new Yadic({
            constructorModule: path.join(__dirname, './modules/constructor-module'),
            factoryModule: path.join(__dirname, './modules/factory-module'),
            plainModule: path.join(__dirname, './modules/plain-module'),
            singletonModule: path.join(__dirname, './modules/singleton-module')
        });
    });

    it('should create module from constructor', function() {
        var Constructor = require('./modules/constructor-module');

        return yadic.get('constructorModule').then(function(mod) {
            expect(mod instanceof Constructor).toBe(true);
        });
    });

    it('should create different module from constructor for each call', function() {
        return yadic.get('constructorModule').then(function(modA) {
            return yadic.get('constructorModule').then(function(modB) {
                expect(modA).not.toBe(modB);
            });
        });
    });

    it('should create module from factory', function() {
        return yadic.get('factoryModule').then(function(mod) {
            expect(mod).toEqual({name:'instance'});
        });
    });

    it('should create different module from factory for each call', function() {
        return yadic.get('factoryModule').then(function(modA) {
            return yadic.get('factoryModule').then(function(modB) {
                expect(modA).not.toBe(modB);
            });
        });
    });

    it('should return plain module', function() {
        var plainModule = require('./modules/plain-module');
        return yadic.get('plainModule').then(function(mod) {
            expect(plainModule).toBe(mod);
        });
    });

    it('should return a singleton', function() {
        return yadic.get('singletonModule').then(function(modA) {
            return yadic.get('singletonModule').then(function(modB) {
                expect(modA).toBe(modB);
            });
        });
    });

    it('should return module with injected dependencies', function() {
        var ConstructorWithDependencies = jest.fn();
        ConstructorWithDependencies['@type'] = 'constructor';
        ConstructorWithDependencies['@inject'] = ['plainModule', 'constructorModule'];

        yadic.addFactories({
            'moduleWithDependencies': ConstructorWithDependencies
        });

        return yadic.get('moduleWithDependencies').then(function(mod) {
            var plainModule = require('./modules/plain-module');
            var Constructor = require('./modules/constructor-module');

            expect(mod instanceof ConstructorWithDependencies).toBe(true);
            expect(ConstructorWithDependencies.mock.calls[0][0]).toBe(plainModule);
            expect(ConstructorWithDependencies.mock.calls[0][1] instanceof Constructor).toBe(true);
        });
    });

    it('should reject for unknown dependencies to inject', function() {
        var ConstructorWithDependencies = jest.fn();
        ConstructorWithDependencies['@type'] = 'constructor';
        ConstructorWithDependencies['@inject'] = ['unknownDependency'];

        yadic.addFactories({
            'moduleWithDependencies': ConstructorWithDependencies
        });

        return yadic.get('moduleWithDependencies').catch(function (error) {
            expect(error instanceof Error).toBe(true);
        });
    });

});
