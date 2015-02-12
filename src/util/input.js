/**
 * @file 兼容的 input 事件处理
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var around = require('../function/around');

    var input = $('<input type="text" />')[0];

    /**
     * 特性检测是否支持 input 事件
     *
     * @inner
     * @type {boolean}
     */
    var supportInput = 'oninput' in input;

    input = null;

    var namespace = '.cobble_util_input';

    /**
     * =========================================
     * 处理中文输入法 - start
     * =========================================
     */

    /**
     * 存于元素 data 中的标识
     *
     * 如果为 true，表示正在使用中文输入法输入
     *
     * @inner
     * @type {string}
     */
    var imsDataKey = '__ims__key__';

    /**
     * 中文输入法是否开启，有两种判断方式：
     *
     * 1. keydown 的 keyCode 可能是 0 或 229
     * 2. keydown 的 keyCode 可能是正常值，但是不触发 keyup
     *
     * @inner
     * @type {Object}
     */
    var imsKeyCode = {
        0: 1,
        229: 1
    };

    /**
     * keyup 事件中，触发中文输入法写入到输入框的 keyCode
     *
     * @inner
     * @param {?number} keyCode
     * @return {boolean}
     */
    function isImsKey(keyCode) {
        return (keyCode >= 49 && keyCode <= 54)     // 主键盘数字键 1-6
            || (keyCode >= 186 && keyCode <= 192)   // 中文标点符号
            || (keyCode >= 219 && keyCode <= 222)   // 中文标点符号
            || keyCode === 32                       // 空格
            || keyCode === 13                       // 回车
            || keyCode === 8                        // backspace 删光也会触发
            || keyCode === 0;                       // 手机这个奇葩...
    }

    function processIms(element) {

        var isImsInput;
        var counter = 0;

        var oldValue = element.val();

        var timer;

        var startIms = function () {

            if (!isImsInput) {
                isImsInput = true;
                element.data(imsDataKey, isImsInput);
            }

        };

        var endIms = function () {

            if (isImsInput) {

                isImsInput = false;

                var value = element.val();

                element.data(imsDataKey, isImsInput);

                if (oldValue !== value) {
                    element.trigger('input');
                }

                oldValue = value;

            }

        };

        var startTimer = function () {

            if (counter === 1) {
                startIms();
            }

        };

        var endTimer = function () {

            if (timer) {
                clearTimeout(timer);
                timer = null;
            }

        };


        element.on(
            'keydown' + namespace,
            function (e) {

                counter++;

                // 这里不处理长按
                if (counter > 1) {
                    endTimer();
                    return;
                }

                if (imsKeyCode[e.keyCode]) {
                    startIms();
                }
                else {
                    timer = setTimeout(
                        startTimer,
                        300
                    );
                }

            }
        );

        element.on(
            'keyup' + namespace,
            function (e) {

                endTimer();

                if (isImsInput && isImsKey(e.keyCode)) {
                    endIms();
                }

                counter = 0;

            }
        );
    }

    /**
     * =========================================
     * 处理中文输入法 - end
     * =========================================
     */

    function bindInput(element) {

        processIms(element);

        element.on(
            'input' + namespace,
            function (e) {

                if (element.data(imsDataKey)) {
                    e.stopImmediatePropagation();
                }

            }
        );
    }

    /**
     * 初始化 IE8- 的 propertychange 事件监听
     *
     * @inner
     * @param {jQuery} element
     */
    function bindPropertyChange(element) {

        processIms(element);

        // propertychange 事件在 IE67 下可能出现死循环，原因不明
        // 简单的判断 propertyName 是否为 value 不够
        // 必须跟上次的值比较一下
        var oldValue = element.val();

        // element.val('xxx') 在 IE 下会触发 propertychange
        // 这和标准浏览器的行为不一致
        // 这个并不能完美解决问题
        // 比如使用 element[0].value = 'xx' 无法检测到
        var changeByVal = false;

        element.on(
            'propertychange' + namespace,
            function (e) {
                if (changeByVal) {
                    changeByVal = false;
                    return;
                }
                if (e.originalEvent.propertyName === 'value') {
                    var newValue = element.val();
                    if (newValue !== oldValue && !element.data(imsDataKey)) {
                        element.trigger('input');
                        oldValue = newValue;
                    }
                }
            }
        );

        around(
            element,
            'val',
            function () {
                if (arguments.length !== 0) {
                    changeByVal = true;
                }
            }
        );
    }

    exports.init = supportInput
                 ? bindInput
                 : bindPropertyChange;

    exports.dispose = function (element) {
        element.off(namespace);
        element.removeData(imsDataKey);
    };


});