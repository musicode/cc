/**
 * @file 周偏移，单位是周
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var dateOffset = require('./dateOffset');

    return function (date, offset) {
        return dateOffset(date, offset * 7);
    };

});