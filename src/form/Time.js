/**
 * @file 表单时间选择器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var contains = require('../function/contains');
    var replaceWith = require('../function/replaceWith');

    var Popup = require('../helper/Popup');

    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');

    var common = require('./common');

    /**
     * 表单时间选择器
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.name
     * @property {string=} options.value
     *
     * @property {string=} options.itemActiveClass
     * @property {string=} options.valueAttribute
     * @property {string=} options.itemSelector
     *
     * @property {string=} options.showLayerTrigger 显示的触发方式
     * @property {number=} options.showLayerDelay 显示延时
     * @property {Function=} options.showLayerAnimation 显示动画
     *
     * @property {string=} options.hideLayerTrigger 隐藏的触发方式
     * @property {number=} options.hideLayerDelay 隐藏延时
     * @property {Function=} options.hideLayerAnimation 隐藏动画
     *
     * @property {string=} options.inputSelector 输入框选择器
     * @property {string=} options.layerSelector 浮层选择器
     * @property {string=} options.renderSelector 浮层中的时间列表，不传表示 layer 就是时间列表
     * @property {string=} options.renderTemplate 时间列表模板
     *
     * @property {Function=} options.render 渲染模板函数
     */
    function Time(options) {
        lifeUtil.init(this, options);
    }

    var proto = Time.prototype;

    proto.type = 'Time';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var layerElement = mainElement.find(
            me.option('layerSelector')
        );

        var itemSelector = me.option('itemSelector');
        var valueAttribute = me.option('valueAttribute');

        layerElement
        .on('click', itemSelector, function () {
            popup.close();
            me.set('value', $(this).attr(valueAttribute));
        });

        var popup = new Popup({
            triggerElement: mainElement,
            layerElement: layerElement,
            showLayerTrigger: me.option('showLayerTrigger'),
            showLayerDelay: me.option('showLayerDelay'),
            hideLayerTrigger: me.option('hideLayerTrigger'),
            hideLayerDelay: me.option('hideLayerDelay'),
            showLayerAnimation: function () {
                me.execute(
                    'showLayerAnimation',
                    {
                        layerElement: layerElement
                    }
                );
            },
            hideLayerAnimation: function () {
                me.execute(
                    'hideLayerAnimation',
                    {
                        layerElement: layerElement
                    }
                );
            }
        });

        me.once('aftersync', function () {

            popup.option(
                'watchSync',
                {
                    opened: function (opened) {
                        me.state('opened', opened);
                    }
                }
            );
            me.state('opened', popup.is('opened'));

        });

        popup
        .on('dispatch', function (e, data) {

            var event = e.originalEvent;

            if (event.type === 'beforeclose') {
                var target = event.originalEvent.target;
                if (target) {
                    if (contains(inputElement, target)
                        || contains(layerElement, target)
                    ) {
                        return false;
                    }
                }
            }

            me.dispatch(
                me.emit(event, data),
                data
            );

        });

        var inputElement = mainElement.find(
            me.option('inputSelector')
        );

        inputUtil.init(inputElement);
        inputElement.on(inputUtil.INPUT, function () {
            me.set('value', this.value);
        });


        me.inner({
            main: mainElement,
            native: inputElement,
            layer: layerElement,
            popup: popup
        });

        me.set({
            name: me.option('name'),
            value: me.option('value'),
            data: me.option('data')
        });

    };


    proto.open = function () {
        this.state('opened', true);
    };

    proto.close = function () {
        this.state('opened', false);
    };

    proto.render = function () {
        this.renderWith(
            this.get('data')
        );
    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);
        inputUtil.dispose(
            me.inner('native')
        );

        me.inner('popup').dispose();

    };

    lifeUtil.extend(proto, [ 'open', 'close' ]);

    Time.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        }
    };

    Time.propertyUpdater.data =
    Time.propertyUpdater.value = function (newValue, oldValue, changes) {

        var me = this;

        var dataChange = changes.data;
        if (dataChange) {
            me.render();
        }

        var valueChange = changes.value;
        if (valueChange) {
            var value = valueChange.newValue;
            var oldValue = valueChange.oldValue;

            common.prop(me, 'value', value);

            var layerElement = me.inner('layer');
            var itemActiveClass = me.option('itemActiveClass');

            if (itemActiveClass) {
                layerElement
                    .find('.' + itemActiveClass)
                    .removeClass(itemActiveClass);
            }

            if (value) {
                var itemElement = layerElement.find('[' + me.option('valueAttribute') + '="' + value + '"]');
                if (itemElement.length === 1 && itemActiveClass) {
                    itemElement.addClass(itemActiveClass);
                }
            }

            if (!value && oldValue) {
                me.state('opened', true);
            }
        }

        return false;

    };

    Time.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            return common.validateValue(this, value);
        }

    };

    Time.stateUpdater = {

        opened: function (opened) {
            var popup = this.inner('popup');
            if (opened) {
                popup.open();
            }
            else {
                popup.close();
            }
        }

    };


    return Time;

});
