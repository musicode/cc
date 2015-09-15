/**
 * @file 下拉菜单
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     *
     * 元素自定义属性使用 data-text 和 data-value
     * 如果需要在点击菜单项获得其他数据，可在元素任意绑定 data-xxx
     * 当 onChange 事件触发时，会把所有 data 通过参数传入
     *
     * # 事件列表
     *
     * 1. beforeShow - 返回 false 可阻止打开
     * 2. afterShow
     * 3. beforeHide - 返回 false 可阻止关闭
     * 4. afterHide
     * 5. change - 选中菜单项触发
     */

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var setValue = require('../function/setValue');

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
     * @property {string=} options.template 菜单模板
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
     * @property {Function} options.setText 设置选中菜单项文本
     * @argument {string} options.onText.text
     */
    function ComboBox(options) {
        return lifeCycle.init(this, options);
    }

    var proto = ComboBox.prototype;

    proto.type = 'ComboBox';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var button = me.button;
        var menu = me.menu;

        var context = me.context || me;

        me.popup = new Popup({
            element: button,
            layer: menu,
            show: me.show,
            hide: me.hide,
            context: context
        });

        var openClass = me.openClass;
        if (openClass) {

            var mainElement = me.element || button;

            context
            .on(
                'afterShow' + namespace,
                function () {
                    mainElement.addClass(openClass);
                }
            )
            .on(
                'afterHide' + namespace,
                function () {
                    mainElement.removeClass(openClass);
                }
            );

        }

        var value = me.value;

        if (value == null) {
            // 通过 DOM 取值
            var item = menu.find('.' + me.activeClass);
            if (item.length === 1) {
                value = item.data('value');
            }
        }

        // 不论是直接传入 value 或是通过 DOM 获取的 value
        // 都不需要触发 onChange 事件
        // 因为初始化触发事件会带来同步问题
        // 如果非要触发，可以在初始化后调用 setValue() 手动触发

        me.refresh(
            {
                data: me.data,
                value: value
            },
            {
                silence: true
            }
        );

        menu.on(
            'click' + namespace,
            '[data-value]',
            function (e) {

                me.setValue(
                    $(this).data('value')
                );

                me.close();

            }
        );

    };

    /**
     * 获取当前选中的值
     *
     * @return {string}
     */
    proto.getValue = function () {
        return this.value;
    };

    /**
     * 设置当前选中的值
     *
     * @param {string} value
     * @param {Object=} options 选项
     * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
     * @property {boolean=} options.silence 是否不触发 change 事件
     */
    proto.setValue = function (value, options) {

        var me = this;

        var data = { };

        // 检查 value 有效性
        var menu = me.menu;
        var target = menu.find('[data-value="' + value + '"]');

        if (target.length === 1) {

            data = target.data();

            if (data.text == null) {
                data.text = target.html();
            }

        }
        else {
            value = null;
        }

        if (setValue(me, 'value', value, data)) {

            var activeClass = me.activeClass;

            if (activeClass) {

                menu
                .find('.' + activeClass)
                .removeClass(activeClass);

                if (value != null) {
                    target.addClass(activeClass);
                }

            }

        }

        if ($.isFunction(me.setText)) {
            me.setText.call(
                me.context || me,
                data.text || me.defaultText
            );
        }

    };

    /**
     * 刷新数据
     *
     * @param {Object=} options
     * @property {Array=} options.data 数据
     * @property {string=} options.value 选中的值
     */
    proto.refresh = function (options) {

        var me = this;
        var value = me.value;

        var setOptions = arguments[1] || { };

        if (options) {

            var data = options.data;

            if (data) {

                me.menu.html(

                    me.renderTemplate.call(
                        me.context || me,
                        data,
                        me.template
                    )

                );

            }

            // 传了值表示必须强制触发 change 事件
            if ('value' in options) {

                value = options.value;

                setOptions.force = true;

            }

        }

        me.setValue(value, setOptions);

    };

    /**
     * 显示菜单
     */
    proto.open = function () {
        this.popup.open();
    };

    /**
     * 隐藏菜单
     */
    proto.close = function () {
        this.popup.close();
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.menu.off(namespace);
        me.popup.dispose();

        me.popup =
        me.element =
        me.button =
        me.menu = null;

    };

    jquerify(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    ComboBox.defaultOptions = {
        show: {
            trigger: 'click'
        },
        hide: {
            trigger: 'click'
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_combobox';


    return ComboBox;

});
