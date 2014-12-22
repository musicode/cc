/**
 * @file 可切换组件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

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

            var index = me.index;
            var activeClass = me.activeClass;

            if (!$.isNumeric(index) && activeClass) {
                index = element.find(selector)
                               .index(element.find('.' + me.activeClass));
            }

            var trigger = me.trigger;
            if (trigger === 'click') {
                element.on('click' + namespace, selector, me, onClick);
            }
            else if (trigger === 'over') {
                element.on('mouseenter' + namespace, selector, me, onEnter);
                element.on('mouseleave' + namespace, selector, me, onLeave);
            }

            if ($.type(index) === 'number' && index >= 0) {
                me.index = defaultIndex;
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

            // 强制为数字类型，避免后续出现问题
            if ($.isNumeric(index)) {

                index = index >= 0 ? (+ index) : defaultIndex;

            }
            else {
                index = defaultIndex;
            }

            var activeClass = me.activeClass;

            var fromIndex = me.index;
            var targets = me.element.find(me.selector);

            if (activeClass) {

                if (fromIndex >= 0) {
                    targets.eq(fromIndex).removeClass(activeClass);
                }

                if (index >= 0) {
                    targets.eq(index).addClass(activeClass);
                }

            }

            var data = {
                from: fromIndex,
                to: index
            };

            me.index = index;

            me.change(data);

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;
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

    /**
     * 通过点击切换
     *
     * @inner
     * @param {Event} e
     */
    function onClick(e) {

        var switchable = e.data;
        var index = switchable.element
                       .find(switchable.selector)
                       .index(this);

        if (index !== switchable.index) {
            switchable.to(index);
        }
    }

    /**
     * 鼠标进入设置一个延时触发，否则会太过灵敏
     *
     * @inner
     * @param {Event} e
     */
    function onEnter(e) {

        var switchable = e.data;
        var target = this;

        switchable.timer =
        setTimeout(
            function () {
                if (switchable.element) {

                    var index = switchable
                                    .element
                                    .find(switchable.selector)
                                    .index(target);

                    if (index !== switchable.index) {
                        switchable.to(index);
                    }

                }
            },
            150
        );
    }

    /**
     * 鼠标移出时删除延时
     *
     * @inner
     * @param {Event} e
     */
    function onLeave(e) {
        var switchable = e.data;
        if (switchable.timer) {
            clearTimeout(switchable.timer);
            switchable.timer = null;
        }
    }


    return Switchable;

});