/**
 * @file SpinBox
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var toNumber = require('../function/toNumber');

    var Iterator = require('../helper/KeyboardIterator');

    var lifeUtil = require('../util/life');
    var document = require('../util/instance').document;

    /**
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {number=} options.value 当前值
     * @property {number} options.minValue value 的最小值
     * @property {number} options.maxValue value 的最大值
     * @property {number=} options.defaultValue 默认值，当输入的值非法时，可用默认值替换错误值，如果不想替换，则不传
     * @property {number} options.step 步进值，按上下键或点击上下按钮可触发步进
     * @property {number} options.timeout 启动自动步进的时间间隔，单位是毫秒
     * @property {number} options.interval 自动步进的时间间隔，单位是毫秒
     * @property {string} options.inputSelector 输入框选择器
     * @property {string} options.upSelector 向上按钮选择器
     * @property {string} options.downSelector 向下按钮选择器
     */
    function SpinBox(options) {
        lifeUtil.init(this, options);
    }

    var proto = SpinBox.prototype;

    proto.type = 'SpinBox';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var inputElement = mainElement.find(
            me.option('inputSelector')
        );

        var iterator = new Iterator({
            mainElement: inputElement,
            index: me.option('value'),
            minIndex: me.option('minValue'),
            maxIndex: me.option('maxValue'),
            timeout: me.option('timeout'),
            interval: me.option('interval'),
            autoOnLongPress: true,
            step: me.option('step'),
            prevKey: 'down',
            nextKey: 'up',
            watchSync: {
                index: function (index) {
                    me.set('value', index, { action: 'press' });
                },
                minIndex: function (minIndex) {
                    me.set('minValue', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxValue', maxIndex);
                }
            }
        });



        var namespace = me.namespace();
        var upSelector = me.option('upSelector');
        var downSelector = me.option('downSelector');
        var mousedownType = 'mousedown' + namespace;
        var mouseupType = 'mouseup' + namespace;
        var blueType = 'focusout' + namespace;

        var mouseupHandler = function () {
            iterator.pause();
            document.off(namespace);
        };

        mainElement
            .on(mousedownType, upSelector, function () {
                iterator.next();
                iterator.start(false);
                document.on(mouseupType, mouseupHandler);
            })
            .on(mousedownType, downSelector, function () {
                iterator.prev();
                iterator.start(true);
                document.on(mouseupType, mouseupHandler);
            })
            .on(blueType, function () {
                var value = $.trim(inputElement.val());
                me.set('value', value, { action: 'blur' });
            });

        me.inner({
            main: mainElement,
            input: inputElement,
            iterator: iterator
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('iterator').dispose();

        var namespace = me.namespace();
        document.off(namespace);

        me.inner('main').off(namespace);

    };

    lifeUtil.extend(proto);

    SpinBox.propertyUpdater = {
        value: function (value) {
            this.inner('input').val(value);
            this.inner('iterator').set('index', value);
        },
        minValue: function (minValue) {
            this.inner('iterator').set('minIndex', minValue);
        },
        maxValue: function (maxValue) {
            this.inner('iterator').set('maxIndex', maxValue);
        }
    };

    SpinBox.propertyValidator = {
        value: function (value, options) {

            var rawValue = value;
            var valid = false;

            var me = this;
            var minValue = me.get('minValue');
            var maxValue = me.get('maxValue');

            value = toNumber(value, '');

            if (value >= minValue && value <= maxValue) {
                var step = me.option('step');
                if (minus(value, minValue) % step === 0) {
                    valid = true;
                }
            }

            if (!valid) {
                var defaultValue = me.option('defaultValue');
                if ($.type(defaultValue) === 'number') {
                    value = defaultValue;
                    options.force = true;
                }
                else {
                    value = rawValue;
                }
            }

            return value;

        },
        minValue: function (minValue) {
            minValue = toNumber(minValue, null);
            if (minValue == null) {
                this.error('minValue must be a number.');
            }
            return minValue;
        },
        maxValue: function (maxValue) {
            maxValue = toNumber(maxValue, null);
            if (maxValue == null) {
                this.error('maxValue must be a number.');
            }
            return maxValue;
        }
    };


    return SpinBox;

});