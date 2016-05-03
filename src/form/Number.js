/**
 * @file 模拟 <input type="number" />
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var SpinBox = require('../ui/SpinBox');
    var lifeUtil = require('../util/life');
    var common = require('./common');

    /**
     * 构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {jQuery} options.mainTemplate 如果主元素结构不完整，需要传模板
     *                                         一般有一个输入框，一个向上的按钮，一个向下的按钮
     * @property {string=} options.name
     * @property {string=} options.value
     * @property {number=} options.defaultValue 默认值，当输入的值非法时，可用默认值替换错误值，如果不想替换，则不传
     * @property {string=} options.inputSelector 输入框选择器
     * @property {string=} options.upSelector 向上按钮选择器
     * @property {string=} options.downSelector 向下按钮选择器
     */
    function Number(options) {
        lifeUtil.init(this, options);
    }

    var proto = Number.prototype;

    proto.type = 'Number';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');

        var spinbox = new SpinBox({
            mainElement: mainElement,
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue'),
            upSelector: me.option('upSelector'),
            downSelector: me.option('downSelector'),
            inputSelector: me.option('inputSelector'),
            timeout: me.option('timeout'),
            interval: me.option('interval'),
            step: me.option('step')
        });

        me.once('aftersync', function () {

            spinbox.option(
                'watchSync',
                {
                    value: function (value) {
                        me.set('value', value);
                    },
                    minValue: function (minValue) {
                        me.set('minValue', minValue);
                    },
                    maxValue: function (maxValue) {
                        me.set('maxValue', maxValue);
                    }
                }
            );

            me.set({
                value: spinbox.get('value'),
                minValue: spinbox.get('minValue'),
                maxValue: spinbox.get('maxValue')
            });

        });

        me.inner({
            main: mainElement,
            native: spinbox.inner('input'),
            spinbox: spinbox
        });

        me.set({
            name: me.option('name')
        });

    };

    proto.dispose = function () {
        lifeUtil.dispose(this);
        this.inner('spinbox').dispose();
    };

    lifeUtil.extend(proto);

    Number.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            this.inner('spinbox').set('value', value);
        },
        minValue: function (minValue) {
            this.inner('spinbox').set('minValue', minValue);
        },
        maxValue: function (maxValue) {
            this.inner('spinbox').set('maxValue', maxValue);
        }
    };

    Number.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        }
    };


    return Number;

});