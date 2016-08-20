/**
 * @file Keyboard
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

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
     */

    var split = require('../function/split');

    var lifeUtil = require('../util/life');
    var keyboardUtil = require('../util/keyboard');

    /**
     * 处理键盘事件，提供快捷键支持
     *
     * 本组件没有主元素，只是监听事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 需要监听键盘事件的元素
     *
     * @property {Object=} options.shortcut 配置快捷键
     *                                      组合键使用 + 连接，如 'ctrl+c',
     *                                      支持键可看 util/keyboard exports
     *                                      小键盘键统一加 $ 前缀，如 '$+' 表示加号键
     *
     * @property {Function=} options.onkeydown
     * @property {Function=} options.onkeyup
     * @property {Function=} options.onbeforelongpress
     * @property {Function=} options.onafterlongpress
     *
     * @example
     *
     * new Keyboard({
     *    mainElement: $('textarea'),
     *    shortcut: {
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
        lifeUtil.init(this, options);
    }

    var proto = Keyboard.prototype;

    proto.type = 'Keyboard';

    proto.init = function () {

        var me = this;

        var shortcut = me.option('shortcut');
        if ($.isPlainObject(shortcut)) {
            shortcut = parseShortcut(shortcut);
        }

        var prevKeyCode;
        var pressCounter = 0;
        var longPressCounterDefine = 1;

        var isLongPress = function () {
            return pressCounter > longPressCounterDefine;
        };

        var namespace = me.namespace();

        me.option('mainElement')
        .on('keydown' + namespace, function (e) {

            var currentKeyCode = e.keyCode;


            if (prevKeyCode === currentKeyCode && pressCounter > 0) {
                if (pressCounter === longPressCounterDefine) {
                    me.emit(
                        'beforelongpress',
                        {
                            keyCode: currentKeyCode
                        },
                        true
                    );
                }
                pressCounter++;
            }
            else {
                prevKeyCode = currentKeyCode;
                pressCounter = 1;
            }





            me.dispatch(
                me.emit(e)
            );



            if (!shortcut) {
                return;
            }

            var data = {
                isLongPress: isLongPress()
            };
            var args = [ e, data ];

            $.each(
                shortcut,
                function (index, item) {
                    if (item.test(e)) {
                        me.execute(item.handler, args);
                    }
                }
            );

        })
        .on('keyup' + namespace, function (e) {

            if (isLongPress()) {
                me.emit(
                    'afterlongpress',
                    {
                        keyCode: e.keyCode
                    },
                    true
                );
            }

            pressCounter = 0;
            prevKeyCode = null;

            me.dispatch(
                me.emit(e)
            );

        });

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.option('mainElement').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);


    /**
     * 解析出按键组合
     *
     * @inner
     * @param {Object} shortcut
     * @return {Array}
     */
    function parseShortcut(shortcut) {

        var result = [ ];

        $.each(
            shortcut,
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
                var keys = split(key.replace(/\$\+/g, plus), '+');

                $.each(
                    keyboardUtil.combinationKey,
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

                        if (keyboardUtil.combinationKey[ name ]) {
                            expressions.push(
                               (negative ? '!' : '')
                             + 'e.' + name + 'Key'
                            );
                        }
                        else if (keyboardUtil[ name ]) {
                            expressions.push(
                                'e.keyCode===' + keyboardUtil[ name ]
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


    return Keyboard;

});