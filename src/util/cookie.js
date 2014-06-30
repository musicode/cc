/**
 * @file cookie
 * @author zhujl
 */
define (function (require, exports, module) {

    /**
     * 操作 cookie
     *
     * 对外暴露三个方法:
     *
     * get()
     * set()
     * remove()
     *
     * 使用 cookie 必须了解的知识：
     *
     * 一枚 cookie 有 4 个不同的属性
     *
     *    key value domain path expires secure
     *
     *    domain: 浏览器只向指定域的服务器发送 cookie，默认是产生 Set-Cookie 响应的服务器的主机名
     *    path: 为特定页面指定 cookie，默认是产生 Set-Cookie 响应的 URL 的路径
     *    expires: 日期格式为（Weekday, DD-MON-YY HH:MM:SS GMT）唯一合法的时区是 GMT，默认是会话结束时过期
     *    secure: 使用 ssl 安全连接时才会发送 cookie
     *
     * 有点类似命名空间的意思
     *
     */

    'use strict';

    /**
     * 一天的毫秒数
     *
     * @inner
     * @const
     * @type {number}
     */
    var DAY_TIME = 24 * 60 * 60 * 1000;

    /**
     * cookie 的默认属性
     *
     * @type {Object}
     */
    var defaultOptions = {
        path: '/'
    };

    /**
     * 把 cookie 字符串解析成对象
     *
     * @inner
     * @param {string} cookieStr 格式为 key1=value1;key2=value2;
     * @return {Object}
     */
    function parse(cookieStr) {

        if (cookieStr.indexOf('"') === 0) {
            // 如果 cookie 按照 RFC2068 规范进行了转义，要转成原始格式
            cookieStr = cookieStr.slice(1, -1)
                                 .replace(/\\"/g, '"')
                                 .replace(/\\\\/g, '\\');
        }

        var result = { };

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            cookieStr = decodeURIComponent(cookieStr.replace(/\+/g, ' '));

            $.each(
                cookieStr.split(';'),
                function (index, part) {
                    var pair = part.split('=');
                    var key = $.trim(pair[0]);
                    var value = $.trim(pair[1]);

                    if (key) {
                        result[key] = value;
                    }
                }
            );
        }
        catch (e) { }

        return result;
    }

    /**
     * 设置一枚 cookie
     *
     * @param {string} key
     * @param {string} value
     * @param {Object} options
     */
    function setCookie(key, value, options) {

        // 把相对天数转成日期的绝对值
        if (typeof options.expires === 'number') {
            var days = options.expires;
            var date = options.expires = new Date();
            date.setTime(date.getTime() + days * DAY_TIME);
        }

        document.cookie = [
            encodeURIComponent(key), '=', value,
            options.expires ? ';expires=' + options.expires.toUTCString() : '',
            options.path ? ';path=' + options.path : '',
            options.domain ? ';domain=' + options.domain : '',
            options.secure ? ';secure' : ''
        ].join('');
    }

    /**
     * 读取 cookie 的键值
     *
     * 如果不传 key，则返回完整的 cookie 键值对象
     *
     * @param {string=} key
     * @return {string|Object|undefined}
     */
    exports.get = function (key) {
        var obj = parse(document.cookie);
        return typeof key === 'string' ? obj[key] : obj;
    };

    /**
     * 写入 cookie
     *
     * @param {string|Object} key 如果 key 是 string，则必须传 value
     *                            如果 key 是 Object，可批量写入
     * @param {*=} value
     * @param {Object=} options
     * @param {number=} options.expires 过期天数，如 1 表示 1 天后过期
     * @param {string=} options.path cookie 的路径
     * @param {string=} options.domain 域名
     * @param {boolean=} options.secure 是否加密传输
     */
    exports.set = function (key, value, options) {

        var isMulti = $.isPlainObject(key);

        options = $.extend({ }, defaultOptions, isMulti ? value : options);

        if (isMulti) {
            for (var k in key) {
                if (key.hasOwnProperty(k)) {
                    setCookie(k, key[k], options);
                }
            }
        }
        else {
            setCookie(key, value, options);
        }
    };

    /**
     * 删除某个 cookie
     *
     * @param {string} key
     * @param {Object=} options
     * @param {number=} options.expires 过期天数，如 1 表示 1 天后过期
     * @param {string=} options.path cookie 的路径
     * @param {string=} options.domain 域名
     * @param {boolean=} options.secure 是否加密传输
     */
    exports.remove = function (key, options) {

        if (typeof exports.get(key) === 'undefined') {
            return;
        }

        options = $.extend({ }, options, { expires: -1 });
        setCookie(key, '', options);
    };

    /**
     * 默认属性，暴露给外部修改
     *
     * @type {Object}
     */
    exports.defaultOptions = defaultOptions;

});