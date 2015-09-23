/**
 * @file 可切换组件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('../function/toNumber');

    var lifeCycle = require('../util/lifeCycle');
    var trigger = require('../util/trigger');

    /**
     * 可切换组件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {number=} options.index 当前选中索引，默认是 0
     * @property {string=} options.switchTrigger 触发方式，可选值有 enter click，默认是 click
     * @property {number=} options.switchDelay 延时时间
     * @property {string} options.itemSelector 触发器的选择器
     * @property {string=} options.itemActiveClass 触发元素被激活时的 class
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

            var executeProxy = function (proxy, name) {
                if ($.isFunction(proxy[ name ])) {
                    return proxy[ name ](me);
                }
            };

            $.each(
                trigger.parse(
                    me.option('switchTrigger'),
                    function (trigger) {

                        var proxy = triggers[ trigger ];

                        return {
                            delay: me.option('switchDelay'),
                            startDelay: executeProxy(proxy, 'startDelay'),
                            endDelay: executeProxy(proxy, 'endDelay'),
                            handler: executeProxy(proxy, 'handler')
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


    Switchable.defaultOptions = {
        index: 0,
        switchTrigger: 'click',
        switchDelay: 100
    };

    Switchable.propertyValidator = {

        index: function (index) {

            var me = this;

            index = toNumber(index, defaultIndex);

            if (index === defaultIndex) {
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

    var defaultIndex = -1;

    var triggers = {

        enter: {
            startDelay: function (instance) {
                return function (fn) {
                    instance.inner('main').on(
                        trigger.leave.type,
                        instance.option('itemSelector'),
                        fn
                    );
                };
            },
            endDelay: function (instance) {
                return function (fn) {
                    instance.inner('main').off(
                        trigger.leave.type,
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