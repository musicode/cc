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
     */

    var ComboBox = require('../ui/ComboBox');

    var lifeCycle = require('../function/lifeCycle');

    /**
     * 下拉菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 主元素，结构必须完整
     * @property {string} options.name
     *
     * @property {Array=} options.data 下拉菜单的数据
     * @property {string=} options.value 当前选中的值
     *
     * @property {string=} options.buttonSelector 点击触发下拉菜单显示的元素
     * @property {string=} options.menuSelector 下拉菜单元素
     * @property {string=} options.labelSelector 按钮上显示文本的元素
     *
     * @property {string=} options.itemActiveClass 菜单项选中状态的 class，可提升用户体验
     * @property {string=} options.menuActiveClass 菜单展开状态的 class
     *
     * @property {string=} options.showMenuTrigger 显示的触发方式
     * @property {number=} options.showMenuDelay 显示延时
     * @property {Function=} options.showMenuAnimate 显示动画
     *
     * @property {string=} options.hideMenuTrigger 隐藏的触发方式
     * @property {number=} options.hideMenuDelay 隐藏延时
     * @property {Function=} options.hideMenuAnimate 隐藏动画
     *
     * @property {Function=} options.setText 把选中的菜单项文本写入到按钮上
     */
    function Select(options) {
        lifeCycle.init(this, options);
    }

    var proto = Select.prototype;

    proto.type = 'Select';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');





        var value = me.option('value');

        var html = '<input type="hidden" name="' + me.option('name') + '"';
        if (value != null) {
            html += ' value="' + value + '"';
        }
        if (mainElement.attr('required')) {
            html += ' required';
        }

        html += ' />';

        var inputElement = $(html);

        mainElement.append(inputElement);





        var combobox = new ComboBox({
            mainElement: mainElement,
            buttonElement: mainElement.find(me.option('buttonSelector')),
            menuElement: mainElement.find(me.option('menuSelector')),
            showMenuTrigger: me.option('showMenuTrigger'),
            showMenuDelay: me.option('showMenuDelay'),
            hideMenuTrigger: me.option('hideMenuTrigger'),
            hideMenuDelay: me.option('hideMenuDelay'),
            defaultText: me.option('defaultText'),
            menuTemplate: me.option('menuTemplate'),
            itemActiveClass: me.option('itemActiveClass'),
            menuActiveClass: me.option('menuActiveClass'),
            showMenuAnimate: function (options) {
                me.execute('showMenuAnimate', options);
            },
            hideMenuAnimate: function (options) {
                me.execute('hideMenuAnimate', options);
            },
            renderTemplate: function (data, tpl) {
                return me.execute('renderTemplate', [ data, tpl ]);
            },
            setText: function (options) {
                var labelSelector = me.option('labelSelector');
                mainElement.find(labelSelector).html(options.text);
            },
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                }
            }
        });

        combobox
        .after('open', function () {
            mainElement.trigger('focusin');
        })
        .after('close', function () {
            mainElement.trigger('focusout');
        });




        me.inner({
            main: mainElement,
            input: inputElement,
            combobox: combobox
        });

        me.set({
            data: me.option('data'),
            value: me.option('value')
        });

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('combobox').dispose();

    };

    lifeCycle.extend(proto);

    Select.defaultOptions = {
        defaultText: '请选择',
        buttonSelector: '.btn-default',
        menuSelector: '.dropdown-menu',
        labelSelector: '.btn-default span',
        itemActiveClass: 'active',
        menuActiveClass: 'open',
        showMenuTrigger: 'click',
        hideMenuTrigger: 'click',
        showMenuAnimate: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimate: function (options) {
            options.menuElement.hide();
        },
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

        }
    };

    Select.propertyUpdater = { };
    Select.propertyUpdater.data =
    Select.propertyUpdater.value = function (newValue, oldValue, changes) {

        var me = this;

        var properties = { };

        var valueChange = changes.value;
        if (valueChange) {

            var value = valueChange.newValue;

            value = value == null ? '' : value;

            me.inner('input').val(value);

            properties.value = value;

        }

        var dataChange = changes.data;
        if (dataChange) {
            properties.data = dataChange.newValue;
        }

        me.inner('combobox').set(properties);

    };


    return Select;

});
