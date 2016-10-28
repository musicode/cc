/**
 * @file Input
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
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
     * 2. 长按是否触发 value property 变化
     *
     * 长按大多产生一串相同的字符串，这种属于无效输入
     */


    var toString = require('../function/toString');

    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');
    var keyboardUtil = require('../util/keyboard');

    var Keyboard = require('./Keyboard');


    /**
     * 封装一些输入功能，包括兼容最常用的 input 事件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素（<input> 或 <textarea>）
     * @property {string=} options.value 输入框的值
     *
     * @property {boolean=} options.silentOnLongPress 长按时是否保持沉默，不触发 property change 事件
     *
     * @property {Object=} options.shortcut 配置快捷键
     *                                      组合键只支持 shift/ctrl/alt/meta + 字母/数字
     *                                      举个例子：
     *                                      {
     *                                          'enter': function () {
     *                                              // submit
     *                                          },
     *                                          'up': function () {
     *                                              // up
     *                                          },
     *                                          'ctrl+c': function () {
     *                                              // copy
     *                                          },
     *                                          'ctrl+alt+a': function () {
     *                                              // 截图
     *                                          }
     *                                      }
     *
     */
    function Input(options) {
        lifeUtil.init(this, options);
    }

    var proto = Input.prototype;

    proto.type = 'Input';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        inputUtil.init(mainElement);




        var keyboard = new Keyboard({
            mainElement: mainElement,
            shortcut: me.option('shortcut')
        });

        var isLongPress;

        var updateValue = function (value) {

            if ($.type(value) !== 'string') {
                value = mainElement.val();
            }

            me.set('value', value);

        };


        keyboard.on('dispatch', function (e, data) {

            var event = e.originalEvent;

            switch (event.type) {

                case 'beforelongpress':
                    isLongPress = true;
                    break;

                case 'afterlongpress':
                    isLongPress = false;

                    var keyCode = data.keyCode;
                    if (keyboardUtil.isCharKey(keyCode)
                        || keyboardUtil.isDeleteKey()
                        || (mainElement.is('textarea') && keyCode === keyboardUtil.enter)
                    ) {
                        updateValue();
                    }

                    break;

            }

            me.dispatch(
                me.emit(event, data),
                data
            );

        });


        var namespace = me.namespace();

        mainElement
            .on('blur' + namespace, updateValue)
            .on(inputUtil.INPUT + namespace, function () {
                if (!isLongPress
                    || !me.option('silentOnLongPress')
                ) {
                    updateValue();
                }
            });


        me.inner({
            keyboard: keyboard,
            main: mainElement
        });

        updateValue(
            me.option('value')
        );

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        inputUtil.dispose(
            me.inner('main')
        );

        me.inner('keyboard').dispose();

    };

    lifeUtil.extend(proto);

    Input.propertyUpdater = {
        value: function (newValue, oldValue, changes) {
            var inputElement = this.inner('main');
            // 写值会导致光标发生变化，因此如果不是强制改值，不应该去改
            if (inputElement.val() !== newValue
                || changes.value.force
            ) {
                inputElement.val(newValue);
            }
        }
    };

    Input.propertyValidator = {
        value: function (value) {
            return toString(value);
        }
    };


    return Input;

});
