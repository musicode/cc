/**
 * @file 第一个字母转成大写
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 转成 number 类型
     *
     * @param {string} word
     * @return {string}
     */
    return function (word) {

        return word.charAt(0).toUpperCase()
             + word.slice(1);

    };

});