define(function (require, exports, module) {

    'use strict';

    var KeyboardIterator = require('cc/helper/KeyboardIterator');

    KeyboardIterator.defaultOptions = {
        loop: true,
        interval: 100,
        step: 1,
        index: 0,
        minIndex: 0,
        defaultIndex: -1,
        prevKey: 'up',
        nextKey: 'down'
    };

    return KeyboardIterator;

});