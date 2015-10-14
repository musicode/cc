/**
 * @file 下一个时间片
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    // 整套组件用相同的时间片机制
    // 为了兼容 jQuery 的事件冒泡等问题
    // 不采用高级浏览器特性

    return function (fn) {
        var timer = setTimeout(fn, 0);
        return function () {
            clearTimeout(timer);
        };
    };

});