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
     *
     */

    var around = require('../function/around');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var keyboard = require('../util/keyboard');
    var input = require('../util/input');

    var Keyboard = require('./Keyboard');

    /**
     * 封装一些输入功能，包括兼容最常用的 input 事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素
     *
     * @property {boolean=} options.smart 是否能够聪明的在长按时不触发 change 事件，默认为 true
     *                                    因为长按产生的一般是无效输入
     *
     * @property {Function=} options.onKeyDown 按下键位触发
     * @argument {Event} options.onKeyDown.event
     *
     * @property {Function=} options.onKeyUp 松开键位触发
     * @argument {Event} options.onKeyUp.event
     *
     * @property {Function=} options.onChange 内容变化触发
     *
     * @property {Function=} options.onBeforeLongPress 长按开始
     * @argument {Event} options.onBeforeLongPress.event
     *
     * @property {Function=} options.onAfterLongPress 长按结束
     * @argument {Event} options.onAfterLongPress.event
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
        return lifeCycle.init(this, options);
    }

    var proto = Input.prototype;

    proto.type = 'Input';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var element = me.element;

        input.init(element);

        var context = me.context || me;

        me.keyboard = new Keyboard({
            element: element,
            action: me.action,
            context: context
        });

        var valueBeforeLongPress;

        context
        .on(
            'beforeLongPress' + namespace,
            function () {
                valueBeforeLongPress = element.val();
            }
        )
        .on(
            'afterLongPress' + namespace,
            function (e) {

                valueBeforeLongPress = null;

                if (valueBeforeLongPress !== element.val()
                    && (keyboard.isCharKey(e.keyCode) || keyboard.isDeleteKey())
                ) {
                    me.emit('change');
                }

            }
        );

        element
        .on(
            inputType,
            function () {
                if (valueBeforeLongPress == null || !me.smart) {
                    me.emit('change');
                }
            }
        );

    };

    /**
     * 自动变宽
     */
    proto.autoWidth = function () {

        var me = this;
        var element = me.element;

        element.on(
            inputType,
            function () {
                if (element.scrollLeft() > 0) {
                    element.width(
                        element.prop('scrollWidth')
                    );
                }
            }
        );

    };

    /**
     * 自动变高
     */
    proto.autoHeight = function () {

        var me = this;
        var element = me.element;

        // 自动变高必须设置 overflow-y: hidden
        if (element.css('overflow-y') !== 'hidden') {
            element.css('overflow-y', 'hidden');
        }

        var originHeight = element.height();

        var oldHeight = originHeight;
        var newHeight;

        var lineHeight = parseInt(element.css('font-size'), 10);
        var padding = element.innerHeight() - originHeight;

        element.on(
            inputType,
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

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        var element = me.element;
        input.dispose(element);
        element.off(namespace);

        me.keyboard.dispose();

        me.element =
        me.keyboard = null;

    };

    jquerify(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Input.defaultOptions = {
        smart: true
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_input';

    /**
     * input 事件
     *
     * @inner
     * @type {string}
     */
    var inputType = 'input' + namespace;


    return Input;

});
