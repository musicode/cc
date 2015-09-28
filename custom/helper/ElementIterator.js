define(function (require, exports, module) {

    'use strict';

    var ElementIterator = require('cc/helper/ElementIterator');

    ElementIterator.defaultOptions = {
        loop: true,
        interval: 100,
        step: 1,
        index: 0,
        minIndex: 0,
        defaultIndex: -1,
        prevKey: 'up',
        nextKey: 'down'
    };

    return ElementIterator;

});