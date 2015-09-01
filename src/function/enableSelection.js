/**
 * @file 启用选中元素文本
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var element = $('<i></i>')[0];
    var supportSelectStart = 'onselectstart' in element;
    var supportFirefoxUserSelect = 'MozUserSelect' in element.style;
    element = null;

    if (supportSelectStart) {
        return function (target) {
            target = target || document;
            target.onselectstart = null;
        };
    }

    if (supportFirefoxUserSelect) {
        return function (target) {
            target = target || document.body;
            target.style.MozUserSelect = '';
        };
    }

    return $.noop;

});