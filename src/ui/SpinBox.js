/**
 * @file 模拟 <input type="number" />
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var toNumber = require('../function/toNumber');

    var Iterator = require('../helper/ElementIterator');

    var instance = require('../util/instance');
    var lifeCycle = require('../util/lifeCycle');

    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {jQuery} options.mainTemplate 如果主元素结构不完整，需要传模板
     *                                         一般有一个输入框，一个向上的按钮，一个向下的按钮
     *
     * @property {number=} options.value
     * @property {number=} options.minValue
     * @property {number=} options.maxVlue
     * @property {number=} options.defaultValue 默认值，当输入的值非法时，可用默认值替换错误值，如果不想替换，则不传
     * @property {string=} options.inputSelector 输入框选择器
     * @property {string=} options.upSelector 向上按钮选择器
     * @property {string=} options.downSelector 向下按钮选择器
     */
    function SpinBox(options) {
        lifeCycle.init(this, options);
    }

    var proto = SpinBox.prototype;

    proto.type = 'SpinBox';

    proto.init = function () {

        var me = this;

        me.initStructure();

        var mainElement = me.option('mainElement');
        var inputElement = mainElement.find(
            me.option('inputSelector')
        );

        var iterator = new Iterator({
            watchElement: inputElement,
            defaultIndex: 0,
            loop: false,
            step: me.option('step'),
            interval: me.option('interval'),
            prevKey: 'down',
            nextKey: 'up',
            propertyChange: {
                index: function (index) {
                    me.set('value', index);
                }
            }
        });



        var namespace = me.namespace();
        var upSelector = me.option('upSelector');
        var downSelector = me.option('downSelector');
        var mousedown = 'mousedown' + namespace;

        mainElement
            .on(mousedown, upSelector, function () {
                iterator.next();
                iterator.start();
            })
            .on(mousedown, downSelector, function () {
                iterator.prev();
                iterator.start(true);
            })
            .on('focusout' + namespace, function () {
                me.set('value', inputElement.val());
            });

        instance.document.on(
            'mouseup' + namespace,
            function () {
                iterator.pause();
            }
        );

        me.inner({
            main: mainElement,
            input: inputElement
        });

        me.set({
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue')
        });

        me.on('propertychange', function (e, data) {

            var properties = { };

            if (data.value) {
                properties.index = data.value.newValue;
            }
            if (data.minValue) {
                properties.minIndex = data.minValue.newValue;
            }
            if (data.maxValue) {
                properties.maxIndex = data.maxValue.newValue;
            }

            iterator.set(properties);

        });

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        var namespace = me.namespace();
        instance.document.off(namespace);
        me.inner('main').off(namespace);

        me.inner('iterator').dispose();

    };

    lifeCycle.extend(proto);

    SpinBox.defaultOptions = {
        step: 1,
        interval: 100,
        inputSelector: ':text',
        upSelector: '.icon-caret-up',
        downSelector: '.icon-caret-down',
        template: '<div class="form-number">'
                +     '<input class="form-text" type="text" />'
                +     '<i class="icon icon-caret-up"></i>'
                +     '<i class="icon icon-caret-down"></i>'
                + '</div>'
    };

    SpinBox.propertyUpdater = {

        value: function (value) {
            this.inner('input').val(value);
        }

    };


    SpinBox.propertyValidator = {

        minValue: function (minValue) {
            if ($.type(minValue) !== 'number') {
                throw new Error('[CC Error] ui/SpinBox minValue is missing.');
            }
            return minValue;
        },

        maxValue: function (maxValue) {
            if ($.type(maxValue) !== 'number') {
                throw new Error('[CC Error] ui/SpinBox maxValue is missing.');
            }
            return maxValue;
        },

        value: function (value) {

            if ($.type(value) === 'string') {
                value = $.trim(value);
            }

            var rawValue = value;

            value = toNumber(value, '');

            var me = this;
            var valid = false;
            var minValue = me.get('minValue');

            if (value >= minValue
                && value <= me.get('maxValue')
            ) {
                var result = divide(
                    minus(value, minValue),
                    me.option('step')
                );
                if (result === Math.floor(result)) {
                    valid = true;
                }
            }

            if (valid) {
                return value;
            }

            var defaultValue = me.option('defaultValue');
            return defaultValue != null ? defaultValue : rawValue;

        }

    };


    return SpinBox;

});