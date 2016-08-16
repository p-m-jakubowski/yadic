'use strict';

function Yadic(modules) {
    this.container = {};
    this.addFactories(modules);
}

Yadic.prototype.addFactories = function(modules) {
    for (var i in modules) {
        this.container[i] = createFactory(modules[i], this);
    }
};

Yadic.prototype.get = function(name) {
    if (!(name in this.container)) {
        return Promise.reject(new Error('Unknown module ' + name));
    }
    return this.container[name]();
};

function createFactory(mod, yadic) {
    switch (typeof mod) {
        case 'string':
            return createFactoryFromPath(mod, yadic);
        case 'function':
            if (mod['@type'] !== undefined) {
                return createFactoryFromFunction(mod, yadic);
            }
        case 'object':
            if (mod !== null) {
                return createFactoryFromPlainModule(mod, yadic);
            }
        default:
            throw new Error('module must be a path, function or object');
    }
}

function createFactoryFromPath(modulePath, yadic) {
    return createFactory(require(modulePath), yadic);
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
            singleton = singleton || createModule(moduleFn, yadic);
            return singleton;
        };
    } else {
        return function() {
            return createModule(moduleFn, yadic);
        };
    }
}

function createModule(moduleFn, yadic) {
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
