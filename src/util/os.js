/**
 * @file os
 * @author musicode
 */
define(function (require, exports, module) {

    /**
     * UA 检测操作系统
     *
     * 返回结果如下：
     *
     * {
     *    name: 'mac',     // 判断多个浏览器时，便于用 name 去 switch
     *    mac: true,       // 判断某一个浏览器时，便于 if (mac) { ... }
     *    version: '8.0'   // 版本号，string 类型
     * }
     *
     */

    'use strict';

    /**
     * linux 发行版太多了，很多是没有版本信息的，只匹配 Linux 标识
     */

    // 优先判断移动版，因为移动版通常会带着 PC 的标识，反过来则不会
    var list = [
        [ 'iphone', /iphone os ([\d_.]+)/ ],
        [ 'ipad', /ipad; cpu os ([\d_.]+)/ ],
        [ 'itouch', /itouch; cpu os ([\d_.]+)/ ],
        [ 'android', /android ([\d_.]+)/ ],
        [ 'wp', /windows phone ([\d_.]+)/ ],
        [ 'windows', /windows nt ([\d_.]+)/ ],
        [ 'linux', /linux/ ],
        [ 'mac', /mac os x ([\d_.]+)/ ]
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