/**
 * @file 完善 <input type="text" />
 * @author zhujl
 */
define(function (require, exports) {

    'use strict';

    var Input = require('cobble/helper/Input');
    var Placeholder = require('cobble/helper/Placeholder');

    var lifeCycle = require('cobble/function/lifeCycle');

    /**
     * 文本输入框构造函数
     *
     * @param {Object} options
     * @property {jQuery} options.element <input type="text" /> 或 <textarea> 元素
     * @property {string} options.template
     * @property {string} options.placeholderSelector
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
                simple: false,
                placeholderAttr: 'placeholder',
                placeholderSelector: me.placeholderSelector,
                template: me.template
            });

            me.input = new Input({
                element: element,
                onChange: me.onChange,
                onKeyDown: me.onKeyDown,
                action: me.action,
                scope: me
            });
        },

        /**
         * 获取输入框的值
         *
         * @return {string}
         */
        getValue: function () {
            return this.element.val();
        },

        /**
         * 设置输入框的值
         *
         * @params {string} value
         */
        setValue: function (value) {

            var me = this;

            me.element.val(value);

            if (me.placeholder) {
                me.placeholder.refresh();
            }

            if ($.isFunction(me.onChange)) {
                me.onChange();
            }

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.input.dispose();

            me.element =
            me.input = null;

            if (me.placeholder) {
                me.placeholder.dispose();
                me.placeholder = null;
            }
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Text.defaultOptions = {

    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Text>}
     */
    Text.init = function (element, options) {

        var result = [ ];

        element.each(
            function () {
                result.push(
                    new Text(
                        $.extend(
                            {
                                element: $(this)
                            },
                            options
                        )
                    )
                );
            }
        );

        return result;
    };


    return Text;

});