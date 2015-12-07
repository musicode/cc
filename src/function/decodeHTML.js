/**
 * @file decode html 字符
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * decode html 字符
     *
     * @param {string} source 字符串
     * @return {string}
     */
    return function (source) {

        var str = String(source)
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        // 处理转义的中文和实体字符
        return str.replace(
            /&#([\d]+);/g,
            function ($0, $1) {
                return String.fromCharCode(parseInt($1, 10));
            }
        );

    };

});