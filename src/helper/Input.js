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
     * 3. chrome 下按方向键上会使光标跑到最左侧
     *
     * 4. 处理中文输入
     *
     * 中文输入状态下，输入框不应触发 change 事件
     *
     * keyCode 在中文输入下比较特殊，如下：
     *
     * keydown: 0   keyup: undefined(没触发)  【火狐】
     * keydown: 229
     *
     * 需要注意的是，空格和回车这些键会触发输入法文字写入输入框
     * 但这些按键不一定会触发 keyup
     *
     * 5. 键盘事件不一定是 keydown -> keyup 这种顺序
     *    火狐有时也可能连续触发多次 keyup
     */

    'use strict';

    var advice = require('../util/advice');

    /**
     * 使输入框元素具有 input 事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素
     * @property {boolean=} options.longPress 长按是否触发 change 事件，默认为 false
     *                                        因为长按产生的一般是无效输入
     *
     * @property {Function=} options.onChange 内容变化触发
     * @property {Funciton=} options.onEnter 按下回车触发
     * @property {Function=} options.onLongPressStart 长按开始
     * @property {Function=} options.onLongPressEnd 长按结束
     * @property {Object=} options.keyEvents 按下某键，发出某事件
     *                                       如 { '43': function () { // up } }
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

            var element = this.element;

            /**
             * 用来存放一些私有变量
             */
            var cache = this.cache = {
                val: element.val
            };

            // 拦截是否手动改值
            advice.before(
                element,
                'val',
                function (value) {
                    // 调用 setter 方法
                    if (value != null) {
                        cache.hasCallVal = true;
                    }
                }
            );

            // 绑定事件
            var events = {
                keydown: onKeyDown,
                keyup: onKeyUp
            };

            if (supportInputEvent) {
                events.input = onInput;
            }
            else {
                events.propertychange = onPropertyChange;
            }

            for (var type in events) {
                element.on(type, this, events[type]);
            }

            cache.events = events;
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var me = this;
            var cache = me.cache;
            var element = me.element;

            // 解绑事件
            var events = cache.events;
            for (var type in events) {
                element.off(type, events[type]);
            }

            // 还原 val 方法
            element.val = cache.val;

            // 垃圾回收
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
     * 特性检测是否支持 input 事件
     *
     * @inner
     * @return {boolean}
     */
    var supportInputEvent = (function () {
        var input = document.createElement('input');
        return 'oninput' in input;
    })();

    /**
     * 是否是中文输入
     *
     * @inner
     * @param {number} keyDownCode
     * @param {number=} keyUpCode
     * @return {boolean}
     */
    function isImsInput(keyDownCode, keyUpCode) {
        // 1. keydown: 0 keyup: undefined(没触发)  【火狐】
        // 2. keydown: 229 【其他浏览器】
        return (keyDownCode === 0 || typeof keyUpCode === 'undefined')
            || keyDownCode === 229;
    }

    /**
     * keyup 事件中，触发中文输入法写入到输入框的 keyCode
     *
     * @inner
     * @param {?number} keyCode
     * @return {boolean}
     */
    function isImsKey(keyCode) {
        return (keyCode >= 49 && keyCode <= 54)   // 主键盘数字键 1-6
                || keyCode === 32                 // 空格
                || keyCode === 13;                // 回车
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
                || keyCode === 46;                     // delete 键
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

        if (typeof keyDownCode === 'number') {

            // 判断中文输入法是否正在输入中
            if (isImsInput(keyDownCode, keyUpCode)) {

                // 以 chrome 举例
                // 触发中文输入法开启的 keyDownCode 是 229
                // 按下空格之类的键，keyDownCode 是真实键码，它会把内容写入文本框

                if (!isImsKey(keyUpCode)) { // 是否正在输入
                    return;
                }
            }
            // 不是字符键肯定也不会触发
            else if (!isCharKey(keyDownCode)) {
                return;
            }

            // 过滤长按
            if (!input.longPress // 是否长按不需要触发 change 事件
                && cache.longPressCouter > 1 // 是否正在长按
            ) {
                return;
            }
        }

        // 过滤手动改值
        if (cache.hasCallVal) {
            cache.hasCallVal = null;
            return;
        }

        var keyUpCodeType = typeof keyUpCode;

        // 这两个类型表示触发了 keyup 事件
        if (keyUpCodeType === 'undefined'
            || keyUpCodeType === 'number'
        ) {
            cache.keyDownCode = null;
        }

        if (typeof input.onChange === 'function') {
            input.onChange();
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
        var name = e.originalEvent.propertyName;
        if (name === 'value') {
            onInput(e);
        }
    }

    /**
     * 处理各种兼容问题
     *
     * @inner
     * @param {Event} e
     */
    function onKeyDown(e) {
        var input = e.data;
        var cache = input.cache;
        var keyCode = e.keyCode;

        // chrome 按上键会跳到最左侧
        if (keyCode === 38) {
            e.preventDefault();
        }

        // 长按字符键
        if (cache.keyDownCode === keyCode  // 前后两次按键相同
            && cache.longPressCouter > 0 // 长按的是字符键
        ) {
            if (cache.longPressCouter === 1
                && typeof input.onLongPressStart === 'function'
            ) {
                input.onLongPressStart();
            }

            cache.longPressCouter++;

            triggerChangeEvent(input, null);
        }
        else {
            cache.keyDownCode = keyCode;

            if (isCharKey(keyCode)) {
                cache.longPressCouter = 1;
            }

            if (cache.keyUpFaker) {
                clearTimeout(cache.keyUpFaker);
                cache.keyUpFaker = null;
            }

            // 避免被上次手动调用影响
            cache.hasCallVal = null;

            // 中文输入法开启时，有可能不会触发 keyup 事件
            if (isImsInput(keyCode)) {
                cache.keyUpFaker = setTimeout(
                    function () {
                        triggerChangeEvent(input);
                    },
                    500
                );
            }
        }

    }

    /**
     * keyup 事件处理器
     *
     * @inner
     * @param {Event} e
     */
    function onKeyUp(e) {
        var input = e.data;
        var cache = input.cache;
        var keyCode = e.keyCode;

        if (cache.longPressCouter > 1) {
            if (typeof input.onLongPressEnd === 'function') {
                input.onLongPressEnd();
            }
        }
        cache.longPressCouter = null;

        // 如果中文输入法开启后，依然触发了 keyup，就要干掉那个定时器
        if (cache.keyUpFaker) {
            clearTimeout(cache.keyUpFaker);
            cache.keyUpFaker = null;
        }

        triggerChangeEvent(input, keyCode);

        if (keyCode === 13
            && typeof input.onEnter === 'function'
        ) {
            input.onEnter();
        }

        // 广播自定义事件
        var keyEvents = input.keyEvents;
        if (keyEvents) {
            var handler = keyEvents[keyCode];
            if (typeof handler === 'function') {
                handler.call(input);
            }
        }
    }


    return Input;

});
