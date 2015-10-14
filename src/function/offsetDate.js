/**
 * @file 天偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var offsetHour = require('./offsetHour');

    return function (date, offset) {
        return offsetHour(date, offset * 24);
    };

});