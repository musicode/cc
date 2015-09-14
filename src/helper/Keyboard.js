/**
 * @file Keyboard
 * @author musicode
 */
define(function (require, exports, module) {

    /**
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
     *
     * ## 事件列表
     *
     * 1. keyDown
     * 2. keyUp
     * 3. beforeLongPress
     * 4. afterLongPress
     *
     */

    'use strict';

    var call = require('../function/call');
    var split = require('../function/split');
    var jquerify = require('../function/jquerify');
    var keyboard = require('../util/keyboard');

    /**
     * 处理键盘相关的操作
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 需要监听键盘事件的元素
     *
     * @property {Object} options.action 配置键盘事件，action 事件会在 onKeyDown 之前触发
     *                                   组合键使用 + 连接，如 'ctrl+c',
     *                                   支持键可看 Keyboard.map
     *                                   小键盘键统一加 $ 前缀，如 $+ 表示加号按键
     *
     * @property {Object=} options.context 事件处理函数和 action 的 this 指向
     *
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

    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_keyboard';

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
                    keyboard.combinationKey,
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

                        if (keyboard.combinationKey[name]) {
                            expressions.push(
                               (negative ? '!' : '')
                             + 'e.' + name + 'Key'
                            );
                        }
                        else if (keyboard[name]) {
                            expressions.push(
                                'e.keyCode===' + keyboard[name]
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

        var context = keyboard.context || keyboard;

        var counter = cache.counter || 0;

        if (cache.keyCode === keyCode && counter > 0) {
            if (counter === 1) {
                context.emit({
                    type: 'beforeLongPress',
                    keyCode: keyCode
                });
            }
            counter++;
        }
        else {
            cache.keyCode = keyCode;
            counter = 1;
        }

        cache.counter = counter;

        var args = [ e, counter > 1 ];

        $.each(
            cache.action,
            function (index, item) {
                if (item.test(e)) {
                    call(item.handler, context, args);
                }
            }
        );

        e.type = 'keyDown';

        context.emit(e);
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

        var context = keyboard.context || keyboard;

        cache.keyCode = null;

        if (cache.counter > 1) {
            context.emit({
                type: 'afterLongPress',
                keyCode: e.keyCode
            });
            cache.counter = 0;
        }

        e.type = 'keyUp';

        context.emit(e);
    }


    return Keyboard;

});