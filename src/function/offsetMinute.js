/**
 * @file 分偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var offsetSecond = require('./offsetSecond');

    return function (date, offset) {
        return offsetSecond(date, offset * 60);
    };

});