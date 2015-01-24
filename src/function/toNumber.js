/**
 * @file 转成 number 类型
 * @author zhujialu
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 转成 number 类型
     *
     * @param {*} value
     * @param {*} defaultValue 转换失败时的默认值
     * @return {number}
     */
    return function (value, defaultValue) {

        if ($.type(value) !== 'number') {
            value = $.isNumeric(value)
                  ? +value
                  : defaultValue;
        }

        return value;

    };

});