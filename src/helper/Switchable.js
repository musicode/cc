/**
 * @file 可切换组件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var toNumber = require('../function/toNumber');

    /**
     * 可切换组件
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number=} options.index 当前选中索引，默认是 0
     * @property {string=} options.trigger 触发方式，可选值有 over click，默认是 click
     * @property {string} options.selector 触发器的选择器
     * @property {string=} options.activeClass 触发元素被激活时的 class
     * @property {Function} options.change 切换动作
     * @argument {Object} options.change.data
     * @property {number} options.change.data.from
     * @property {number} options.change.data.to
     */
    function Switchable(options) {
        return lifeCycle.init(this, options);
    }

    Switchable.prototype = {

        constructor: Switchable,

        type: 'Switchable',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;
            var selector = me.selector;
            var items = me.items = element.find(selector);

            var index = toNumber(me.index, defaultIndex);
            var activeClass = me.activeClass;

            if (index === defaultIndex && activeClass) {
                index = items.index(element.find('.' + activeClass));
            }

            if (selector) {

                var trigger = me.trigger;

                if (trigger === 'click') {

                    element.on('click' + namespace, selector, function () {
                        me.to(
                            items.index(this)
                        );
                    });

                }
                else if (trigger === 'over') {

                    element.on('mouseenter' + namespace, selector, function () {

                        var target = this;

                        me.timer = setTimeout(
                            function () {
                                if (me.element) {
                                    me.to(
                                        items.index(target)
                                    );
                                }
                            },
                            150
                        );
                    });

                    element.on('mouseleave' + namespace, selector, function () {
                        if (me.timer) {
                            clearTimeout(me.timer);
                            me.timer = null;
                        }
                    });

                }
            }

            me.index = defaultIndex;

            if (index >= 0) {
                me.to(index);
            }
        },

        /**
         * 激活 tab
         *
         * @param {number} index
         */
        to: function (index) {

            var me = this;

            index = toNumber(index, defaultIndex);

            var fromIndex = me.index;

            if (index !== fromIndex) {

                var activeClass = me.activeClass;

                var items = me.items;

                if (activeClass) {

                    if (fromIndex >= 0) {
                        items.eq(fromIndex).removeClass(activeClass);
                    }

                    if (index >= 0) {
                        items.eq(index).addClass(activeClass);
                    }

                }

                me.index = index;

                me.change({
                    from: fromIndex,
                    to: index
                });
            }

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);

            me.element =
            me.items = null;
        }
    };

    jquerify(Switchable.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Switchable.defaultOptions = {
        index: 0,
        trigger: 'click'
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_helper_switchable';

    var defaultIndex = -1;


    return Switchable;

});