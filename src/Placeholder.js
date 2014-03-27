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
     */

    'use strict';

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options 配置对象
     * @param {jQuery} options.element 输入框元素，如文本框、密码框、文本域
     * @param {boolean=} options.nativeFirst 是否优先使用浏览器原生的 placeholder，只针对低版本 IE 模拟实现，默认为 false
     * @param {string=} options.template 使用模拟实现时的包装模版
     * @param {string=} options.placeholderSelector 从 template 里查找 placeholder 元素的选择器
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

            var element = this.element;

            if (element.size() > 1) {
                throw new Error('[Placeholder] options.element.size() should equals 1.');
            }

            // 确定运行时类型
            var isNative = supportPlaceholder && this.nativeFirst;

            // 把值取出来先，避免 attribute 设置为 'placeholder' 各种蛋疼...
            var value = element.attr(this.attribute) || '';

            // 统一放到 cache 里
            var cache = this.cache = {
                value: value,
                isNative: isNative
            };

            // 未使用原生特性
            if (!isNative) {

                var element = this.element;
                var wrapperElement = $(this.template);

                element.replaceWith(wrapperElement);
                wrapperElement.append(element);

                var placeholderElement = wrapperElement.find(this.placeholderSelector);
                placeholderElement.css(getInputStyle(element));

                element.on('focus', this, onRefresh);
                element.on('blur', this, onRefresh);
                wrapperElement.on('click', this, onFocus);

                cache.wrapperElement = wrapperElement;
                cache.placeholderElement = placeholderElement;
            }

            this.setPlaceholder(value);
        },

        /**
         * 获得当前 placeholder
         *
         * @return {string}
         */
        getPlaceholder: function () {
            return this.cache.value;
        },

        /**
         * 修改 placeholder
         *
         * @param {string} placeholder
         */
        setPlaceholder: function (placeholder) {
            placeholder = placeholder || '';

            var cache = this.cache;
            cache.value = placeholder;

            var element = this.element;
            var attribute = this.attribute;

            if (cache.isNative) {
                if (attribute !== 'placeholder') {
                    element.attr('placeholder', placeholder);
                }
            }
            else {
                element.attr('placeholder', '');
                apply(this);
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var cache = this.cache;

            if (!cache.isNative) {
                var element = this.element;
                element.off('focus', onRefresh);
                element.off('blur', onRefresh);
                cache.wrapperElement.off('click', onFocus);
            }

            this.cache =
            this.element = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Placeholder.defaultOptions = {
        nativeFirst: false,
        attribute: 'placeholder',

        placeholderSelector: 'div',
        template: '<div class="placeholder-wrapper">'
                +    '<div></div>'
                + '</div>'
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} elements
     * @return {Array.<Placeholder>}
     */
    Placeholder.init = function (elements) {

        elements = elements || $('[' + Placeholder.defaultOptions.attribute + ']');

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

    /**
     * 特性检测浏览器是否支持 placeholder 特性
     *
     * @private
     * @type {boolean}
     */
    var supportPlaceholder = (function () {
        var input = document.createElement('input');
        input.type = 'text';
        return 'placeholder' in input;
    })();

    /**
     * 获得和输入框元素一样的盒模型样式
     *
     * @private
     * @param {jQuery} inputElement
     * @return {Object}
     */
    function getInputStyle(inputElement) {
        return {
            'border-top': inputElement.css('border-top-width') + ' solid transparent',
            'border-right': inputElement.css('border-right-width') + ' solid transparent',
            'border-bottom': inputElement.css('border-bottom-width') + ' solid transparent',
            'border-left': inputElement.css('border-left-width') + ' solid transparent',
            'padding-top': inputElement.css('padding-top'),
            'padding-right': inputElement.css('padding-right'),
            'padding-bottom': inputElement.css('padding-bottom'),
            'padding-left': inputElement.css('padding-left'),
            'width': inputElement.width(),
            'height': inputElement.height(),
            'line-height': inputElement.css('line-height')
        };
    }

    /**
     * 元素是否获得焦点
     *
     * @private
     * @param {HTMLElement} element
     * @return {boolean}
     */
    function hasFocus(element) {
        return element.ownerDocument.activeElement === element;
    }

    /**
     * 手动触发输入框的 focus 事件
     *
     * @private
     * @param {Event} e
     */
    function onFocus(e) {
        var placeholder = e.data;
        placeholder.element.focus();
        apply(placeholder);
    }

    /**
     * 刷新 placeholder 状态
     *
     * @private
     * @param {Event} e
     */
    function onRefresh(e) {
        apply(e.data);
    }

    /**
     * 使 placeholder 生效
     *
     * @private
     * @param {Placeholder} placeholder
     */
    function apply(placeholder) {
        var element = placeholder.element;
        var placeholderElement = placeholder.cache.placeholderElement;

        if (!hasFocus(element[0])
            && element.val() === ''
        ) {
            placeholderElement.html(placeholder.getPlaceholder())
                              .show();
        }
        else {
            placeholderElement.hide();
        }
    }


    return Placeholder;

});
