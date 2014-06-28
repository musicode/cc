/**
 * @file Tab
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 满意度：★★★★☆
     */

    /**
     * 标签页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     * @property {number=} options.index 当前选中的索引，如果未传此项，会通过 className.navActive 算出索引
     *
     * @property {Object} options.selector 选择器
     * @property {string} options.selector.nav 导航项的选择器，如 .nav-item
     * @property {string} options.selector.content 内容区的选择器，如 .tab-panel
     *
     * @property {Object} options.className 样式
     * @property {string} options.className.navActive 导航项选中状态的 class
     * @property {string=} options.className.contentActive 内容区选中状态的 class，如果未设置，直接 show/hide
     *
     * @property {Object=} options.animation 动画
     * @property {Function=} options.animation.switchContent 切换内容的动画，如果 contentActive 不能满足需求，可自行实现
     *
     * @property {Function=} options.onChange 切换 tab 触发
     */
    function Tab(options) {
        $.extend(this, Tab.defaultOptions, options);
        this.init();
    }

    Tab.prototype = {

        constructor: Tab,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;
            var navSelector = me.selector.nav;

            // 这里最好检测一下 navActive 和 index 是不是同一个导航项
            // 避免某种 2b 情况出现后，不知道哪里出了问题

            var passIndex = me.index;
            var realIndex = element.find(navSelector)
                                   .index(element.find('.' + me.className.navActive));

            if (!$.isNumeric(passIndex)) {
                passIndex = realIndex;
            }
            else if ($.isNumeric(realIndex) && passIndex !== realIndex) {
                throw new Error('[Tab] index is conflict.');
            }

            element.on('click' + namespace, navSelector, me, clickNav);
            me.to(passIndex, true);
        },

        /**
         * 激活 tab
         *
         * @param {number} index
         * @param {boolean=} silence 是否不触发 onChange 事件，默认为 false
         */
        to: function (index, silence) {

            var me = this;
            var element = me.element;

            var selector = me.selector;

            // 先处理 nav 再处理 content
            // 因为 nav 的数量是稳定的
            // content 的数量可以和 nav 一致，或者只有一个（切换时刷新，而非隐藏显示）

            var navs = element.find(selector.nav);
            var maxIndex = navs.length - 1;

            if (index < 0 || index > maxIndex) {
                return;
            }

            var oldIndex = me.index;
            var className = me.className;

            var activeClass = className.navActive;

            // 切换 nav
            navs.eq(oldIndex).removeClass(activeClass);
            navs.eq(index).addClass(activeClass);

            // 切换 content，优先使用动画
            var switchContent = me.animation.switchContent;
            if ($.isFunction(switchContent)) {
                switchContent.call(
                    me,
                    {
                        oldIndex: oldIndex,
                        newIndex: index
                    }
                );
            }
            else {

                var contents = element.find(selector.content);

                // 单个 content 表示不需要切换，每次都是刷新这块内容区
                if (contents.length !== 1) {
                    activeClass = className.contentActive;
                    if (activeClass) {
                        contents.eq(oldIndex).removeClass(activeClass);
                        contents.eq(index).addClass(activeClass);
                    }
                    else {
                        contents.eq(oldIndex).hide();
                        contents.eq(index).show();
                    }
                }
            }

            me.index = index;

            if (!silence && $.isFunction(me.onChange)) {
                me.onChange({ index: index });
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            me.element.off(namespace);
            me.element = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Tab.defaultOptions = {
        selector: { },
        animation: { },
        className: {
            navActive: 'tab-active'
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_tab';

    /**
     * 点击导航 tab 时的处理函数
     *
     * @inner
     * @param {Event} e
     */
    function clickNav(e) {

        var tab = e.data;
        var target = $(e.currentTarget);

        var index = tab.element
                       .find(tab.selector.nav)
                       .index(target);

        tab.to(index);

        // 防止 target 是 <a>
        return false;
    }


    return Tab;

});
