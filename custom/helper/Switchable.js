define(function (require, exports, module) {

    'use strict';

    var Switchable = require('cc/helper/Switchable');

    Switchable.defaultOptions = {
        index: 0,
        switchTrigger: 'click',
        switchDelay: 100
    };

    return Switchable;

});