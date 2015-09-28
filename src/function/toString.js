/**
 * @file 转成 string 类型
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 转成 string 类型
     *
     * @param {*} value
     * @param {*} defaultValue
     * @return {string}
     */
    return function (value, defaultValue) {

        var type = $.type(value);

        if (type === 'number') {
            value = '' + value;
        }
        else if (type !== 'string') {

            if (arguments.length === 1) {
                defaultValue = '';
            }

            value = defaultValue;

        }

        return value;

    };

});