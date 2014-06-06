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

    /**
     * 处理键盘相关的操作
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.element 需要监听键盘事件的元素
     * @param {Object} options.events 配置键盘事件
     *
     * @property {Function=} options.onKeyDown 按下键位触发
     * @property {Function=} options.onKeyUp 松开键位触发
     *
     * @property {Function=} options.onLongPressStart 长按开始
     * @property {Function=} options.onLongPressEnd 长按结束
     *
     * @property {Object=} options.scope 以上配置的函数的 this 指向，默认是 Keyboard 实例
     *
     * @example
     *
     * new Keyboard({
     *    element: $('textarea'),
     *    events: {
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

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            /**
             * 是否正在长按
             *
             * @type {boolean}
             */
            me.isLongPressing = false;

            if (!me.scope) {
                me.scope = me;
            }

            me.cache = { };

            // 转换成内部比较好处理的事件格式
            if (me.events) {
                me.cache.events = parseEvents(me.events);
            }

            var element = me.element;
            element.on('keydown', me, onKeyDown);
            element.on('keyup', me, onKeyUp);

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var element = me.element;

            element.off('keydown', onKeyDown);
            element.off('keyup', onKeyUp);

            me.element =
            me.scope =
            me.cache = null;

        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Keyboard.defaultOptions = {

    };


    /**
     * 键名 -> keyCode 映射表
     *
     * @inner
     * @type {Object}
     */
    var name2Code = {
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

        // 小键盘数字键
        '00': 96,
        '01': 97,
        '02': 98,
        '03': 99,
        '04': 100,
        '05': 101,
        '06': 102,
        '07': 103,
        '08': 104,
        '09': 105,

        // 常用的控制键
        enter: 13,
        space: 32,
        backspace: 8,
        esc: 27,

        home: 36,
        end: 35,

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
    var combinationKeys = {
        shift: 16,
        ctrl: 17,
        meta: 91,
        alt: 18
    };

    $.extend(name2Code, combinationKeys);

    /**
     * 解析出按键组合
     *
     * @inner
     * @param {Array} events
     * @return {Array}
     */
    function parseEvents(events) {

        var result = [ ];

        for (var key in events) {

            // 收集判断表达式
            var expressions = [ ];
            // 包含的组合键
            var keys = { };

            $.each(

                key.toLowerCase()
                   .replace(/\s/g, '')
                   .split('+'),

                function (index, name) {
                    if (combinationKeys[name]) {
                        keys[name] = true;
                    }
                    else if (name2Code[name]) {
                        expressions.push('e.keyCode===' + name2Code[name]);
                    }
                    else {
                        // 命中了不存在的 name
                        expressions = null;
                        return false;
                    }
                }
            );

            if (expressions) {
                for (var name in combinationKeys) {
                    expressions.push(
                        (keys[name] ? '' : '!') + 'e.' + name + 'Key'
                    );
                }

                result.push({
                    test: new Function('e', 'return ' + expressions.join('&')),
                    handler: events[key]
                });
            }
        }

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
        var cache = keyboard.cache;
        var keyCode = e.keyCode;
        var scope = keyboard.scope;

        if (keyboard.activeKeyCode === keyCode
            && cache.longPressCouter > 0
        ) {

            if (cache.longPressCouter === 1) {

                keyboard.isLongPressing = true;

                var onLongPressStart = keyboard.onLongPressStart;
                if (typeof onLongPressStart === 'function') {
                    onLongPressStart.call(scope, e);
                }
            }

            cache.longPressCouter++;
        }
        else {
            keyboard.activeKeyCode = keyCode;
            cache.longPressCouter = 1;

            // 调用按键接口
            var events = cache.events;
            if (events) {
                $.each(events, function (index, item) {
                    if (item.test(e)) {
                        item.handler.call(scope, e);
                    }
                });
            }
        }

        var onKeyDown = keyboard.onKeyDown;
        if (typeof onKeyDown === 'function') {
            return onKeyDown.call(scope, e);
        }
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
        var scope = keyboard.scope;

        if (cache.longPressCouter > 1) {

            keyboard.isLongPressing = false;

            var onLongPressEnd = keyboard.onLongPressEnd;
            if (typeof onLongPressEnd === 'function') {
                onLongPressEnd.call(scope, e);
            }

            delete cache.longPressCouter;
        }

        // 组合键可能连续两次触发 keyup
        // 如果已经 delete，再次 delete 会报错
        if (keyboard.activeKeyCode != null) {
            delete keyboard.activeKeyCode;
        }

        var onKeyUp = keyboard.onKeyUp;

        // 如果 events 某个 handler 调用了 dispose
        // 会导致 cache 变为 null，因此这里需要判断一下
        if (keyboard.cache && typeof onKeyUp === 'function') {
            return onKeyUp.call(scope, e);
        }
    }


    return Keyboard;

});