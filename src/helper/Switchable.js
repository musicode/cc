/**
 * @file 可切换组件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('../function/toNumber');

    var lifeCycle = require('../util/lifeCycle');
    var triggerUtil = require('../util/trigger');

    /**
     * 可切换组件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {number=} options.index 当前选中索引
     * @property {string=} options.switchTrigger 触发切换方式，可选值有 enter click
     * @property {number=} options.switchDelay 触发延时时间
     * @property {string} options.itemSelector 触发元素的选择器
     * @property {string=} options.itemActiveClass 触发元素被激活时的 className
     */
    function Switchable(options) {
        lifeCycle.init(this, options);
    }

    var proto = Switchable.prototype;

    proto.type = 'Switchable';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        var itemSelector = me.option('itemSelector');

        if (itemSelector) {

            var curry = function (proxy, name) {
                if ($.isFunction(proxy[ name ])) {
                    return proxy[ name ](me);
                }
            };

            $.each(
                triggerUtil.parse(
                    me.option('switchTrigger'),
                    function (trigger) {

                        var proxy = triggers[ trigger ];

                        return {
                            delay: me.option('switchDelay'),
                            startDelay: curry(proxy, 'startDelay'),
                            endDelay: curry(proxy, 'endDelay'),
                            handler: curry(proxy, 'handler')
                        };

                    }
                ),
                function (name, config) {
                    mainElement.on(
                        config.type + me.namespace(),
                        itemSelector,
                        config.handler
                    );
                }
            );

        }

        me.inner({
            main: mainElement
        });

        me.set({
            index: me.option('index')
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    Switchable.propertyValidator = {

        index: function (index) {

            index = toNumber(index, null);

            if (index == null) {

                var me = this;
                var itemSelector = me.option('itemSelector');
                var itemActiveClass = me.option('itemActiveClass');

                if (itemSelector && itemActiveClass) {
                    var mainElement = me.inner('main');
                    index = mainElement.find(itemSelector).index(
                        mainElement.find('.' + itemActiveClass)
                    );
                }
            }

            return index;

        }
    };

    var triggers = {

        enter: {
            startDelay: function (instance) {
                return function (fn) {
                    instance.inner('main').on(
                        triggerUtil.leave.type,
                        instance.option('itemSelector'),
                        fn
                    );
                };
            },
            endDelay: function (instance) {
                return function (fn) {
                    instance.inner('main').off(
                        triggerUtil.leave.type,
                        fn
                    );
                };
            }
        },

        click: {

        }
    };

    triggers.enter.handler =
    triggers.click.handler = function (instance) {
        return function () {
            var itemSelector = instance.option('itemSelector');
            var itemElements = instance.inner('main').find(itemSelector);
            instance.set(
                'index',
                itemElements.index(this)
            );
        };
    };


    return Switchable;

});