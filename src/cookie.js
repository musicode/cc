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
     * getCookie()
     * setCookie()
     * removeCookie()
     *
     */

     'use strict';

    /**
     * 解码
     *
     * @private
     * @param {string} str
     * @return {string}
     */
    function decode(str) {
        return decodeURIComponent(str);
    }

    /**
     * 编码
     *
     * @private
     * @param {string} str
     * @return {string}
     */
    function encode(str) {
        return encodeURIComponent(str);
    }

    /**
     * 把 cookie 字符串解析成对象
     *
     * @private
     * @param {string} cookieStr 格式为 key1=value1;key2=value2;
     * @return {Object}
     */
    function parse(cookieStr) {

        // 这一段都是抄来的，貌似写的很专业...

        if (cookieStr.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            cookieStr = cookieStr.slice(1, -1)
                                 .replace(/\\"/g, '"')
                                 .replace(/\\\\/g, '\\');
        }

        var result = { };

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            cookieStr = decode(cookieStr.replace(/\+/g, ' '));

            $.each(
                cookieStr.split(';'),
                function (index, part) {
                    var pair = part.split('=');
                    var key = $.trim(pair[0]);
                    var value = $.trim(pair[1]);

                    if (key) {
                        result[decode(key)] = value;
                    }
                }
            );
        }
        catch (e) { };

        return result;
    }

    /**
     * 把对象序列化成 cookie 字符串
     *
     * @private
     * @param {Object} cookieObj
     * @return {string}
     */
    function stringify(cookieObj) {
        var result = [ ];
        var value;

        for (var key in cookieObj) {
            if (cookieObj.hasOwnProperty(key)) {
                value = cookieObj[key];
                if (value !== '') {
                    result.push(
                        encode(key) + '='+ value
                    );
              }
            }
        }
        return result.join(';');
    }

    /**
     * 读取 cookie 的键值
     *
     * 如果不传 key，则返回完整的 cookie 键值对象
     *
     * @param {string=} key
     * @return {string|Object}
     */
    exports.getCookie = function (key) {
        var obj = parse(document.cookie);
        return typeof key === 'string' ? obj[key] : obj;
    };

    /**
     * 写入 cookie
     *
     * @param {string|Object} key 如果 key 是 string，则必须传 value
     *                            如果 key 是 Object，可批量写入
     * @param {*=} value
     * @param {number=} expires 相对当前时刻的过期时间，如一小时后，传入 1000 * 60 * 60
     */
    exports.setCookie = function (key, value, expires) {

        // 批量分支
        if ($.isPlainObject(key)) {
            expires = value;
            for (var k in key) {
                if (key.hasOwnProperty(k)) {
                    exports.setCookie(k, key[k], expires);
                }
            }
            return;
        }

        value = value || '';

        if (typeof value !== 'string'
            && typeof value !== 'number'
        ) {
            throw new Error('[cookie] cookie.setCookie require value\' type is string or number.');
        };

        var current = parse(document.cookie);
        current[key] = value;

        if (typeof expires === 'number') {
            var date = new Date(new Date() + expires);
            current.expires = date.toUTCString();
        }

        document.cookie = stringify(current);
    };

    /**
     * 删除某个 cookie
     *
     * @param {string} key
     */
    exports.removeCookie = function (key) {

        if (typeof exports.getCookie(key) === 'undefined') {
            return;
        }

        exports.setCookie(key, '', -1);
    };

});