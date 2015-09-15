/**
 * @file 是否是文档当前激活元素
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (element) {

        if (element.jquery) {
            element = element[0];
        }

        return document.activeElement === element;

    };

});