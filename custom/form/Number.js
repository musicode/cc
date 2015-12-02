define(function (require, exports, module) {

    'use strict';

    var Number = require('cc/form/Number');

    Number.defaultOptions = {
        step: 1,
        interval: 100,
        inputSelector: 'input[type="text"]',
        upSelector: '.icon-caret-up',
        downSelector: '.icon-caret-down'
    };

    return Number;

});