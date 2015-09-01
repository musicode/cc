/**
 * @file 文本输入框
 * @author musicode
 */
define(function (require, exports) {

    'use strict';

    var Input = require('../helper/Input');
    var Placeholder = require('../helper/Placeholder');

    var init = require('../function/init');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');


    /**
     * 文本输入框构造函数
     *
     * @param {Object} options
     * @property {jQuery} options.element <input type="text" /> 或 <textarea> 元素
     * @property {string} options.template
     *
     * @property {string} options.placeholderSelector
     * @property {boolean=} options.placeholderNativeFirst
     * @property {boolean=} options.placeholderSimple
     *
     * @property {Function=} options.onChange 文本值变化事件
     * @property {Function=} options.onKeyDown 鼠标按下事件
     * @property {Object=} options.action 键盘事件
     */
    function Text(options) {
        return lifeCycle.init(this, options);
    }

    Text.prototype = {

        constructor: Text,

        type: 'Text',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            me.placeholder = new Placeholder({
                element: element,
                simple: me.placeholderSimple,
                nativeFirst: me.placeholderNativeFirst,
                placeholderSelector: me.placeholderSelector,
                template: me.template
            });

            var action = me.action;
            if (action) {
                $.each(
                    action,
                    function (key, handler) {
                        action[key] = $.proxy(handler, me);
                    }
                );
            }

            me.input = new Input({
                element: element,
                onChange: function (e) {
                    me.emit(e);
                },
                onKeyDown: function (e) {
                    me.emit(e);
                },
                action: action
            });
        },

        /**
         * 获取输入框的值
         *
         * @return {string}
         */
        getValue: function () {
            return $.trim(
                this.element.val()
            );
        },

        /**
         * 设置输入框的值
         *
         * @params {string} value
         * @param {Object=} options 选项
         * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
         * @property {boolean=} options.silence 是否不触发 change 事件
         */
        setValue: function (value, options) {

            var me = this;

            options = options || { };

            if (options.force || me.getValue() !== value) {

                me.element.val(value);

                if (me.placeholder) {
                    me.placeholder.refresh();
                }

                if (!options.silence) {
                    me.emit('change');
                }

            }

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.input.dispose();
            me.placeholder.dispose();

            me.element =
            me.input =
            me.placeholder = null;

        }
    };

    jquerify(Text.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Text.defaultOptions = {
        simple: false,
        nativeFirst: true,
        placeholderSelector: '.placeholder',
        template: '<div class="placeholder-wrapper">'
                +    '<div class="placeholder"></div>'
                + '</div>'
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Text>}
     */
    Text.init = init(Text);


    return Text;

});