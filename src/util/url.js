/**
 * @file url
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var split = require('../function/split');

    /**
     * 把查询字符串解析成对象，反向操作可用 $.param
     *
     * @param {string} queryStr 查询字符串，可直接把 location.search 扔进来解析
     * @return {Object}
     */
    exports.parseQuery = function (queryStr) {

        var result = { };

        if ($.type(queryStr) === 'string' && queryStr.indexOf('=') >= 0) {

            var firstChar = queryStr.charAt(0);
            var startIndex = (firstChar === '?' || firstChar === '#') ? 1 : 0;
            if (startIndex > 0) {
                queryStr = queryStr.substr(startIndex);
            }

            $.each(
                split(queryStr, '&'),
                function (index, item) {
                    var terms = split(item, '=');
                    if (terms.length === 2) {
                        var key = terms[0];
                        if (key) {
                            result[key] = decodeURIComponent(terms[1]);
                        }
                    }
                }
            );

        }

        return result;
    };

    /**
     * 解析 url，返回格式遵循 location 属性的命名
     *
     * @param {string=} url 如果不传，使用当前地址
     * @return {Object}
     */
    exports.parse = function (url) {

        if (url == null) {
            url = document.URL;
        }

        var link = document.createElement('a');
        link.href = url;

        // 用 a 来格式化
        url = link.href;

        var origin = '';

        if (link.protocol && link.host) {
            origin = link.protocol + '//' + link.host;
        }
        else if (/^(http[s]?:\/\/[^/]+)(?=\/)/.test(url)) {
            origin = RegExp.$1;
        }

        // xp 下 http 可能会解析出 80 端口，实际是不需要的
        var terms = origin.split(':');

        if (origin.indexOf('http:') === 0
            && terms.length === 3
            && terms[2] == 80
        ) {
            terms.length = 2;
            origin = terms.join(':');
        }

        var pathname = link.pathname;

        if (pathname && pathname.charAt(0) !== '/') {
            pathname = '/' + pathname;
        }

        return {
            origin: origin,
            pathname: pathname,
            search: link.search,
            hash: link.hash
        };
    };

    /**
     * 把参数混入一个 url
     * 这种使用场景特别普遍，比如翻页，只需要传入 mixin({ page: 1 })
     *
     * @param {Object} query 混入的参数
     * @param {string=} url 如果不传，使用当前地址
     * @param {boolean=} applyHash 是否应用于 hash
     */
    exports.mixin = function (query, url, applyHash) {

        if ($.type(url) === 'boolean' && arguments.length === 2) {
            applyHash = url;
            url = null;
        }

        if (url == null) {
            url = document.URL;
        }

        var scheme = exports.parse(url);
        var params = exports.parseQuery(applyHash ? scheme.hash : scheme.search);
        $.extend(params, query);
        params = $.param(params);

        url = scheme.origin + scheme.pathname;

        if (applyHash) {
            url += scheme.search;
        }
        else if (params) {
            url += '?' + params;
        }

        if (!applyHash) {
            url += scheme.hash;
        }
        else if (params) {
            url += '#' + params;
        }

        return url;

    };

});