/**
 * @file url
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 把查询字符串解析成对象，反向操作可用 $.param
     *
     * @param {string} queryStr 查询字符串，可直接把 location.search 或 location.hash 扔进来解析
     * @return {Object}
     */
    exports.parseQuery = function (queryStr) {

        var result = { };

        if (typeof queryStr === 'string' && queryStr.length > 1) {

            var startIndex = 0;

            var firstChar = queryStr.charAt(0);
            var secondChar = queryStr.charAt(1);

            // query 如 ?a=1
            if (firstChar === '?') {
                startIndex = 1;
            }
            // hash 如 #a=1
            else if (firstChar === '#') {
                startIndex = 1;

                // hash 如 #/a=1&b=2
                if (secondChar === '/') {
                    startIndex = 2;
                }
            }

            if (startIndex > 0) {
                queryStr = queryStr.substr(startIndex);
            }



            $.each(
                queryStr.split('&'),
                function (index, item) {
                    var parts = item.split('=');
                    if (parts.length === 2) {
                        var key = $.trim(parts[0]);
                        if (key) {
                            result[key] = decodeURIComponent($.trim(parts[1]));
                        }
                    }
                }
            );
        }

        return result;
    };

    /**
     * 获取当前网页的 origin（可在现代浏览器控制台输入 location.origin）
     *
     * @return {string}
     */
    exports.getOrigin = function () {

        var location = window.location;

        return location.origin
             ? location.origin
             : location.protocol + '//' + location.host;
    };

});