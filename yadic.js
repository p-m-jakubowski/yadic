'use strict';

function Yadic(modules) {
    this.container = {};
    this.addFactories(modules);
}

Yadic.prototype.addFactories = function(modules) {
    for (var i in modules) {
        this.container[i] = createFactory(modules[i], this.container);
    }
};

Yadic.prototype.get = function(name) {
    if (!(name in this.container)) {
        return Promise.reject(new Error('Unknown module ' + name));
    }
    return this.container[name]();
};

function createFactory(mod, container) {
    switch (typeof mod) {
        case 'string':
            return createFactoryFromPath(mod, container);
        case 'function':
            if (mod['@type'] !== undefined) {
                return createFactoryFromFunction(mod, container);
            }
        default:
            return createFactoryFromPlainModule(mod, container);
    }
}

function createFactoryFromPath(modulePath, container) {
    return createFactory(require(modulePath), container);
}

function createFactoryFromPlainModule(mod) {
    return function() {
        return Promise.resolve(mod);
    };
}

function createFactoryFromFunction(moduleFn, container) {
    if (moduleFn['@singleton']) {
        var singleton;
        return function() {
            singleton = singleton || createModule(moduleFn, container);
            return singleton;
        };
    } else {
        return function() {
            return createModule(moduleFn, container);
        };
    }
}

function createModule(moduleFn, container) {
    return resolveDependencies(moduleFn['@inject'] || [], container)
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

function resolveDependencies(deps, container) {
    return Promise.all(
        deps.map(function(dep) {
            if (dep in container) {
                return container[dep]();
            } else {
                Promise.reject(new Error('Unknown module ' + dep));
            }
        })
    );
}

module.exports = Yadic;
