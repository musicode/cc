/**
 * @file 小时偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var offsetMinute = require('./offsetMinute');

    return function (date, offset) {
        return offsetMinute(date, offset * 60);
    };

});