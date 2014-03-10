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
     *
     * 元素 attribute 使用 'data-placeholder'，不要设置 placeholder 属性
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

            // 确定运行时类型
            var type = getRuntimeType(this.nativeFirst);

            var cache = this.cache = {
                type: type
            };

            // 未使用原生特性
            if (type !== TYPE_NATIVE) {

                var element = this.element;
                var wrapper = $(Placeholder.template);

                element.replaceWith(wrapper);
                wrapper.append(element);

                var placeholderElement = wrapper.find('div');
                placeholderElement.css(getStyle(element));

                element.on('focus', this, onRefresh);
                element.on('blur', this, onRefresh);
                wrapper.on('click', this, onFocus);

                cache.wrapperElement = wrapper;
                cache.placeholderElement = placeholderElement;
            }

            this.setPlaceholder(this.getPlaceholder());
        },

        /**
         * 获得当前 placeholder
         *
         * @return {string}
         */
        getPlaceholder: function () {
            return this.element.data('placeholder') || '';
        },

        /**
         * 修改 placeholder
         *
         * @param {string} placeholder
         */
        setPlaceholder: function (placeholder) {
            placeholder = placeholder || '';

            var element = this.element;
            element.data('placeholder', placeholder);

            if (this.cache.type === TYPE_NATIVE) {
                element.prop('placeholder', placeholder);
            }
            else {
                apply(this);
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var cache = this.cache;

            if (cache.type !== TYPE_NATIVE) {
                var element = this.element;
                element.off('focus', onRefresh);
                element.off('blur', onRefresh);
                cache.wrapperElement.off('click', onFocus);
            }

            this.cache = null;
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
        nativeFirst: false
    };

    /**
     * 使用模拟实现时的包装模版，这个一般不用改，除非有特殊需求
     *
     * @static
     * @type {string}
     */
    Placeholder.template = '<div class="placeholder-wrapper">'
                         +    '<div></div>'
                         + '</div>';
    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery=} elements 可选，默认使用 $('[data-placeholder]')
     * @return {Array.<Placeholder>}
     */
    Placeholder.init = function (elements) {
        elements = elements || $('[data-placeholder]');

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
     * 浏览器完全不支持 placeholder
     *
     * @private
     * @type {number}
     */
    var TYPE_SIMULATE = 2;

    /**
     * 浏览器支持 placeholder，但是为了保证体验一致性，采用模拟实现
     *
     * @private
     * @type {number}
     */
    var TYPE_SIMULATE_NATIVE = 1;

    /**
     * 浏览器支持 placeholder，且当前运行时采用的是原生实现
     *
     * @private
     * @type {number}
     */
    var TYPE_NATIVE = 0;

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
     * 获得当前运行时类型
     *
     * @private
     * @param {boolean} nativeFirst 是否优先使用原生特性
     * @return {number}
     */
    function getRuntimeType(nativeFirst) {
        if (supportPlaceholder) {
            return nativeFirst ? TYPE_NATIVE : TYPE_SIMULATE_NATIVE;
        }
        return TYPE_SIMULATE;
    }

    /**
     * 获得和输入框元素一样的盒模型样式
     *
     * @private
     * @param {jQuery} inputElement
     * @return {Object}
     */
    function getStyle(inputElement) {
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
