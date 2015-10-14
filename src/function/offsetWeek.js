/**
 * @file 周偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var offsetDate = require('./offsetDate');

    return function (date, offset) {
        return offsetDate(date, offset * 7);
    };

});