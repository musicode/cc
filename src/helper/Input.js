/**
 * @file Input
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     *
     * 1. 兼容 input 事件
     *
     * IE9+ 和 其他标准浏览器都支持 input 事件
     * IE9- 支持 propertychange 事件，需判断 event.propertyName 是否为 'value'
     *
     * input 标准触发方式包括：输入、backspace、delete、剪切、粘贴、拖拽
     *
     * IE9 不支持 backspace、delete、剪切、拖拽 触发，不论 input 或 propertychange 事件（未解决，使用定时器太恶心了）
     * addEventListener 绑定的 propertychange 事件永远不会触发，所以用 jq 的话 IE9 必须绑定 input 事件
     *
     * IE8-的 propertychange 事件触发方式和 input 标准方式相同
     * IE8-改写 value 会触发 propertychange
     *
     * 为了避免和原生 input 事件重名，而初学者又较容易理解 change 事件
     * 因此统一向外广播 change 事件
     *
     * 2. 长按是否触发 change 事件
     *
     * 长按大多产生一串相同的字符串，这种属于无效输入
     */

    var lifeCycle = require('../function/lifeCycle');

    var input = require('../util/input');
    var keyboardUtil = require('../util/keyboard');

    var Keyboard = require('./Keyboard');

    /**
     * 封装一些输入功能，包括兼容最常用的 input 事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 输入框元素
     *
     * @property {boolean=} options.smart 是否能够聪明的在长按时不触发 change 事件，默认为 true
     *                                    因为长按产生的一般是无效输入
     *
     * @property {Object=} options.action 按下某键，发出某事件
     *                                    组合键只支持 shift/ctrl/alt/meta + 字母/数字
     *                                    举个例子：
     *                                    {
     *                                        'enter': function () {
     *                                            // submit
     *                                        },
     *                                        'up': function () {
     *                                            // up
     *                                        },
     *                                        'ctrl+c': function () {
     *                                            // copy
     *                                        },
     *                                        'ctrl+alt+a': function () {
     *                                            // 截图
     *                                        }
     *                                    }
     *
     */
    function Input(options) {
        lifeCycle.init(this, options);
    }

    var proto = Input.prototype;

    proto.type = 'Input';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        input.init(mainElement);

        var context = me.getContext();

        var updateValue = function () {
            me.set('value', mainElement.val());
        };

        updateValue();

        var keyboard = new Keyboard({
            watchElement: mainElement,
            action: me.option('action'),
            context: context
        });

        var isLongPressing;
        var longPressType = 'longpress';

        context
        .before(
            longPressType,
            function () {
                isLongPressing = true;
            }
        )
        .after(
            longPressType,
            function (e) {

                isLongPressing = false;

                if (keyboardUtil.isCharKey(e.keyCode) || keyboardUtil.isDeleteKey()) {
                    updateValue();
                }

            }
        );

        mainElement
        .on(
            'input' + me.namespace(),
            function () {
                if (!isLongPressing || !me.option('smart')) {
                    updateValue();
                }
            }
        );

        me.inner({
            keyboard: keyboard,
            main: mainElement
        });

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        var mainElement = me.inner('main');

        input.dispose(mainElement);
        mainElement.off(
            me.namespace()
        );

        me.inner('keyboard').dispose();

    };

    lifeCycle.extend(proto);

    Input.defaultOptions = {
        smart: true
    };

    Input.propertyUpdater = {

        value: function (value) {
            this.inner('main').val(value);
        }

    };


    return Input;

});
