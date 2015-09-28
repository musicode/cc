define(function (require, exports, module) {

    'use strict';

    var Iterator = require('cc/helper/Iterator');

    Iterator.defaultOptions = {
        loop: true,
        step: 1,
        minIndex: 0,
        interval: 100,
        defaultIndex: -1
    };

    return Iterator;

});