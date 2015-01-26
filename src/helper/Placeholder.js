/**
 * @file Placeholder
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 80%
     *
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
     * 1. 简单模式：通过 simpleClass 和 value 来实现（取值需要判断 input.hasClass(simpleClass)）
     * 2. 复杂模式：通过包装输入框元素，用新的元素飘在输入框元素上来实现（取值不受影响）
     */

    'use strict';

    var init = require('../function/init');
    var input = require('../function/input');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options 配置对象
     * @property {jQuery} options.element 输入框元素，如文本框、密码框、文本域
     * @property {string=} options.value 如果文字不写在元素属性上，也可以直接传值
     * @property {boolean=} options.simple 是否使用简单模式
     * @property {boolean=} options.nativeFirst 是否原生优先
     *
     * @property {string=} options.placeholderSelector 复杂模式查找占位符元素的选择器
     * @property {string=} options.simpleClass 简单模式使用的 class
     *
     * @property {string=} options.template 复杂模式使用的包装模版
     */
    function Placeholder(options) {
        return lifeCycle.init(this, options);
    }

    Placeholder.prototype = {

        constructor: Placeholder,

        type: 'Placeholder',

        init: function () {

            var me = this;
            var element = me.element;

            var placeholder = element.attr('placeholder');

            // 在 removeAttr 之前取值
            if (me.value == null) {
                me.value = placeholder || '';
            }

            var conf;

            if (supportPlaceholder) {

                if (me.nativeFirst) {
                    conf = 'native';
                }
                // 避免原生 placeholder 影响效果
                else if (placeholder) {
                    element.removeAttr('placeholder');
                }
            }

            if (!conf) {
                conf = me.simple ? 'simple' : 'complex';
            }

            conf = modeConf[conf];

            $.extend(me, conf);

            if (conf.init) {
                me.init();
            }

            if (me.refresh) {
                me.refresh();
            }

        }

    };

    jquerify(Placeholder.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Placeholder.defaultOptions = {
        simple: false,
        nativeFirst: true,
        simpleClass: 'placeholder-active',
        placeholderSelector: '.placeholder',
        template: '<div class="placeholder-wrapper">'
                +    '<div class="placeholder"></div>'
                + '</div>'
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element 需要初始化的元素
     * @return {Array.<Placeholder>}
     */
    Placeholder.init = init(Placeholder);

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_placeholder';

    // 创建测试元素
    var element = $('<input type="text" />')[0];

    /**
     * 特性检测浏览器是否支持 placeholder 特性
     *
     * @inner
     * @type {boolean}
     */
    var supportPlaceholder = 'placeholder' in element;

    // 删除变量
    element = null;

    /**
     * 模式配置
     * @type
     */
    var modeConf = {

        native: {

            show: $.noop,
            hide: $.noop,
            refresh: $.noop,
            dispose: function () {

                var me = this;

                lifeCycle.dispose(me);

                me.element = null;
            }

        },

        simple: {
            init: function () {

                var me = this;
                var handler = $.proxy(me.refresh, me);

                me
                .element
                .on('focus' + namespace, handler)
                .on('blur' + namespace, handler);

            },
            show: function () {

                var me = this;

                me
                .element
                .addClass(me.simpleClass)
                .val(me.value);

            },
            hide: function () {

                var me = this;

                me
                .element
                .removeClass(me.simpleClass)
                .val('');

            },
            refresh: function () {

                var me = this;
                var element = me.element;

                if (document.activeElement === element[0]) {
                    if (element.hasClass(me.simpleClass)) {
                        me.hide();
                    }
                }
                else if (!element.val()) {
                    me.show();
                }

            },
            dispose: function () {

                var me = this;

                lifeCycle.dispose(me);

                me.element.off(namespace);
                me.element = null;

            }
        },

        complex: {
            init: function () {

                var me = this;
                var element = me.element;
                var wrapper = $(me.template);

                element.replaceWith(wrapper);
                wrapper.append(element);

                me.faker = wrapper.find(me.placeholderSelector);

                // 必须放最后，jquery 某些 DOM 操作会解绑事件
                var handler = $.proxy(me.refresh, me);

                input.init(element);

                element
                    .on('focus' + namespace, handler)
                    .on('blur' + namespace, handler)
                    .on('input' + namespace, handler);

            },
            show: function () {

                var me = this;

                me.faker.html(me.value).show();

            },
            hide: function () {
                this.faker.hide();
            },
            refresh: function () {

                var me = this;
                var value = me.element.val();

                if ($.trim(value)) {
                    me.hide();
                }
                else {
                    me.show();
                }
            },
            dispose: function () {

                var me = this;

                lifeCycle.dispose(me);

                var element = me.element;

                input.dispose(element);
                element.off(namespace);

                me.faker =
                me.element = null;

            }
        }
    };


    return Placeholder;

});
