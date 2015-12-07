/**
 * @file 使用 js 触发跳转
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var urlUtil = require('./url');

    /**
     * 创建表单元素
     *
     * @inner
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
     * 通过提交表单打开一个新 Tab
     *
     * @param {string} url
     * @param {string=} charset 编码
     */
    exports.byForm = function (url, charset) {
        var formElement = createForm(url, charset);
        formElement.appendTo('body').submit().remove();
    };

    /**
     * 通过点击链接打开一个新 Tab
     *
     * @param {string} url
     */
    exports.byLink = function (url) {

        var linkElement = $('<a href="' + url + '" target="_blank"></a>');
        linkElement.appendTo('body');

        // safari 和 IE11 不支持 click()
        try {
            linkElement[0].click();
        }
        catch (e) {
            exports.openForm(url);
        }

        linkElement.remove();

    };

});