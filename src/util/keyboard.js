/**
 * @file 键名和键值映射表
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 会触发字符改变的键
     *
     * @inner
     * @type {Object}
     */
    var charKey = {

        // 英文字母
        a: 65,
        b: 66,
        c: 67,
        d: 68,
        e: 69,
        f: 70,
        g: 71,
        h: 72,
        i: 73,
        j: 74,
        k: 75,
        l: 76,
        m: 77,
        n: 78,
        o: 79,
        p: 80,
        q: 81,
        r: 82,
        s: 83,
        t: 84,
        u: 85,
        v: 86,
        w: 87,
        x: 88,
        y: 89,
        z: 90,

        // 主键盘数字键
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,

        // 主键盘几个特殊字符
        '`': 192,
        '-': 173,
        '=': 61,
        '[': 219,
        ']': 221,
        '\\': 220,
        ';': 59,
        '\'': 222,
        ',': 188,
        '.': 190,
        '/': 191,

        // 小键盘（统一加前缀 $）
        '$0': 96,
        '$1': 97,
        '$2': 98,
        '$3': 99,
        '$4': 100,
        '$5': 101,
        '$6': 102,
        '$7': 103,
        '$8': 104,
        '$9': 105,
        '$.': 110,
        '$+': 107,
        '$-': 109,
        '$*': 106,
        '$/': 111,

        space: 32,
        tab: 9

    };

    /**
     * 删除键
     *
     * @inner
     * @type {Object}
     */
    var deleteKey = {
        backspace: 8,
        'delete': 46
    };

    /**
     * 功能键
     *
     * @inner
     * @type {Object}
     */
    var functionKey = {

        // F1 -> F12
        f1: 112,
        f2: 113,
        f3: 114,
        f4: 115,
        f5: 116,
        f6: 117,
        f7: 118,
        f8: 119,
        f9: 120,
        f10: 121,
        f11: 122,
        f12: 123,

        // 常用的控制键
        enter: 13,
        esc: 27,
        capslock: 20,

        insert: 45,
        home: 36,
        end: 35,
        pageup: 33,
        pagedown: 34,

        // 方向键
        left: 37,
        right: 39,
        up: 38,
        down: 40
    };

    /**
     * 常用的组合按键
     *
     * @inner
     * @type {Object}
     */
    var combinationKey = {
        shift: 16,
        ctrl: 17,
        meta: 91,
        alt: 18
    };

    /**
     * 反转 key 和 value
     *
     * @inner
     * @param {Object} obj
     * @return {Object}
     */
    function reverse(obj) {

        var result = { };

        $.each(obj, function (key, value) {
            result[ value ] = key;
        });

        return result;

    }

    $.extend(exports, charKey, deleteKey, functionKey, combinationKey);

    exports.charKey = charKey;
    exports.deleteKey = deleteKey;
    exports.functionKey = functionKey;
    exports.combinationKey = combinationKey;

    exports.isCharKey = function (keyCode) {
        return keyCode in reverse(charKey);
    };

    exports.isDeleteKey = function (keyCode) {
        return keyCode in reverse(deleteKey);
    };

    exports.isFunctionKey = function (keyCode) {
        return keyCode in reverse(functionKey);
    };

    exports.isCombinationKey = function (keyCode) {
        return keyCode in reverse(combinationKey);
    };

});