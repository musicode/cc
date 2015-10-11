/**
 * @file 小时偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var minuteOffset = require('./minuteOffset');

    return function (date, offset) {
        return minuteOffset(date, offset * 60);
    };

});