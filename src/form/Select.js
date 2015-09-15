/**
 * @file 模拟 select
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * select 和 input 不同
     *
     * 不要在页面写一堆 <select>，然后再替换，这样会产生没必要的开销
     *
     * 使用约定如下：
     *
     * 菜单项 value: data-value="1"
     * 菜单项 text:  date-text="xxx" 或 innerHTML，优先使用 data-text
     *
     * # 事件列表
     *
     * 1. change
     *
     */

    var ComboBox = require('../ui/ComboBox');

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     * 下拉菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.element 主元素
     * @property {string} options.name
     *
     * @property {Array=} options.data 下拉菜单的数据
     * @property {string=} options.value 当前选中的值
     *
     * @property {string=} options.buttonSelector 点击触发下拉菜单显示的元素
     * @property {string=} options.menuSelector 下拉菜单元素
     * @property {string=} options.labelSelector 按钮上显示文本的元素
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
     * @property {Function=} options.setText 把选中的菜单项文本写入到按钮上
     */
    function Select(options) {
        return lifeCycle.init(this, options);
    }

    var proto = Select.prototype;

    proto.type = 'Select';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;
        var element = me.element;


        var html = '<input type="hidden" name="' + me.name + '"';
        if (me.value != null) {
            html += ' value="' + me.value + '"';
        }
        if (element.attr('required')) {
            html += ' required';
        }
        html += ' />';

        var input =
        me.input = $(html);

        element.append(input);


        me.comboBox = new ComboBox({
            element: element,
            button: element.find(me.buttonSelector),
            menu: element.find(me.menuSelector),
            data: me.data,
            value: me.value,
            show: me.show,
            hide: me.hide,
            defaultText: me.defaultText,
            template: me.template,
            renderTemplate: me.renderTemplate,
            activeClass: me.activeClass,
            openClass: me.openClass,
            setText: $.proxy(me.setText, me),
            onChange: function (e, data) {

                me.setValue(
                    data.value,
                    {
                        data: data,
                        from: FROM_CALENDAR
                    }
                );

            },
            onAfterShow: function () {
                element.trigger('focusin');
            },
            onAfterHide: function () {
                element.trigger('focusout');
            }
        });

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

        options = options || { };

        if (setValue(me, 'value', value, options, options.data)) {

            me.input.val(
                value == null ? '' : value
            );

            if (options.from !== FROM_CALENDAR) {
                me.comboBox.setValue(
                    value,
                    {
                        silence: true
                    }
                );
            }

        }

    };

    /**
     * 刷新数据
     *
     * @param {Object} options
     * @property {Array} options.data 数据
     * @property {index=} options.value 选中的值
     */
    proto.refresh = function (options) {
        this.comboBox.refresh(options);
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.comboBox.dispose();

        me.input =
        me.element =
        me.comboBox = null;

    };

    jquerify(proto);

    var FROM_CALENDAR = 'calendar';

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Select.defaultOptions = {
        defaultText: '请选择',
        buttonSelector: '.btn-default',
        menuSelector: '.dropdown-menu',
        labelSelector: '.btn-default span',
        activeClass: 'active',
        openClass: 'open',
        renderTemplate: function (data) {

            var html = [ ];

            $.each(
                data,
                function (index, item) {

                    var data = [ ];

                    $.each(
                        item,
                        function (key, value) {
                            if (key !== 'text' && value != null) {
                                data.push(
                                    'data-' + key + '="' + value + '"'
                                );
                            }
                        }
                    );

                    html.push(
                        '<li ' + data.join(' ') + '>' + item.text + '</li>'
                    );
                }
            );

            return html.join('');

        },
        setText: function (text) {
            this.element.find(this.labelSelector).html(text);
        }
    };


    return Select;

});
