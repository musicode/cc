/**
 * @file 下一个执行时刻
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var nextTick;

    if (typeof setImmediate === 'function') {
        nextTick = setImmediate;
    }
    else {
        nextTick = setTimeout;
    }

    return nextTick;

});