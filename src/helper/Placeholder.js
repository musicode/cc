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
     * 如果需要支持低端浏览器，需要在模板或 mainTemplate 保证 DOM 结构
     * 并指定 labelSelector 和 inputSelector
     */

    var isHidden = require('../function/isHidden');
    var toString = require('../function/toString');
    var supportPlaceholder = require('../function/supportPlaceholder')();

    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');

    /**
     * 使输入框元素具有 placeholder 功能
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素，如文本框、密码框、文本域
     * @property {string=} options.mainTemplate 非模拟实现，此选项用处不大
     *                                          模拟实现时，如果 mainElement 结构不完整，可传入模版完善结构
     *
     * @property {string=} options.value 如果文字没写在元素属性（placeholder attribute）上，也可以传值
     *
     * @property {boolean=} options.nativeFirst 是否原生优先
     *                                          支持 placeholder 的浏览器，不管其表现如何，优先使用原生
     *
     * @property {boolean} options.autoTrim 模拟实现时，判断为空是否自动 trim
     * @property {string} options.labelSelector 模拟实现时，查找显示占位文本元素的选择器
     * @property {string} options.inputSelector 模拟实现时，查找输入框元素的选择器
     * @property {Function} options.showAnimation 模拟实现时，使用的显示动画
     * @property {Function} options.hideAnimation 模拟实现时，使用的隐藏动画
     */
    function Placeholder(options) {
        lifeUtil.init(this, options);
    }

    var proto = Placeholder.prototype;

    proto.type = 'Placeholder';

    proto.init = function () {

        var me = this;

        me.initStruct();

        me.inner({
            proxy: me.option('nativeFirst') && supportPlaceholder
                ? nativeProxy
                : fakeProxy
        });

        executeProxyMethod(me, 'init');

        me.set({
            value: me.option('value')
        });

        me.state({
            hidden: me.option('hidden')
        });

    };

    proto.show = function () {
        this.state('hidden', false);
    };

    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };

    proto.hide = function () {
        this.state('hidden', true);
    };

    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };

    proto.render = function () {
        executeProxyMethod(this, 'render');
    };

    proto.dispose = function () {
        executeProxyMethod(this, 'dispose');
        lifeUtil.dispose(this);
    };

    lifeUtil.extend(proto);

    Placeholder.propertyUpdater = {
        value: function () {
            this.render();
        }
    };

    Placeholder.propertyValidator = {
        value: function (value) {
            value = toString(value, null);
            if (value == null) {
                value = this.inner('input').attr('placeholder');
            }
            return value || '';
        }
    };

    Placeholder.stateUpdater = {
        hidden: function (hidden) {
            executeProxyMethod(
                this,
                hidden ? 'hide' : 'show'
            );
        }
    };

    Placeholder.stateValidator = {
        hidden: function (hidden) {
            if ($.type(hidden) !== 'boolean') {
                hidden = executeProxyMethod(this, 'isHidden');
            }
            return hidden;
        }
    };







    function executeProxyMethod(instance, method) {
        var proxy = instance.inner('proxy');
        var fn = proxy[ method ];
        if (fn) {
            return fn(instance);
        }
    }

    var nativeProxy = {
        init: function (instance) {

            var mainElement = instance.option('mainElement');
            var inputSelector = instance.option('inputSelector');
            var tagName = mainElement.prop('tagName');

            instance.inner({
                main: mainElement,
                input: tagName === 'INPUT' || tagName === 'TEXTAREA'
                     ? mainElement
                     : mainElement.find(inputSelector)
            });

        },
        render: function (instance) {

            instance.inner('input').attr(
                'placeholder',
                instance.get('value')
            );

        },
        isHidden: function (instance) {

            return instance.inner('input').val().length > 0;

        }
    };

    var fakeProxy = {
        init: function (instance) {

            var mainElement = instance.option('mainElement');
            var inputSelector = instance.option('inputSelector');
            var labelSelector = instance.option('labelSelector');

            var inputElement = mainElement.find(inputSelector);
            var labelElement = mainElement.find(labelSelector);
            inputElement.removeAttr('placeholder');

            instance.inner({
                main: mainElement,
                input: inputElement,
                label: labelElement
            });

            inputUtil.init(inputElement);

            var render = $.proxy(instance.render, instance);

            render();

            var namespace = instance.namespace();
            mainElement
                .on('click' + namespace, labelSelector, function () {
                    inputElement.focus();
                })
                .on('change' + namespace, inputSelector, render)
                .on(inputUtil.INPUT + namespace, inputSelector, render);

        },
        show: function (instance) {

            instance.execute(
                'showAnimation',
                {
                    labelElement: instance.inner('label')
                }
            );

        },
        hide: function (instance) {

            instance.execute(
                'hideAnimation',
                {
                    labelElement: instance.inner('label')
                }
            );

        },
        render: function (instance) {

            var inputElement = instance.inner('input');

            instance.inner('label').html(
                instance.get('value')
            );

            var value = inputElement.val();
            if (instance.option('autoTrim')) {
                value = $.trim(value);
            }

            if (value) {
                instance.hide();
            }
            else {
                instance.show();
            }

        },
        dispose: function (instance) {
            inputUtil.dispose(
                instance.inner('input')
            );
        },
        isHidden: function (instance) {
            return isHidden(
                instance.inner('label')
            );
        }
    };


    return Placeholder;

});
