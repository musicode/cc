/**
 * @file 使用 js 触发的跳转
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var urlUtil = require('../util/url');

    /**
     * 创建表单元素
     *
     * @param {string} url
     * @param {string=} charset
     * @return {jQuery}
     */
    function createForm(url, charset) {

        var obj = urlUtil.parse(url);

        var html = '<form action="' + obj.origin + obj.pathname + '" target="_blank"';
        if (charset) {
            html += ' accept-charset="' + charset + '" onsubmit="document.charset=\'' + charset + '\';"';
        }
        html += '>';

        $.each(
            urlUtil.parseQuery(obj.search),
            function (key, value) {
                html += '<input type="hidden" name="' + key + '" value="' + value + '" />';
            }
        );

        html += '</form>';

        return $(html);
    }

    /**
     * 通过表单方式打开一个新 Tab
     *
     * @param {string} url
     * @param {string=} charset 编码
     */
    exports.openForm = function (url, charset) {
        var form = createForm(url, charset);
        form.appendTo('body');
        form.submit();
    };

    /**
     * 通过链接方式打开一个新 Tab
     *
     * @param {string} url
     */
    exports.openLink = function (url) {

        var link = $('<a href="' + url + '" target="_blank"><b></b></a>');
        link.appendTo('body');

        // safari 和 IE11 不支持 click()
        try {
            link.find('b')[0].click();
        }
        catch (e) {
            exports.openForm(url);
        }
    };

});