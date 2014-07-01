/**
 * @file Input
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 1. 兼容 input 事件
     *
     * IE9+ 和 其他标准浏览器都支持 input 事件
     * IE8- 支持 propertychange 事件，需判断 event.propertyName 是否为 'value'
     *
     * input 标准触发方式包括：输入、backspace、delete、ctrl+c、ctrl+v、右键剪切和粘贴
     *
     * IE9 的 input 事件  不支持 backspace、delete、ctrl+c、右键剪切 触发
     * IE8-的 propertychange 事件触发方式和 input 标准方式相同
     * IE8-改写 value 会触发 propertychange
     *
     * 为了避免和原生 input 事件重名，而初学者又较容易理解 change 事件
     * 因此统一向外广播 change 事件
     *
     * 2. 长按是否触发 change 事件
     *
     * 长按大多产生一串相同的字符串，这种属于无效输入
     *
     * 3. chrome 下 <input type="text" /> 按方向键上会使光标跑到最左侧
     *
     * 4. 处理中文输入
     *
     * 中文输入状态下，输入框不应触发 change 事件
     *
     * keyCode 在中文输入下比较特殊，如下：
     *
     * keydown: 0   [火狐]
     * keydown: 229 [其他]
     *
     * 需要注意的是，空格和回车这些键会触发输入法文字写入输入框
     *
     * 5. 组合键，如 ctrl+a 的触发顺序如下：
     *
     *    按下 ctrl
     *    按下 a
     *    松开 ctrl
     *    松开 a
     *
     *    因为不是对称的 按下-松开 顺序，所以本模块不处理组合键
     */

    'use strict';

    var advice = require('../util/advice');
    var Keyboard = require('./Keyboard');

    /**
     * 使输入框元素具有 input 事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素
     * @property {boolean=} options.longPress 长按是否触发 change 事件，默认为 false
     *                                        因为长按产生的一般是无效输入
     *
     * @property {Function=} options.onKeyDown 按下键位触发
     * @property {Function=} options.onKeyUp 松开键位触发
     * @property {Function=} options.onChange 内容变化触发
     * @argument {string} options.onChange.value 变化的值
     *
     * @property {Funciton=} options.onEnter 按下回车触发，类似的还支持以下事件
     *                                       onUp, onDown, onLeft, onRight, onSpace, onEsc
     *
     * @property {Function=} options.onLongPressStart 长按开始
     * @argument {Event} options.onLongPressStart.event 按下的键码
     * @property {Function=} options.onLongPressEnd 长按结束
     * @argument {Event} options.onLongPressStart.event 松开的键码
     *
     * @property {Object=} options.action 按下某键，发出某事件
     *                                       组合键只支持 shift/ctrl/alt/meta + 字母/数字
     *                                       举个例子：
     *                                       {
     *                                           'up': function () {
     *                                               // up
     *                                           },
     *                                           'ctrl+c': function () {
     *                                               // copy
     *                                           },
     *                                           'ctrl+alt+a': function () {
     *                                               // 截图
     *                                           }
     *                                       }
     *
     */
    function Input(options) {
        $.extend(this, Input.defaultOptions, options);
        this.init();
    }

    Input.prototype = {

        constructor: Input,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var events = me.action || { };

            $.each(
                getOnEvents(me),
                function (index, item) {
                    advice.before(
                        events,
                        item.type,
                        item.handler
                    );
                }
            );

            var element = me.element;

            // IE8- 改值会触发 propertychange
            advice.before(
                element,
                'val',
                function (value) {
                    if (typeof value !== 'undefined') {
                        me.cache.changeByCall = true;
                    }
                }
            );

            element.on(
                support + namespace,
                me,
                support === 'input' ? onInput : onPropertyChange
            );

            me.cache = {

                mode: element.prop('tagName').toLowerCase(),

                keyboard: new Keyboard({

                    element: element,
                    events: events,
                    onKeyDown: onKeyDown,
                    onKeyUp: onKeyUp,
                    onLongPressStart: me.onLongPressStart,
                    onLongPressEnd: me.onLongPressEnd,

                    // 把作用域改为 Input 实例
                    scope: me
                })
            };

        },

        /**
         * 自动变高
         */
        autoHeight: function () {

            var me = this;
            var element = me.element;

            // 自动变高必须设置 overflow-y: hidden
            if (element.css('overflow-y') !== 'hidden') {
                element.css('overflow-y', 'hidden');
            }

            // 要自动高度必须响应长按
            if (!me.longPress) {
                me.longPress = true;
            }

            var originHeight = element.height();

            var oldHeight = originHeight;
            var newHeight;

            var lineHeight = parseInt(element.css('font-size'), 10);
            var padding = element.innerHeight() - originHeight;

            advice.after(
                me,
                'onChange',
                function () {

                    // 把高度重置为原始值才能取到正确的 newHeight
                    if (oldHeight !== originHeight) {
                        oldHeight = originHeight;
                        element.height(originHeight);
                    }

                    // scrollHeight 包含上下 padding 和 height
                    newHeight = element.prop('scrollHeight') - padding;

                    if (Math.abs(newHeight - oldHeight) > lineHeight) {
                        element.height(newHeight);
                        oldHeight = newHeight;
                    }

                }
            );
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.element.off(namespace);

            me.cache.keyboard.dispose();

            me.action =
            me.cache =
            me.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Input.defaultOptions = {
        longPress: false
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_input';

    var input = $('<input type="text" />')[0];

    /**
     * 特性检测支持的 input 事件名称
     *
     * @inner
     * @type {string}
     */
    var support = 'oninput' in input ? 'input' : 'propertychange';

    input = null;

    /**
     * 获得所有的 onXXX 函数
     *
     * @inner
     * @param {Input} input
     * @return {Array}
     */
    function getOnEvents(input) {

        var result = [ ];

        for (var name in input) {
            if (input.hasOwnProperty(name)
                && name.indexOf('on') === 0
                && typeof input[name] === 'function'
            ) {
                result.push({
                    type: name.toLowerCase().substr(2),
                    handler: input[name]
                });
            }
        }

        return result;
    }

    /**
     * keyup 事件中，触发中文输入法写入到输入框的 keyCode
     *
     * @inner
     * @param {?number} keyCode
     * @return {boolean}
     */
    function isImsKey(keyCode) {
        return (keyCode >= 49 && keyCode <= 54)         // 主键盘数字键 1-6
                || (keyCode >= 186 && keyCode <= 192)   // 中文标点符号
                || (keyCode >= 219 && keyCode <= 222)   // 中文标点符号
                || keyCode === 32                       // 空格
                || keyCode === 13;                      // 回车
    }

    /**
     * keyCode 是否是会引起文本内容发生变化的键
     *
     * @inner
     * @param {number} keyCode
     * @return {boolean}
     */
    function isCharKey(keyCode) {
        return (keyCode >= 65 && keyCode <= 90)        // A-Z
                || (keyCode >= 48 && keyCode <= 57)    // 主键盘的数字键
                || (keyCode >= 96 && keyCode <= 107)   // 小键盘的数字键 * +
                || (keyCode >= 186 && keyCode <= 192)  // ;=,-./`
                || (keyCode >= 219 && keyCode <= 222)  // [\]'
                || keyCode === 109                     // 小键盘 -
                || keyCode === 111                     // 小键盘 /
                || keyCode === 32                      // 空格键
                || keyCode === 8                       // 退格键
                || keyCode === 46                      // delete 键
                || keyCode === 13;                     // 回车
    }


    /**
     * 触发 change 事件
     *
     * @inner
     * @param {Input} input
     * @param {number=} keyUpCode
     */
    function triggerChangeEvent(input, keyUpCode) {

        var cache = input.cache;
        var keyDownCode = cache.keyDownCode;

        if (keyDownCode || keyUpCode) {

            if (keyDownCode) {

                // 中文输入法开启时，keydown 的 keyCode 只可能是这两个值
                if (keyDownCode === 0 || keyDownCode === 229) {

                    // 以 chrome 举例
                    // 触发中文输入法开启的 keyDownCode 是 229
                    // 按下空格之类的键，keyDownCode 是真实键码，它会把内容写入文本框

                    if (!isImsKey(keyUpCode)) { // 是否正在输入
                        return;
                    }
                }

                // 过滤长按
                if (!input.longPress && cache.keyboard.isLongPressing) {
                    return;
                }
            }

            // 如果按下 ctrl+a，最后一次触发 keyup 事件是松开 ctrl 键
            // 这时 keyDownCode 已被清除，所以两个变量都要判断一下

            if (!isCharKey(keyUpCode || keyDownCode)) {
                return;
            }
        }

        var value = input.element.val();
        cache.value = value;

        if (typeof input.onChange === 'function') {
            input.onChange(value);
        }
    }

    /**
     * 处理标准浏览器 input 事件
     *
     * @inner
     * @param {Event} e
     */
    function onInput(e) {
        var input = e.data;
        // 过滤输入触发，这里只负责粘贴等方式触发
        // 不然会触发两次 onChange
        if (input.cache.keyDownCode == null) {
            triggerChangeEvent(input);
        }
    }

    /**
     * 处理 IE8- 的 propertychange 事件
     *
     * @inner
     * @param {Event} e
     */
    function onPropertyChange(e) {

        var input = e.data;
        var cache = input.cache;

        // 不是通过改值触发的才响应
        if (cache.changeByCall) {
            cache.changeByCall = false;
            return;
        }

        // propertychange 事件在 IE67 下可能出现死循环，原因不明
        // 简单的判断 propertyName 是否为 value 不够
        // 必须跟上次的值比较一下
        var name = e.originalEvent.propertyName;
        var value = input.element.val();

        if (name === 'value' && cache.value !== value) {
            onInput(e);
        }
    }

    /**
     * 某些按键不会触发 keyup 事件
     * 为了保证 onChange 的准确性，以回车代替
     *
     * @inner
     * @param {Input} input
     * @param {Event} e
     */
    function createKeyUpTimer(input, e) {
        input.cache.keyUpTimer = setTimeout(
            function () {
                if (input.cache) {
                    e.keyCode = 13;
                    onKeyUp.call(input, e);
                }
            },
            500
        );
    }

    /**
     * 移除 keyup 定时器
     *
     * @inner
     * @param {Input} input
     */
    function removeKeyUpTimer(input) {
        var cache = input.cache;
        if (cache.keyUpTimer) {
            clearTimeout(cache.keyUpTimer);
            cache.keyUpTimer = null;
        }
    }


    /**
     * 处理各种兼容问题
     *
     * @inner
     * @param {Event} e
     */
    function onKeyDown(e) {

        var input = this;
        var cache = input.cache;
        var keyCode = e.keyCode;

        if (cache.keyboard.isLongPressing) {
            triggerChangeEvent(input, null);
            removeKeyUpTimer(input);
        }
        else {
            cache.keyDownCode = keyCode;
            createKeyUpTimer(input, e);
        }

        // chrome 按上键会跳到最左侧
        if (keyCode === 38 && cache.mode === 'input') {
            e.preventDefault();
        }

        if (typeof input.onKeyDown === 'function') {
            return input.onKeyDown(e);
        }
    }

    /**
     * keyup 事件处理器
     *
     * @inner
     * @param {Event} e
     */
    function onKeyUp(e) {

        var input = this;

        removeKeyUpTimer(input);

        triggerChangeEvent(input, e.keyCode);
        input.cache.keyDownCode = null;

        if (typeof input.onKeyUp === 'function') {
            return input.onKeyUp(e);
        }
    }


    return Input;

});
