/**
 * @file 禁止选中元素文本
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var element = $('<i></i>')[0];

    if ('onselectstart' in element) {
        return function (target) {
            target = target || document;
            target.onselectstart = function () {
                return false;
            };
        };
    }

    if ('MozUserSelect' in element.style) {
        return function (target) {
            target = target || document.body;
            target.style.MozUserSelect = 'none';
        }
    }

    element = null;

});