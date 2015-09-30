/**
 * @file 下拉菜单
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     *
     * 元素自定义属性使用 data-text 和 data-value
     * 如果需要在点击菜单项获得其他数据，可在元素任意绑定 data-xxx
     * 当 change 事件触发时，会把所有 data 通过参数传入
     *
     */

    var Popup = require('../helper/Popup');

    var lifeUtil = require('../util/life');

    /**
     * 下拉菜单
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 如果需要容器包着 buttonElement 和 menuElement, 可以设置主元素
     *                                         menuActiveClass 会优先作用于它，否则作用于 buttonElement
     *
     * @property {jQuery} options.buttonElement 点击触发下拉菜单显示的元素
     * @property {jQuery} options.menuElement 下拉菜单元素
     *
     * @property {Array} options.data 下拉菜单的数据
     * @property {string=} options.menuTemplate 菜单模板
     * @property {Function} options.render 渲染模板的函数
     *
     * @property {string=} options.value 当前选中的值
     * @property {string=} options.defaultText 未选中值时默认显示的文本，如 请选择
     *
     * @property {string=} options.itemSelector
     * @property {string=} options.valueAttribute
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
     *
     * @property {Function} options.setText 设置选中菜单项文本
     */
    function ComboBox(options) {
        lifeUtil.init(this, options);
    }

    var proto = ComboBox.prototype;

    proto.type = 'ComboBox';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var buttonElement = me.option('buttonElement');
        var menuElement = me.option('menuElement');

        var popup = new Popup({
            opened: me.option('opened'),
            triggerElement: buttonElement,
            layerElement: menuElement,
            showLayerTrigger: me.option('showMenuTrigger'),
            showLayerDelay: me.option('showMenuDelay'),
            hideLayerTrigger: me.option('hideMenuTrigger'),
            hideLayerDelay: me.option('hideMenuDelay'),
            showLayerAnimation: function () {
                me.execute(
                    'showMenuAnimation',
                    {
                        menuElement: menuElement
                    }
                );
            },
            hideLayerAnimation: function () {
                me.execute(
                    'hideMenuAnimation',
                    {
                        menuElement: menuElement
                    }
                );
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });

        var menuActiveClass = me.option('menuActiveClass');
        var element = mainElement || buttonElement;

        var dispatchEvent = function (e, data) {
            if (e.target.tagName) {
                me.emit(e, data);
            }
        };

        popup
        .before('open', dispatchEvent)
        .after('open', function (e, data) {
            if (menuActiveClass) {
                element.addClass(menuActiveClass);
            }
            dispatchEvent(e, data);
        })
        .before('close', dispatchEvent)
        .after('close', function (e, data) {
            if (menuActiveClass) {
                element.removeClass(menuActiveClass);
            }
            dispatchEvent(e, data);
        });

        var itemSelector = me.option('itemSelector');
        if (!itemSelector) {
            me.error('itemSelector is missing.');
        }

        var valueAttribute = me.option('valueAttribute');
        if (!valueAttribute) {
            me.error('valueAttribute is missing.');
        }

        menuElement.on(
            'click' + me.namespace(),
            itemSelector,
            function (e) {

                var value = $(this).attr(valueAttribute);
                if (!value) {
                    me.error('value is not found by valueAttribute.');
                }

                me.set('value', value);
                me.close();

                e.type = 'select';
                me.emit(e);

            }
        );


        me.inner({
            main: mainElement,
            popup: popup
        });

        me.set({
            data: me.option('data'),
            value: me.option('value')
        });

    };

    proto.render = function () {

        var me = this;

        me.option('menuElement').html(
            me.execute(
                'render',
                [
                    me.get('data'),
                    me.option('menuTemplate')
                ]
            )
        );

    };

    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
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

        me.option('menuElement').off(
            me.namespace()
        );

        me.inner('popup').dispose();

    };

    lifeUtil.extend(proto);

    ComboBox.propertyUpdater = {

        data: function (data) {
            this.render();
        },

        value: function (value) {

        }

    };

    ComboBox.propertyUpdater.data =
    ComboBox.propertyUpdater.value = function (newValue, oldValue, changes) {

        var me = this;
        var menuElement = me.option('menuElement');
        var value = me.get('value');

        var item;
        var itemActiveClass = me.option('itemActiveClass');

        if (changes.data) {
            this.render();
        }
        else if (changes.value && itemActiveClass) {
            item = findItem(menuElement, '[' + ATTR_VALUE + '=' + changes.value.oldValue + ']');
            if (item) {
                item.element.removeClass(itemActiveClass);
            }
        }

        if (value !== null) {
            item = findItem(menuElement, '[' + ATTR_VALUE + '=' + value + ']');
            if (item && itemActiveClass) {
                item.element.addClass(itemActiveClass);
            }
        }

        me.execute(
            'setText',
            {
                buttonElement: me.option('buttonElement'),
                text: (item && item.text) || me.option('defaultText')
            }
        );

    };

    ComboBox.propertyValidator = {

        value: function (value) {

            if (value == null) {
                var me = this;
                var menuElement = me.option('menuElement');
                var itemSelector = '.' + me.option('itemActiveClass');
                var itemData = findItem(menuElement, itemSelector);
                if (itemData) {
                    value = itemData.value;
                }
            }

            return value;

        }
    };

    function findItem(menuElement, itemSelector) {

        var target;

        try {
            target = menuElement.find(itemSelector);
        }
        catch (e) { }

        if (target && target.length === 1) {

            var data = target.data();

            data.element = target;

            if (data.text == null) {
                data.text = target.html();
            }

            return data;
        }

    }


    return ComboBox;

});
