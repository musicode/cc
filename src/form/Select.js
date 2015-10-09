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
    var lifeUtil = require('../util/life');
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
     * @property {string=} options.labelSelector 按钮上显示文本的元素
     * @property {string=} options.menuSelector 下拉菜单元素
     * @property {string=} options.menuTemplate 下拉菜单模板
     *
     * @property {string=} options.itemActiveClass 菜单项选中状态的 class，可提升用户体验
     * @property {string=} options.menuActiveClass 菜单展开状态的 class
     *
     * @property {string=} options.showMenuTrigger 显示的触发方式
     * @property {number=} options.showMenuDelay 显示延时
     * @property {Function=} options.showMenuAnimation 显示动画
     *
     * @property {string=} options.hideMenuTrigger 隐藏的触发方式
     * @property {number=} options.hideMenuDelay 隐藏延时
     * @property {Function=} options.hideMenuAnimation 隐藏动画
     */
    function Select(options) {
        lifeUtil.init(this, options);
    }

    var proto = Select.prototype;

    proto.type = 'Select';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');

        var combobox = new ComboBox({
            mainElement: mainElement,
            data: me.option('data'),
            value: me.option('value'),
            defaultText: me.option('defaultText'),
            buttonElement: mainElement.find(me.option('buttonSelector')),
            menuElement: mainElement.find(me.option('menuSelector')),
            menuTemplate: me.option('menuTemplate'),
            renderSelector: me.option('renderSelector'),
            renderTemplate: me.option('renderTemplate'),
            showMenuTrigger: me.option('showMenuTrigger'),
            showMenuDelay: me.option('showMenuDelay'),
            hideMenuTrigger: me.option('hideMenuTrigger'),
            hideMenuDelay: me.option('hideMenuDelay'),
            itemSelector: me.option('itemSelector'),
            itemActiveClass: me.option('itemActiveClass'),
            menuActiveClass: me.option('menuActiveClass'),
            textAttribute: me.option('textAttribute'),
            valueAttribute: me.option('valueAttribute'),
            showMenuAnimation: function (options) {
                me.execute('showMenuAnimation', options);
            },
            hideMenuAnimation: function (options) {
                me.execute('hideMenuAnimation', options);
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
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });


        var dispatchEvent = function (e, data) {
            if (data && data.event) {
                me.emit(e, data);
            }
        };

        combobox
        .before('open', dispatchEvent)
        .after('open', dispatchEvent)
        .before('close', dispatchEvent)
        .after('close', dispatchEvent);


        var nativeElement = common.findNative(me, 'input:hidden');

        // 模拟 focus/blur，便于表单验证
        me
        .after('open', function () {
            nativeElement.trigger('focusin');
        })
        .after('close', function () {
            nativeElement.trigger('focusout');
        });


        me.inner({
            main: mainElement,
            native: nativeElement,
            combobox: combobox
        });

        me.set({
            data: me.option('data'),
            name: me.option('name'),
            value: me.option('value')
        });

    };


    proto.open = function () {
        this.state('opened', true);
    };

    proto._open = function () {
        if (this.is('opened')) {
            return false;
        }
    };


    proto.close = function () {
        this.state('opened', false);
    };

    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('combobox').dispose();

    };

    lifeUtil.extend(proto);

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

    Select.stateUpdater = {
        opened: function (opened) {
            this.inner('combobox').state('opened', opened);
        }
    };


    return Select;

});
