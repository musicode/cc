/**
 * @file 分偏移
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var secondOffset = require('./secondOffset');

    return function (date, offset) {
        return secondOffset(date, offset * 60);
    };

});