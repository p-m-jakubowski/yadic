'use strict';

function Yadic(modules, yadic) {
    var container = {};

    this.add = function(modules) {
        for (var i in modules) {
            container[i] = createFactory(modules[i], this);
        }
    };
    
    this.get = function(name) {
        if (!(name in container)) {
            if (!yadic) {
                return Promise.reject(new Error('Unknown module ' + name));
            }
            return yadic.get(name);
        }
        return container[name]();
    };

    this.add(modules);
}

function createFactory(mod, yadic) {
    switch (typeof mod) {
        case 'function':
            if (mod['@type'] !== undefined) {
                return createFactoryFromFunction(mod, yadic);
            }
        default:
            return createFactoryFromPlainModule(mod, yadic);
    }
}

function createFactoryFromPlainModule(mod) {
    return function() {
        return Promise.resolve(mod);
    };
}

function createFactoryFromFunction(moduleFn, yadic) {
    if (moduleFn['@singleton']) {
        var singleton;
        return function() {
            singleton = singleton || createComponent(moduleFn, yadic);
            return singleton;
        };
    } else {
        return function() {
            return createComponent(moduleFn, yadic);
        };
    }
}

function createComponent(moduleFn, yadic) {
    return resolveDependencies(moduleFn['@inject'] || [], yadic)
        .then(function(resolvedDeps) {
            switch(moduleFn['@type']) {
                case 'constructor': 
                    return new (moduleFn.bind.apply(moduleFn, [null].concat(resolvedDeps)));
                case 'factory':
                    return moduleFn.apply(null, resolvedDeps); 
                default:
                    throw new Error('Unknown type ' + moduleFn['@type']);
            }
        });
}

function resolveDependencies(deps, yadic) {
    return Promise.all(
        deps.map(function(dep) {
            return yadic.get(dep);
        })
    );
}

module.exports = Yadic;
