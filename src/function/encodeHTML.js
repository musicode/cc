/**
 * @file encode html 字符
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * encode html 字符
     *
     * @param {string} source 字符串
     * @return {string}
     */
    return function (source) {

        return String(source)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

});