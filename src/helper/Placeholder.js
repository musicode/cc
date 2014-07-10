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
     * 为了满足简单需求，加入 简单模式 和 复杂模式
     *
     * 1. 简单模式：通过 className.simple 和 value 来实现（取值需要判断 input.hasClass(className.simple)）
     * 2. 复杂模式：通过包装输入框元素，用新的元素飘在输入框元素上来实现（取值不受影响）
     */

    'use strict';

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options 配置对象
     * @property {jQuery} options.element 输入框元素，如文本框、密码框、文本域
     * @property {string=} options.value 如果文字不写在元素属性上，也可以直接传值
     * @property {boolean=} options.simple 是否使用简单模式
     *
     * @property {Object=} options.attribute
     * @property {string=} options.attribute.placeholder 元素上的 placeholder 属性，默认是 placeholder
     *
     * @property {Object=} options.className
     * @property {string=} options.className.simple 简单模式使用的 class
     *
     * @property {Object=} options.selector
     * @property {string=} options.selector.placeholder 模式模式查找占位符元素的选择器
     *
     * @property {string=} options.template 复杂模式使用的包装模版
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

            // 在 removeAttr 之前取值
            var value = me.value
                     || element.attr(me.attribute.placeholder)
                     || '';

            // 避免原生 placeholder 影响效果
            if (supportPlaceholder && element.attr('placeholder')) {
                element.removeAttr('placeholder');
            }

            var cache = me.cache
                      = { };

            $.extend(
                cache,
                modeConf[ me.simple ? 'simple' : 'complex' ]
            );

            if (cache.init) {
                cache.init(me);
            }

            me.set(value);

            // 必须放最后，jquery 某些 DOM 操作会解绑事件
            var handler = $.proxy(me.refresh, me);
            element
                .on('focus' + namespace, me, handler)
                .on('blur' + namespace, me, handler);
        },

        /**
         * 获得当前 placeholder
         *
         * @return {string}
         */
        get: function () {
            return this.cache.hidden
                 ? ''
                 : this.value;
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
            var result = me.cache.test(me);

            if (result === true) {
                me.show();
            }
            else if (result === false) {
                me.hide();
            }
        },

        /**
         * 显示 placeholder
         */
        show: function () {

            var me = this;
            var cache = me.cache;

            cache.show(this);
            cache.hidden = false;
        },

        /**
         * 隐藏 placeholder
         */
        hide: function () {

            var me = this;
            var cache = me.cache;

            cache.hide(this);
            cache.hidden = true;
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;

            if (cache.dispose) {
                cache.dispose(me);
            }

            me.element.off(namespace);

            me.element =
            me.cache = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Placeholder.defaultOptions = {
        simple: true,
        attribute: {
            placeholder: 'placeholder'
        },
        className: {
            simple: 'placeholder-active'
        },
        selector: {
            placeholder: 'div'
        },
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
                || $('[' + Placeholder.defaultOptions.attribute.placeholder + ']');

        var result = [ ];

        elements.each(
            function () {
                result.push(
                    new Placeholder({
                        element: $(this)
                    })
                );
            }
        );

        return result;
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_placeholder';

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
            show: function (placeholder) {
                placeholder
                    .element
                    .addClass(placeholder.className.simple)
                    .val(placeholder.value);
            },
            hide: function (placeholder) {
                placeholder
                    .element
                    .removeClass(placeholder.className.simple)
                    .val('');
            },
            test: function (placeholder) {
                var element = placeholder.element;
                if (document.activeElement === element[0]) {
                    if (element.hasClass(placeholder.className.simple)) {
                        return false;
                    }
                }
                else if (!element.val()) {
                    return true;
                }
            }
        },
        complex: {
            init: function (placeholder) {

                var element = placeholder.element;
                var wrapper = $(placeholder.template);

                element.replaceWith(wrapper);
                wrapper.append(element);

                var fake = wrapper.find(placeholder.selector.placeholder);
                fake.on(
                    'click' + namespace,
                    function () {
                        element.focus();
                    }
                );

                placeholder.cache.element = fake;
            },
            show: function (placeholder) {
                placeholder.cache
                    .element
                    .html(placeholder.value)
                    .show();
            },
            hide: function (placeholder) {
                placeholder.cache
                    .element
                    .hide();
            },
            test: function (placeholder) {
                var element = placeholder.element[0];
                return !element.value
                    && document.activeElement !== element;
            },
            dispose: function (placeholder) {
                var cache = placeholder.cache;
                cache.element.off(namespace);
                cache.element = null;
            }
        }
    };


    return Placeholder;

});
