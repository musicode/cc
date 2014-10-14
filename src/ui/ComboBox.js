/**
 * @file 下拉菜单
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 元素自定义属性使用 data-text 和 data-value
     * 如果需要在点击菜单项获得其他数据，可在元素任意绑定 data-xxx
     * 当 onChange 事件触发时，会把所有 data 通过参数传入
     */

    var lifeCycle = require('../function/lifeCycle');
    var Popup = require('../helper/Popup');

    /**
     * 下拉菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 如果需要容器包着 button 和 menu, 可以设置主元素
     *                                     openClass 会优先作用于它，否则作用于 button
     *
     * @property {jQuery} options.button 点击触发下拉菜单显示的元素
     * @property {jQuery} options.menu 下拉菜单元素
     *
     * @property {Array=} options.data 下拉菜单的数据
     * @property {string=} options.itemTemplate 菜单项模板
     * @property {Function=} options.renderTemplate 渲染模板的函数
     *
     * @property {string=} options.value 当前选中的值
     * @property {string=} options.defaultText 未选中值时默认显示的文本，如 请选择
     *
     * @property {string=} options.activeClass 菜单项选中状态的 class，可提升用户体验
     * @property {string=} options.openClass 菜单展开状态的 class
     *
     * @property {Object=} options.show
     * @property {number=} options.show.delay 显示延时
     * @property {Function=} options.show.animation 显示动画
     *
     * @property {Object=} options.hide
     * @property {number=} options.hide.delay 隐藏延时
     * @property {Function=} options.hide.animation 隐藏动画
     *
     * @property {Function=} options.onBeforeShow 菜单展开前触发，返回 false 可阻止打开
     * @property {Function=} options.onAfterShow 菜单展开后触发
     * @property {Function=} options.onBeforeHide 菜单关闭前触发，返回 false 可阻止关闭
     * @property {Function=} options.onAfterHide 菜单关闭后触发
     *
     * @property {Function} options.setText 设置选中菜单项文本
     * @argument {string} options.onText.text
     *
     * @property {Function=} options.onChange 选中菜单项触发
     * @argument {Object} options.onChange.data
     * @property {string} options.onChange.data.text
     * @property {string} options.onChange.data.value
     */
    function ComboBox(options) {
        return lifeCycle.init(this, options);
    }

    ComboBox.prototype = {

        constructor: ComboBox,

        type: 'ComboBox',

        /**
         * 初始化
         *
         * @private
         */
        init: function () {

            var me = this;

            me.popup = createPopup(me);

            var menu = me.menu;

            // 通过 DOM 取值
            if (me.value == null) {
                var item = menu.find('.' + me.activeClass);
                if (item.length === 1) {
                    me.value = item.data('value');
                }
            }

            // 不论是直接传入 value 或是通过 DOM 获取的 value
            // 都不需要触发 onChange 事件
            // 因为初始化触发会带来同步问题
            // 如果非要触发，可以在初始化后调用 setValue() 手动触发

            // 如果有数据，需要刷新
            me.refresh({
                data: me.data
            });

            menu.on(
                'click' + namespace,
                '[data-value]',
                function (e) {

                    var target = $(e.currentTarget);

                    me.close();
                    me.setValue(
                        target.data('value')
                    );

                }
            );
        },

        /**
         * 获取当前选中的值
         *
         * @return {string}
         */
        getValue: function () {
            return this.value;
        },

        /**
         * 设置当前选中的值
         *
         * @param {string} value
         * @return {boolean} 是否设置成功
         */
        setValue: function (value) {

            var me = this;
            var data = { };

            var menu = me.menu;
            var target = menu.find('[data-value="' + value + '"]');
            if (target.length === 1) {

                data = target.data();

                if ($.type(data.text) !== 'string') {
                    data.text = target.html();
                }

            }

            var result = value != me.value;

            if (result) {

                var activeClass = me.activeClass;
                if (activeClass) {
                    menu.find('.' + activeClass).removeClass(activeClass);
                }

                if (target.size() === 1) {

                    me.value = value;

                    if (activeClass) {
                        target.addClass(activeClass);
                    }
                }
                else {
                    me.value = null;
                }

                if ($.isFunction(me.onChange)) {
                    me.onChange(data);
                }

            }

            if ($.isFunction(me.setText)) {
                me.setText(data.text || me.defaultText);
            }

            return result;

        },

        /**
         * 刷新数据
         *
         * @param {Object=} options
         * @property {Array=} options.data 数据
         * @property {string=} options.value 选中的值
         */
        refresh: function (options) {

            var me = this;
            var value = me.value;

            if (options) {

                var data = options.data;

                if (data) {
                    var html = '';
                    $.each(
                        data,
                        function (index, item) {
                            html += me.renderTemplate(me.itemTemplate, item);
                        }
                    );
                    me.menu.html(html);
                }

                // 传了值表示必须强制触发 change 事件
                if ('value' in options) {
                    value = options.value;
                    // 确保两者不一样
                    me.value = !value;
                }

            }

            me.setValue(value);

        },

        /**
         * 显示菜单
         */
        open: function () {
            this.popup.open();
        },

        /**
         * 隐藏菜单
         */
        close: function () {
            this.popup.close();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.menu.off(namespace);
            me.popup.dispose();

            me.popup =
            me.button =
            me.menu = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ComboBox.defaultOptions = {
        show: { },
        hide: { }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_combobox';

    /**
     * 创建 Popup 实例
     *
     * @inner
     * @param {ComboBox} comboBox
     * @return {Popup}
     */
    function createPopup(comboBox) {

        var main = comboBox.element || comboBox.button;
        var openClass = comboBox.openClass;

        var show = comboBox.show;
        var hide = comboBox.hide;

        if (!show.trigger) {
            show.trigger = 'click';
        }
        if (!hide.trigger) {
            hide.trigger = 'click';
        }

        return new Popup({
            element: comboBox.button,
            layer: comboBox.menu,
            scope: comboBox,
            show: show,
            hide: hide,
            onBeforeShow: comboBox.onBeforeShow,
            onBeforeHide: comboBox.onBeforeHide,
            onAfterShow: function () {
                if (openClass) {
                    main.addClass(openClass);
                }
                if ($.isFunction(comboBox.onAfterShow)) {
                    comboBox.onAfterShow();
                }
            },
            onAfterHide: function () {
                if (openClass) {
                    main.removeClass(openClass);
                }
                if ($.isFunction(comboBox.onAfterHide)) {
                    comboBox.onAfterHide();
                }
            }
        });
    }

    return ComboBox;

});
