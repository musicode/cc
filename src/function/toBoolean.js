/**
 * @file 转成 boolean 类型
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 转成 boolean 类型
     *
     * @param {*} value
     * @param {*} defaultValue
     * @return {*}
     */
    return function (value, defaultValue) {

        if ($.type(value) !== 'boolean') {

            if (arguments.length === 1) {
                defaultValue = !!value;
            }

            value = defaultValue;

        }

        return value;

    };

});