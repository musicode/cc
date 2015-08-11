/**
 * @file browser
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * UA 检测浏览器
     *
     * 返回结果如下：
     *
     * {
     *    name: 'ie',     // 判断多个浏览器时，便于用 name 去 switch
     *    ie: true,       // 判断某一个浏览器时，便于 if (ie) { ... }
     *    version: '8.0'  // 版本号，string 类型
     *    os: 'windows'   // 操作系统，可选值包括 windows mac linux
     * }
     *
     */

    'use strict';

    var chromeExpr = /(chrome)[ \/]([\w.]+)/;
    var firefoxExpr = /(firefox)[ \/]([\w.]+)/;
    var operaExpr = /(opera)(?:.*version)?[ \/]([\w.]+)/;

    var safariExpr = /version[ \/]([\w.]+) safari/;

    var oldIEExpr = /msie ([\w.]+)/;
    var newIEExpr = /trident[ \/]([\w.]+)/;

    /**
     * 获取 UA 的结构化信息
     *
     * @inner
     * @param {string} ua
     * @return {Object}
     */
    function parseUA(ua) {

        var match = parseIE(ua)
                 || chromeExpr.exec(ua)
                 || firefoxExpr.exec(ua)
                 || parseSafari(ua)
                 || operaExpr.exec(ua)
                 || [ ];

        var os;

        // android 要在 linux 前面尝试
        // 因为安卓机这两个字符串都有
        if (/Android/i.test(ua)) {
            os = 'android';
        }
        else if (/iPhone/i.test(ua) || /iPad/i.test(ua) || /iTouch/i.test(ua)) {
            os = 'ios';
        }
        else if (/Windows/i.test(ua)) {
            os = 'windows';
        }
        else if (/Macintosh/i.test(ua)) {
            os = 'mac';
        }
        else if (/Linux/i.test(ua)) {
            os = 'linux';
        }

        return {
            name: match[1] || '',
            version: match[2] || '0',
            os: os || ''
        };
    }

    /**
     * IE10- 所有版本都有的信息是 MSIE x.0
     *
     * IE8+  所有版本都有的信息是 Trident/x.0
     *
     *     IE11 => Trident/7.0
     *     IE10 => Trident/6.0
     *     IE9  => Trident/5.0
     *     IE8  => Trident/4.0
     *
     * 要特殊处理的是 IE11+ 和 IE7-
     *
     * @inner
     * @param {string} ua
     * @return {Array}
     */
    function parseIE(ua) {
        var version;

        var match = oldIEExpr.exec(ua);

        if (match) {
            version = match[1];
        }
        else {
            match = newIEExpr.exec(ua);
            if (match) {
                // 统一成 'x.0' 格式
                version = (parseInt(match[1], 10) + 4) + '.0';
            }
        }

        if (version) {
            return [ '', 'ie', version ];
        }
    }

    /**
     * safari 的 ua 格式是 Version/5.1.7 Safari/534.57.2
     *
     * 5.1.7 才是真实版本号...
     *
     * @inner
     * @param {string} ua
     * @return {Array}
     */
    function parseSafari(ua) {
        var match = safariExpr.exec(ua);
        if (match) {
            return [ '', 'safari', match[1] ];
        }
    }

    var result = parseUA(navigator.userAgent.toLowerCase());
    if (result.name) {
        result[result.name] = true;
    }

    return result;

});