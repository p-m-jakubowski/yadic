# Yadic

Yadic is minimalistic JavaScript implementation of Dependency Injection Container with async components in mind.

## Installation

```
npm install --save yadic
```

## Usage

```javascript
// components/componentA
function Constructor(httpRequest, componentB) {
    this.property = 'value';
    // ...
}
Constructor['@type'] = 'constructor';
Constructor['@inject'] = ['httpRequest', 'componentB'];

// components/componentB
function factory() {
    // ...
    return {
        // ..
    };
}
factory['@type'] = 'factory';
factory['@singleton'] = true;

// index
const Yadic = require('yadic');

var yadic = new Yadic({
    componentA: require('./components/componentA'),
    httpRequest: require('request')
});

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

Module that is not a function or is a function without `@type` annotation is treated as singleton.  
