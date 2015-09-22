/**
 * @file 可切换组件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var toNumber = require('../function/toNumber');

    var trigger = require('../util/trigger');

    /**
     * 可切换组件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number=} options.index 当前选中索引，默认是 0
     * @property {string=} options.trigger 触发方式，可选值有 over click，默认是 click
     * @property {number=} options.delay 延时时间
     * @property {string} options.selector 触发器的选择器
     * @property {string=} options.activeClass 触发元素被激活时的 class
     */
    function Switchable(options) {
        lifeCycle.init(this, options);
    }

    var proto = Switchable.prototype;

    proto.type = 'Switchable';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('element');

        me.inner('main', mainElement);

        var selector = me.option('selector');

        var items = mainElement.find(selector);

        var activeClass = me.option('activeClass');
        var index = toNumber(
            me.option('index'),
            defaultIndex
        );

        if (index === defaultIndex && activeClass) {
            index = items.index(
                mainElement.find('.' + activeClass)
            );
        }


        if (selector) {

            var namespace = me.namespace();

            var leaveType = trigger.leave.type + namespace;

            $.each(
                trigger.parse(
                    me.option('trigger'),
                    function (trigger) {

                        var options = {
                            handler: function () {
                                me.set(
                                    'index',
                                    items.index(this)
                                )
                            }
                        };

                        if (trigger === 'enter') {

                            options.delay = me.option('delay');

                            options.startDelay = function (fn) {
                                mainElement.on(leaveType, selector, fn);
                            };

                            options.endDelay = function (fn) {
                                mainElement.off(leaveType, fn);
                            };

                        }

                        return options;

                    }
                ),
                function (name, config) {

                    mainElement.on(
                        config.type + namespace,
                        selector,
                        config.handler
                    );

                }
            );

        }

        if (index >= 0) {
            me.set('index', index);
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Switchable.defaultOptions = {
        index: 0,
        trigger: 'click',
        delay: 150
    };

    /**
     * 默认的索引值
     *
     * @inner
     * @type {number}
     */
    var defaultIndex = -1;


    return Switchable;

});