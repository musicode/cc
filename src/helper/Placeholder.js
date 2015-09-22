/**
 * @file Placeholder
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

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

    var init = require('../function/init');
    var lifeCycle = require('../function/lifeCycle');
    var replaceWith = require('../function/replaceWith');
    var isActiveElement = require('../function/isActiveElement');

    var input = require('../util/input');
    var detection = require('../util/detection');

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options 配置对象
     * @property {jQuery} options.mainElement 输入框元素，如文本框、密码框、文本域
     * @property {string=} options.value 如果文字不写在元素属性上，也可以直接传值
     *
     * @property {boolean=} options.simple 是否使用简单模式
     * @property {boolean=} options.nativeFirst 是否原生优先
     *
     * @property {string=} options.simpleClass 简单模式使用的 class
     *
     * @property {string=} options.complexTemplate 复杂模式下，使用的包装模版
     * @property {string=} options.placeholderSelector 复杂模式下，查找占位符元素的选择器
     * @property {string=} options.inputSelector 复杂模式下，查找输入框元素的选择器
     * @property {Function=} options.showAnimate 复杂模式下，使用的显示动画
     * @property {Function=} options.hideAnimate 复杂模式下，使用的隐藏动画
     */
    function Placeholder(options) {
        lifeCycle.init(this, options);
    }

    var proto = Placeholder.prototype;

    proto.type = 'Placeholder';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var value = me.option('value');
        if (value == null) {
            value = mainElement.attr('placeholder') || '';
        }

        me.set('value', value);




        var proxy;

        if (detection.supportPlaceholder()
            && me.option('nativeFirst')
        ) {
            proxy = proxyMap.native;
        }
        else {
            proxy = me.option('simple')
                  ? proxyMap.simple
                  : proxyMap.complex;
        }

        me.inner({
            main: mainElement,
            proxy: proxy
        });


        executeProxy(me, 'init');

    };

    proto.show = function () {
        executeProxy(this, 'show');
    };

    proto.hide = function () {
        executeProxy(this, 'hide');
    };

    proto.refresh = function () {
        executeProxy(this, 'refresh');
    };

    proto.dispose = function () {

        var me = this;

        executeProxy(me, 'dispose');

        lifeCycle.dispose(me);

    };

    lifeCycle.extend(proto);

    Placeholder.defaultOptions = {
        simple: false,
        nativeFirst: true,
        simpleClass: 'placeholder-active',

        placeholderSelector: '.placeholder',
        inputSelector: ':text',
        complexTemplate: '<div class="placeholder-wrapper">'
                       +    '<input type="text" />'
                       +    '<div class="placeholder"></div>'
                       + '</div>',

        showAnimate: function (options) {
            options.placeholderElement.fadeIn(500);
        },
        hideAnimate: function (options) {
            options.placeholderElement.hide();
        }
    };

    Placeholder.propertyUpdater = {

        value: function (value) {
            this.refresh();
        }

    };

    Placeholder.propertyValidator = {

        value: function (value) {

            switch ($.type(value)) {

                case 'string':
                case 'number':
                    return value;

            }

            return '';

        }

    };

    /**
     * 执行代理方法
     *
     * @inner
     * @param {Object} instance
     * @param {string} method
     */
    function executeProxy(instance, method) {
        var proxy = instance.inner('proxy');
        if (proxy && proxy[ method ]) {
            proxy[ method ](instance);
        }
    }

    /**
     * 模式配置
     *
     * @inner
     * @type {Object}
     */
    var proxyMap = {

        native: {
            refresh: function (instance) {
                instance.inner('main').attr(
                    'placeholder',
                    instance.get('value')
                );
            }
        },

        simple: {
            init: function (instance) {

                var namespace = instance.namespace();
                var handler = $.proxy(instance.refresh, instance);

                instance
                .inner('main')
                .on('focus' + namespace, handler)
                .on('blur' + namespace, handler);

            },
            show: function (instance) {

                instance
                .inner('main')
                .addClass(instance.option('simpleClass'))
                .val(instance.get('value'));

            },
            hide: function (instance) {

                instance
                .inner('main')
                .removeClass(instance.option('simpleClass'))
                .val('');

            },
            refresh: function (instance) {

                var mainElement = instance.inner('main');
                mainElement.removeAttr('placeholder');

                if (isActiveElement(mainElement)) {
                    if (mainElement.hasClass(instance.option('simpleClass'))) {
                        instance.hide();
                        return;
                    }
                }
                else if (!$.trim(mainElement.val())) {
                    instance.show();
                    return;
                }

                mainElement.val(instance.get('value'));

            },
            dispose: function (instance) {

                instance.inner('main').off(
                    instance.namespace()
                );

            }
        },

        complex: {
            init: function (instance) {

                var inputElement = instance.option('mainElement');
                var mainElement = $(instance.option('complexTemplate'));

                replaceWith(inputElement, mainElement);
                replaceWith(
                    mainElement.find(
                        instance.option('inputSelector')
                    ),
                    inputElement
                );

                instance.inner({
                    main: mainElement,
                    input: inputElement,
                    placeholder: mainElement.find(
                        instance.option('placeholderSelector')
                    )
                });

                input.init(inputElement);

                var namespace = instance.namespace();
                var handler = $.proxy(instance.refresh, instance);

                inputElement
                    .on('focus' + namespace, handler)
                    .on('blur' + namespace, handler)
                    .on('input' + namespace, handler);

            },
            show: function (instance) {

                var placeholderElement = instance.inner('placeholder');

                placeholderElement.html(instance.get('value'));
                instance.execute(
                    'showAnimate',
                    {
                        placeholderElement: placeholderElement
                    }
                );

            },
            hide: function (instance) {

                instance.execute(
                    'hideAnimate',
                    {
                        placeholderElement: instance.inner('placeholder')
                    }
                );

            },
            refresh: function (instance) {

                var inputElement = instance.inner('input');
                inputElement.removeAttr('placeholder');

                if ($.trim(inputElement.val())) {
                    instance.hide();
                }
                else {
                    instance.show();
                }

            },
            dispose: function (instance) {

                var inputElement = instance.inner('input');

                input.dispose(inputElement);
                inputElement.off(
                    instance.namespace()
                );

            }
        }
    };


    return Placeholder;

});
