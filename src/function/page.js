/**
 * @file 获得网页元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 获得网页元素
     *
     * @return {HTMLElement}
     */
    return function () {
        if (document.body.clientHeight < document.documentElement.clientHeight) {
            return document.documentElement;
        }
        else {
            return document.body;
        }
    };

});