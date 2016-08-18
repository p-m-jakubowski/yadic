# Yadic

Yadic is minimalistic JavaScript implementation of Dependency Injection Container with async components in mind.

## Installation

```
npm install --save yadic
```

## Usage

### Basic

```javascript
/* components/componentA */
function Constructor(httpRequest, componentB) {
    // ...
}
Constructor['@type'] = 'constructor';
Constructor['@inject'] = ['httpRequest', 'componentB'];
```

```javascript
/* components/componentB */
function factory() {
    return {};
}
factory['@type'] = 'factory';
factory['@singleton'] = true;
```

```javascript
/* index */
const Yadic = require('yadic');

var yadic = new Yadic({
    componentA: require('./components/componentA'),
    httpRequest: require('request')
});

// you can add modules to container dynamically
yadic.add({
    componentB: require('./components/componentB')
});

yadic.get('componentA').then(function(componentA) {
    // ... 
});

```

Module can be described with annotations.  

* `@type` - indicates if function should be treated as factory or constructor (therefore allowed values are
  'constructor' or 'factory')
* `@singleton` - indicates if component should be instantiated only once
* `@inject` - list of components that should be injected into factory/constructor
* `@yadic` - defines local modules, see [below](#local-modules)

Module that is not a function or is a function without `@type` annotation is treated as singleton.  

### Local modules

You can define local modules by using `@yadic` annotation.  
Local modules are visible only for module in which they were defined, but they can use modules that are part of their parent's container.

``` javascript
/* components/componentA */
function Constructor() {
    // ...
}
Constructor['@type'] = 'constructor';
Constructor['@inject'] = ['componentB', 'localComponent'];
Constructor['@yadic'] = {
    'localComponent': require('./localComponent')
};
```

``` javascript
/* components/componentsA/localComponent */
function LocalFactory() {
    // ...
}
LocalFactory['@type'] = 'factory';
LocalFactory['@inject'] = ['componentB'];
```

``` javascript
/* index */
const Yadic = require('yadic');

var yadic = new Yadic({
    componentA: require('./components/componentA'),
    componentB: require('./components/componentB')
});
```

### Yadic chaining

You can create yadic chain, that works similar to prototype chain.

```javascript
var protoYadic = new Yadic({
    componentA: require('./components/componentA')
});
var yadic = new Yadic({
    componentB: require('./components/componentB')
}, protoYadic);

// will return component from protoYadic
yadic.get('componentA').then(/* ... */); 
```
