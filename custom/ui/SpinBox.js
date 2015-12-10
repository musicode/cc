define(function (require, exports, module) {

    'use strict';

    var SpinBox = require('cc/ui/SpinBox');

    SpinBox.defaultOptions = {
        step: 1,
        interval: 100,
        inputSelector: 'input[type="text"]',
        upSelector: '.icon-caret-up',
        downSelector: '.icon-caret-down'
    };

    return SpinBox;

});