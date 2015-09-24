/**
 * @file 拆解字符串，并 trim 每个部分
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 拆解字符串，并 trim 每个部分
     *
     * @param {string} str 字符串
     * @param {string} sep 分隔符
     * @return {Array.<string>}
     */
    return function (str, sep) {

        var result = [ ];

        if ($.type(str) === 'number') {
            str = '' + str;
        }

        if (str && $.type(str) === 'string') {
            $.each(
                str.split(sep),
                function (index, part) {
                    part = $.trim(part);
                    if (part) {
                        result.push(part);
                    }
                }
            );
        }

        return result;
    };

});