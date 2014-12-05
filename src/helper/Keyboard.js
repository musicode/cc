/**
 * @file Keyboard
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * @description
     *
     * 处理键盘事件:
     *
     * 组合键
     *
     *    shift + x
     *    ctrl + x
     *    meta + x
     *    alt + x
     *
     *    或多个辅助键，如
     *
     *    shift + ctrl + alt + x
     */

    'use strict';

    var call = require('../function/call');
    var split = require('../function/split');
    var jquerify = require('../function/jquerify');

    /**
     * 处理键盘相关的操作
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 需要监听键盘事件的元素
     *
     * @property {boolean=} options.longPress 配置的 action 事件是否支持长按，默认为 false
     *                                        如配置了 enter，当用户长按回车时，是否连续触发
     *
     * @property {Object} options.action 配置键盘事件，action 事件会在 onKeyDown 之前触发
     *                                   组合键使用 + 连接，如 'ctrl+c',
     *                                   支持键可看 Keyboard.map
     *                                   小键盘键统一加 $ 前缀，如 $+ 表示加号按键
     *
     * @property {Function=} options.onKeyDown 按下键位触发
     * @argument {Event} options.onKeyDown.event
     *
     * @property {Function=} options.onKeyUp 松开键位触发
     * @argument {Event} options.onKeyUp.event
     *
     * @property {Function=} options.onBeforeLongPress 长按开始
     * @argument {Event} options.onBeforeLongPress.event
     *
     * @property {Function=} options.onAfterLongPress 长按结束
     * @argument {Event} options.onAfterLongPress.event
     *
     * @example
     *
     * new Keyboard({
     *    element: $('textarea'),
     *    action: {
     *        'ctrl+enter': function () {
     *            // send message
     *        },
     *        'space': function () {
     *            // space
     *        },
     *        'up': function () {
     *            // up
     *        },
     *        'ctrl+c': function () {
     *            // copy
     *        }
     *    }
     * });
     */
    function Keyboard(options) {
        $.extend(this, Keyboard.defaultOptions, options);
        this.init();
    }

    Keyboard.prototype = {

        constructor: Keyboard,

        type: 'Keyboard',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            me.cache = {
                counter: 0,
                action: parseAction(me.action || { })
            };

            me.element
            .on('keydown' + namespace, me, onKeyDown)
            .on('keyup' + namespace, me, onKeyUp);

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.element.off(namespace);

            me.element =
            me.cache = null;
        }
    };

    jquerify(Keyboard.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Keyboard.defaultOptions = {
        longPress: false
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_keyboard';

    /**
     * 键名 -> keyCode 映射表
     *
     * @inner
     * @type {Object}
     */
    var name2Code = {

        // F1 -> F12
        'f1': 112,
        'f2': 113,
        'f3': 114,
        'f4': 115,
        'f5': 116,
        'f6': 117,
        'f7': 118,
        'f8': 119,
        'f9': 120,
        'f10': 121,
        'f11': 122,
        'f12': 123,

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
     * 会触发字符改变的键
     *
     * @inner
     * @type {Object}
     */
    var char2Key = {

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
        backspace: 8,
        tab: 9,

        'delete': 46
    };

    /**
     * 常用的组合按键
     *
     * @inner
     * @type {Object}
     */
    var combinationKeys = {
        shift: 16,
        ctrl: 17,
        meta: 91,
        alt: 18
    };

    $.extend(name2Code, char2Key, combinationKeys);

    // 为了快速查找，转换一下 charKeys
    var key2Char = { };

    $.each(
        char2Key,
        function (key, value) {
            key2Char[value] = key;
        }
    );

    /**
     * 键值映射表
     *
     * @static
     * @type {Object}
     */
    Keyboard.map = name2Code;


    /**
     * 解析出按键组合
     *
     * @inner
     * @param {Object} action
     * @return {Array}
     */
    function parseAction(action) {

        var result = [ ];

        $.each(
            action,
            function (key, handler) {

                // 收集判断表达式
                var expressions = [ ];

                // ctrl+enter
                // enter
                // 如上两种按键，如果按下 ctrl+enter 两个事件都会触发
                // 为了避免这种情况，这里格式化为
                // ctrl+enter
                // !ctrl+enter

                // 加号需要特殊处理
                var plus = 'plus';
                var keys = split(
                                key.replace(/\$\+/g, plus),
                                '+'
                            );

                $.each(
                    combinationKeys,
                    function (name) {
                        if ($.inArray(name, keys) < 0) {
                            keys.push('!' + name);
                        }
                    }
                );

                $.each(
                    keys,
                    function (index, name) {

                        var negative = name.indexOf('!') === 0;
                        if (negative) {
                            name = name.substr(1);
                        }

                        if (name === plus) {
                            name = '$+';
                        }

                        if (combinationKeys[name]) {
                            expressions.push(
                               (negative ? '!' : '')
                             + 'e.' + name + 'Key'
                            );
                        }
                        else if (name2Code[name]) {
                            expressions.push(
                                'e.keyCode===' + name2Code[name]
                            );
                        }
                        else {
                            expressions.length = 0;
                            return false;
                        }
                    }
                );

                if (expressions.length > 0) {
                    result.push({
                        test: new Function('e', 'return ' + expressions.join('&')),
                        handler: handler
                    });
                }
            }
        );

        return result;
    }

    /**
     * keydown 事件处理器
     *
     * @inner
     * @param {Event} e
     */
    function onKeyDown(e) {

        var keyboard = e.data;
        var keyCode = e.keyCode;
        var cache = keyboard.cache;

        var counter = cache.counter;

        if (cache.keyCode === keyCode && counter > 0) {
            if (counter === 1) {

                keyboard.emit(
                    'beforeLongPress',
                    {
                        isCharKey: key2Char[keyCode] != null
                    }
                );

            }
            counter++;
        }
        else {
            cache.keyCode = keyCode;
            counter = 1;
        }

        cache.counter = counter;

        if (keyboard.longPress || counter === 1) {
            $.each(
                cache.action,
                function (index, item) {
                    if (item.test(e)) {
                        call(item.handler, keyboard, e);
                    }
                }
            );
        }

        e.type = 'keyDown';

        keyboard.emit(e);
    }

    /**
     * keyup 事件处理器
     *
     * @inner
     * @param {Event} e
     */
    function onKeyUp(e) {

        var keyboard = e.data;
        var cache = keyboard.cache;

        cache.keyCode = null;

        if (cache.counter > 1) {
            keyboard.emit('afterLongPress');
            cache.counter = 0;
        }

        e.type = 'keyUp';

        keyboard.emit(e);
    }


    return Keyboard;

});