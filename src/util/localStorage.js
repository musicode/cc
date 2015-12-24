/**
 * @file localStorage 本地存储
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var support = require('../function/supportLocalStorage')();

    /**
     * 设置键值
     *
     * @param {string|Object} key 键或一个键值对象
     * @param {(string|number)=} value 键值，当 key 是 Object 时，可不传
     */
    function set(key, value) {

        if ($.isPlainObject(key)) {
            $.each(key, set);
        }
        else {
            try {
                localStorage[key] = value;
            }
            catch (e) { }
        }
    }

    /**
     * 获取值
     *
     * @param {string} key 键
     * @return {string?}
     */
    function get(key) {

        var result;

        try {
            result = localStorage[key];
        }
        catch (e) { }

        return result;

    }

    /**
     * 删除一个键值对
     *
     * @param {string} key 键
     */
    function remove(key) {

        try {
            localStorage.removeItem(key);
        }
        catch (e) { }

    }

    exports.support = support;

    if (support) {
        exports.set = set;
        exports.get = get;
        exports.remove = remove;
    }
    else {
        exports.set =
        exports.get =
        exports.remove = $.noop;
    }

});