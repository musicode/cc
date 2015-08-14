/**
 * @file 转成 number 类型
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var parser = {
        int: parseInt,
        float: parseFloat
    };

    /**
     * 转成 number 类型
     *
     * @param {*} value
     * @param {*=} defaultValue 转换失败时的默认值
     * @param {string=} parseType 如果需要解析转换，可传入 int 或 float
     * @return {number}
     */
    return function (value, defaultValue, parseType) {

        if ($.type(value) !== 'number') {

            var parse = parser[parseType];

            value = parse ? parse(value, 10) : (+ value);

            if (isNaN(value)) {
                value = defaultValue;
            }
        }

        return value;

    };

});