define(function (require, exports, module) {

    'use strict';

    var Wheel = require('cc/helper/Wheel');

    Wheel.defaultOptions = {
        watchElement: require('cc/util/instance').document
    };

    return Wheel;

});