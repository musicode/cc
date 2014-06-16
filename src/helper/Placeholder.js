/**
 * @file Placeholder
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 各浏览器对 placeholder 的实现不一样：
     *
     * 1. IE9- 未实现
     * 2. Chrome, Firefox 等实现是聚焦时不隐藏 placeholder，输入时隐藏
     * 3. 某些奇葩浏览器貌似不能修改 placeholder 颜色
     *
     *
     * 需求一般有以下几种：
     *
     * 1. 为了提高性能，优先使用浏览器原生特性，低版本浏览器使用模拟实现
     * 2. 为了保证浏览器之间有相同的体验，最好使用模拟实现
     * 3. 如果希望修改 placeholder 颜色，必须使用模拟实现
     *
     * 不支持批量初始化，如果非要一次初始化整个页面的输入框，可使用 Placeholder.init();
     *
     * # 更新
     *
     * 为了满足简单需求，加入 简单模式 和 复杂模式
     *
     * 1. 简单模式：通过 simpleClass 和 value 来实现（取值需要判断 input.hasClass(simpleClass)）
     * 2. 复杂模式：通过包装输入框元素，用新的元素飘在输入框元素上来实现（取值不受影响）
     */

    'use strict';

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options 配置对象
     * @property {jQuery} options.element 输入框元素，如文本框、密码框、文本域
     * @property {string=} options.attr 元素上的 placeholder 属性，默认是 placeholder
     * @property {string=} options.value 如果文字不写在元素 options.attr 上，也可以直接传值
     * @property {boolean=} options.simple 是否使用简单模式
     * @property {string=} options.simpleClass 简单模式使用的 class
     * @property {string=} options.template 复杂模式使用的包装模版
     * @property {string=} options.placeholderSelector 从 template 里查找 placeholder 元素的选择器
     */
    function Placeholder(options) {
        $.extend(this, Placeholder.defaultOptions, options);
        this.init();
    }

    Placeholder.prototype = {

        constructor: Placeholder,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = this.element;

            var value = me.value
                     || element.attr(me.attr)
                     || '';

            // 避免原生 placeholder 影响效果
            if (supportPlaceholder && element.attr('placeholder')) {
                element.removeAttr('placeholder');
            }

            $.extend(
                me,
                modeConf[ me.simple ? 'simple' : 'complex' ]
            );

            me.init();
            me.set(value);

            // 必须放最后，jquery 某些 DOM 操作会解绑事件
            element.on(
                {
                    focus: onRefresh,
                    blur: onRefresh
                },
                me
            );
        },

        /**
         * 获得当前 placeholder
         *
         * @return {string}
         */
        get: function () {
            return this.value;
        },

        /**
         * 修改 placeholder
         *
         * @param {string} value
         */
        set: function (value) {
            this.value = value;
            this.refresh();
        },

        /**
         * 使 placeholder 生效
         */
        refresh: function () {

            var me = this;
            var result = me.test();

            if (typeof result === 'boolean') {
                if (result) {
                    me.show();
                }
                else {
                    me.hide();
                }
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            me.element
              .off({
                  focus: onRefresh,
                  blur: onRefresh
              });

            me.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Placeholder.defaultOptions = {
        attr: 'placeholder',
        simple: true,
        simpleClass: 'placeholder-active',
        placeholderSelector: 'div',
        template: '<div class="placeholder-wrapper">'
                +    '<div></div>'
                + '</div>'
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} elements 需要初始化的元素
     * @return {Array.<Placeholder>}
     */
    Placeholder.init = function (elements) {

        elements = elements
                || $('[' + Placeholder.defaultOptions.attr + ']');

        var result = [ ];

        elements.each(function () {
            result.push(
                new Placeholder({
                    element: $(this)
                })
            );
        });

        return result;
    };

    // 创建测试元素
    var input = $('<input type="text" />')[0];

    /**
     * 特性检测浏览器是否支持 placeholder 特性
     *
     * @inner
     * @type {boolean}
     */
    var supportPlaceholder = 'placeholder' in input;

    // 删除变量
    input = null;

    var modeConf = {
        simple: {
            init: $.noop,
            show: function () {
                this.element
                    .addClass(this.simpleClass)
                    .val(this.value);
            },
            hide: function () {
                this.element
                    .removeClass(this.simpleClass)
                    .val('');
            },
            test: function () {

                var element = this.element;

                // before focus 的状态如果正在显示 placeholder，隐藏 placeholder
                if (document.activeElement === element[0]) {
                    if (element.hasClass(this.simpleClass)) {
                        return false;
                    }
                }

                // before blur 的状态如果输入框没值，显示 placeholder
                else if (!element.val()) {
                    return true;
                }
            }
        },
        complex: {
            init: function () {

                var element = this.element;
                var wrapperElement = $(this.template);

                element.replaceWith(wrapperElement);
                wrapperElement.append(element);

                var placeholderElement = wrapperElement.find(this.placeholderSelector);
                placeholderElement.on('click', this, focusByClick);

                this.placeholderElement = placeholderElement;

            },
            show: function () {
                this.placeholderElement
                    .html(this.value)
                    .show();
            },
            hide: function () {
                this.placeholderElement
                    .hide();
            },
            test: function () {
                var element = this.element;
                return document.activeElement !== element[0]
                     && !element.val();
            },
            dispose: function () {

                this.placeholderElement.off('click', focusByClick);
                this.placeholderElement = null;

                delete this.dispose;

                // 调用原型方法
                this.dispose();
            }
        }
    };

    /**
     * 手动触发输入框的 focus 事件
     *
     * @inner
     * @param {Event} e
     */
    function focusByClick(e) {
        var placeholder = e.data;
        placeholder.element.focus();
        placeholder.refresh();
    }

    /**
     * focus / blur 切换时触发刷新
     *
     * @inner
     * @param {Event} e
     */
    function onRefresh(e) {
        e.data.refresh();
    }


    return Placeholder;

});
