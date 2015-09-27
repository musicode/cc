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
    var lifeCycle = require('../util/lifeCycle');
    var common = require('./common');

    /**
     * 下拉菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 主元素，结构必须完整
     *
     * @property {string=} options.name
     * @property {string=} options.value 当前选中的值
     *
     * @property {Array=} options.data 下拉菜单的数据
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
     */
    function Select(options) {
        lifeCycle.init(this, options);
    }

    var proto = Select.prototype;

    proto.type = 'Select';

    proto.init = function () {

        var me = this;

        me.initStructure();

        var mainElement = me.option('mainElement');

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
            render: function (data, tpl) {
                return me.execute('render', [ data, tpl ]);
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

        // 模拟 focus/blur，便于表单验证
        combobox
        .after('open', function () {
            mainElement.trigger('focusin');
        })
        .after('close', function () {
            mainElement.trigger('focusout');
        });




        me.inner({
            main: mainElement,
            native: common.findNative(me, 'input:hidden'),
            combobox: combobox
        });

        me.set({
            data: me.option('data'),
            name: me.option('name'),
            value: me.option('value')
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('combobox').dispose();

    };

    lifeCycle.extend(proto);

    Select.defaultOptions = {

    };

    Select.propertyUpdater = {

        name: function (name) {
            common.prop(this, 'name', name);
        }

    };

    Select.propertyUpdater.data =
    Select.propertyUpdater.value = function (newValue, oldValue, changes) {

        var me = this;

        var properties = { };

        var valueChange = changes.value;
        if (valueChange) {
            var value = valueChange.newValue;
            common.prop(me, 'value', value);
            properties.value = value;
        }

        var dataChange = changes.data;
        if (dataChange) {
            properties.data = dataChange.newValue;
        }

        me.inner('combobox').set(properties);

        return false;

    };

    Select.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        },

        value: function (value) {
            return common.validateValue(this, value);
        }

    };


    return Select;

});
