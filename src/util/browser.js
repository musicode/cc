/**
 * @file browser
 * @author musicode
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
     * }
     *
     */

    'use strict';

    // http://www.fynas.com/ua/search
    var list = [
        [ 'alipay', /alipay/ ],
        [ 'wechat', /micromessenger/ ],
        [ 'baiduApp', /baiduboxapp/ ],
        [ 'baidu', /baidubrowser/ ],
        [ 'baidu', /bdbrowser/ ],
        [ 'uc', /ucbrowser/ ],
        [ 'uc', /ucweb/ ],
        [ 'qq', /qqbrowser/ ],
        [ 'qqApp', /qq/ ],
        [ 'ie', /iemobile[ \/]([\d_.]+)/ ],
        // IE10- 所有版本都有的信息是 MSIE x.0
        [ 'ie', /msie[ \/]([\d_.]+)/ ],
        [ 'ie', /trident[ \/]([\d_.]+)/, 4 ],
        [ 'chrome', /chrome[ \/]([\d_.]+)/ ],
        [ 'firefox', /firefox[ \/]([\d_.]+)/ ],
        [ 'opera', /opera(?:.*version)?[ \/]([\d_.]+)/ ],
        [ 'safari', /version[ \/]([\d_.]+) safari/ ],
        [ 'safari', /safari/ ]
    ];

    /**
     * 获取 UA 的结构化信息
     *
     * @inner
     * @param {string} ua
     * @return {Object}
     */
    function parseUA(ua) {

        var name;
        var version;

        $.each(
            list,
            function (index, item) {
                var match = item[1].exec(ua);
                if (match) {
                    name = item[0];
                    version = match[1];
                    if (version) {
                        version = version.replace(/_/g, '.');
                        if (item[2]) {
                            version = (parseInt(version, 10) + item[2]) + '.0';
                        }
                    }
                    return false;
                }
            }
        );

        return {
            name: name || '',
            version: version || ''
        };

    }

    var result = parseUA(navigator.userAgent.toLowerCase());
    if (result.name) {
        result[result.name] = true;
    }

    return result;

});