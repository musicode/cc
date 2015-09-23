/**
 * @file Placeholder
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
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
     * 为了满足简单需求，加入 简单模式 和 复杂模式
     *
     * 1. 简单模式：通过 simpleClass 和 value 来实现（取值需要判断 input.hasClass(simpleClass)）
     * 2. 复杂模式：通过包装输入框元素，用新的元素飘在输入框元素上来实现（取值不受影响）
     */

    var isHidden = require('../function/isHidden');
    var replaceWith = require('../function/replaceWith');
    var isActiveElement = require('../function/isActiveElement');

    var input = require('../util/input');
    var detection = require('../util/detection');
    var lifeCycle = require('../util/lifeCycle');

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options 配置对象
     * @property {jQuery} options.mainElement 输入框元素，如文本框、密码框、文本域
     * @property {string=} options.value 如果文字不写在元素属性上，也可以直接传值
     *
     * @property {boolean=} options.nativeFirst 是否原生优先
     *
     * @property {string=} options.mainTemplate 模拟实现时，使用的模版
     * @property {string=} options.placeholderSelector 模拟实现时，查找占位符元素的选择器
     * @property {string=} options.inputSelector 模拟实现时，查找输入框元素的选择器
     * @property {Function=} options.showAnimate 模拟实现时，使用的显示动画
     * @property {Function=} options.hideAnimate 模拟实现时，使用的隐藏动画
     */
    function Placeholder(options) {
        lifeCycle.init(this, options);
    }

    var proto = Placeholder.prototype;

    proto.type = 'Placeholder';

    proto.init = function () {

        var me = this;

        var proxy;

        if (detection.supportPlaceholder()
            && me.option('nativeFirst')
        ) {
            proxy = nativeProxy
        }
        else {
            proxy = fakeProxy;
        }


        me.inner({
            input: me.option('mainElement'),
            proxy: proxy
        });

        executeProxyMethod(me, 'init');

        me.set({
            hidden: me.option('hidden'),
            value: me.option('value')
        });

    };

    proto.show = function () {
        this.set('hidden', false);
    };

    proto._show = function () {
        if (!this.get('hidden')) {
            return false;
        }
    };

    proto.hide = function () {
        this.set('hidden', true);
    };

    proto._hide = function () {
        if (this.get('hidden')) {
            return false;
        }
    };

    proto.render = function () {
        executeProxyMethod(this, 'render');
    };

    proto.dispose = function () {

        var me = this;

        executeProxyMethod(me, 'dispose');

        lifeCycle.dispose(me);

    };

    lifeCycle.extend(proto);

    Placeholder.defaultOptions = {

        nativeFirst: true,

        placeholderSelector: '.placeholder',
        inputSelector: ':text',

        showAnimate: function (options) {
            options.placeholderElement.fadeIn(500);
        },
        hideAnimate: function (options) {
            options.placeholderElement.hide();
        }
    };

    Placeholder.propertyUpdater = { };

    Placeholder.propertyUpdater.value =
    Placeholder.propertyUpdater.hidden = function (newValue, oldValue, changes) {

        var me = this;

        var valueChange = changes.value;
        var hiddenChange = changes.hidden;

        if (valueChange) {
            me.render(me);
        }
        else if (hiddenChange) {
            executeProxyMethod(
                me,
                hiddenChange.newValue ? 'hide' : 'show'
            );
        }

        return false;

    };

    Placeholder.propertyValidator = {

        value: function (value) {
            switch ($.type(value)) {
                case 'string':
                case 'number':
                    return value;
            }
            return this.inner('input').attr('placeholder') || '';
        },

        hidden: function (hidden) {
            if ($.type(hidden) !== 'boolean') {
                var isHidden = getProxyMethod(this, 'isHidden');
                if (isHidden) {
                    hidden = isHidden(this);
                }
            }
            return hidden;
        }

    };


    function executeProxyMethod(instance, method) {
        var fn = getProxyMethod(instance, method);
        if (fn) {
            fn(instance);
        }
    }

    function getProxyMethod(instance, method) {
        var proxy = instance.inner('proxy');
        return proxy && proxy[ method ];
    }

    var nativeProxy = {
        render: function (instance) {
            instance.inner('input').attr(
                'placeholder',
                instance.get('value')
            );
        }
    };

    var fakeProxy = {
        init: function (instance) {

            var mainElement = instance.option('mainElement');
            var inputSelector = instance.option('inputSelector');
            var inputElement = mainElement.find(inputSelector);

            if (inputElement.length !== 1) {

                var tempElement = $(instance.option('complexTemplate'));
                replaceWith(mainElement, tempElement);

                mainElement = tempElement;
                inputElement = mainElement.find(inputSelector);

            }


            instance.inner({
                main: mainElement,
                input: inputElement,
                placeholder: mainElement.find(
                    instance.option('placeholderSelector')
                )
            });

            input.init(inputElement);

            var namespace = instance.namespace();

            inputElement
                .on('input' + namespace, function () {
                    var hidden = $.trim(inputElement.val()).length > 0;
                    if (hidden !== instance.get('hidden')) {
                        if (hidden) {
                            instance.hide();
                        }
                        else {
                            instance.show();
                        }
                    }
                });

        },
        show: function (instance) {

            var placeholderElement = instance.inner('placeholder');

            placeholderElement.html(
                instance.get('value')
            );

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
        render: function (instance) {

            if (instance.get('hidden')) {
                return;
            }

            var inputElement = instance.inner('input');
            inputElement.removeAttr('placeholder');

            instance.inner('placeholder').html(
                instance.get('value')
            );

        },
        dispose: function (instance) {

            var inputElement = instance.inner('input');

            input.dispose(inputElement);
            inputElement.off(
                instance.namespace()
            );

        },

        isHidden: function (instance) {
            return isHidden(
                instance.inner('placeholder')
            );
        }
    };


    return Placeholder;

});
