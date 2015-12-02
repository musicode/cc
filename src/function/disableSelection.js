/**
 * @file 禁止选中元素文本
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    if (document.selection) {
        return function () {
            document.body.onselectstart = function () {
                return false;
            };
        };
    }

    return $.noop;

});