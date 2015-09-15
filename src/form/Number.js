/**
 * @file 模拟 <input type="number" />
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var init = require('../function/init');
    var timer = require('../function/timer');
    var setValue = require('../function/setValue');
    var toNumber = require('../function/toNumber');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var replaceWith = require('../function/replaceWith');
    var isActiveElement = require('../function/isActiveElement');

    var plus = require('../function/plus');
    var minus = require('../function/minus');
    var divide = require('../function/divide');

    var Input = require('../helper/Input');
    var instance = require('../util/instance');

    /**
     * 构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素，如果结构完整，可直接传容器元素
     * @property {number=} options.defaultValue 默认值，当输入的值验证失败时，可用默认值替换错误值，如果不想替换，则不传
     * @property {string=} options.template 模拟 <input type="number" /> 的模版，一般有一个输入框，一个向上的按钮，一个向下的按钮
     * @property {string=} options.upSelector 向上按钮的选择器
     * @property {string=} options.downSelector 向下按钮的选择器
     * @property {Function=} options.onChange 数值变化时调用的接口
     */
    function Number(options) {
        return lifeCycle.init(this, options);
    }

    var proto = Number.prototype;

    proto.type = 'Number';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var element = me.element;
        var upSelector = me.upSelector;
        var downSelector = me.downSelector;

        var mainElement;

        // 如果结构完整，不需要初始化模板
        if (element.find(upSelector).length === 1) {

            mainElement = element;

            element =
            me.element = mainElement.find(':text');

        }
        else {

            mainElement = $(me.template);

            replaceWith(element, mainElement);
            replaceWith(mainElement.find(':text'), element);

        }

        me.main = mainElement;

        me.step = toNumber(element.attr('step'), 1);
        me.min = toNumber(element.attr('min'));
        me.max = toNumber(element.attr('max'));

        me.value = toNumber(element.val(), '');

        var upHandler = function () {

            var value = me.getValue();

            if ($.type(value) === 'number') {
                value = plus(value, me.step);
                if (me.max != null) {
                    value = Math.min(me.max, value);
                }
            }
            else {
                value = me.min || 0;
            }

            me.setValue(value);

        };
        var downHandler = function () {

            var value = me.getValue();

            if ($.type(value) === 'number') {
                value = minus(value, me.step);
                if (me.min != null) {
                    value = Math.max(me.min, value);
                }
            }
            else {
                value = me.min || 0;
            }

            me.setValue(value);

        };

        me.input = new Input({
            element: element,
            action: {
                up: upHandler,
                down: downHandler
            }
        });

        var delay = 100;
        var upTimer = timer(upHandler, delay, delay);
        var downTimer = timer(downHandler, delay, delay);

        var mouseup = 'mouseup' + namespace;
        var mousedown = 'mousedown' + namespace;
        var blur = 'focusout' + namespace;

        mainElement
            .on(mousedown, upSelector, upTimer.start)
            .on(mousedown, downSelector, downTimer.start)
            .on(blur, ':text', function () {
                me.setValue(
                    element.val()
                );
            });

        instance.document.on(
            mouseup,
            function () {
                upTimer.stop();
                downTimer.stop();
            }
        );

    };

    /**
     * 获取合法值
     *
     * @param {*} value
     * @returns {number|string}
     */
    proto.getLegalValue = function (value) {

        var me = this;

        if ($.type(value) === 'string') {
            value = $.trim(value);
        }

        value = me.validate(value)
              ? toNumber(value)
              : me.defaultValue;

        return $.type(value) === 'number' ? value : '';

    };

    /**
     * 取值
     *
     * @return {number}
     */
    proto.getValue = function () {

        var me = this;
        var element = me.element;

        return isActiveElement(element)
            ? me.getLegalValue(element.val())
            : me.value;

    };

    /**
     * 设值
     *
     * @param {string|number} value
     * @param {Object=} options 选项
     * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
     * @property {boolean=} options.silence 是否不触发 change 事件
     */
    proto.setValue = function (value, options) {

        var me = this;

        value = me.getLegalValue(value);

        if (setValue(me, 'value', value, options)) {
            me.element.val(value);
        }

    };

    /**
     * 验证
     *
     * @param {string=} value 验证值，不传默认读取输入框当前的值
     * @return {boolean} 是否验证通过
     */
    proto.validate = function (value) {

        var me = this;

        if (value == null) {
            value = me.getValue();
        }

        value = toNumber(value, '');

        if (value === '' || (value < me.min || value > me.max)) {
            return false;
        }

        var result = divide(minus(value, me.min), me.step);

        return result === Math.floor(result);

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        instance.document.off(namespace);
        me.main.off(namespace);
        me.input.dispose();

        me.element =
        me.main =
        me.input = null;

    };

    jquerify(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Number.defaultOptions = {
        upSelector: '.icon-caret-up',
        downSelector: '.icon-caret-down',
        template: '<div class="form-number">'
                +     '<input class="form-text" type="text" />'
                +     '<i class="icon icon-caret-up"></i>'
                +     '<i class="icon icon-caret-down"></i>'
                + '</div>'
    };


    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Number>}
     */
    Number.init = init(Number);

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_number';



    return Number;

});