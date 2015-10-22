/**
 * @file 下拉菜单
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toString = require('../function/toString');

    var Popup = require('../helper/Popup');

    var lifeUtil = require('../util/life');

    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery=} options.mainElement 如果需要容器包着 buttonElement 和 menuElement, 可以设置主元素
     *                                         menuActiveClass 会优先作用于它，否则作用于 buttonElement
     *
     * @property {jQuery} options.buttonElement 点击触发下拉菜单显示的元素
     * @property {jQuery} options.menuElement 下拉菜单元素
     * @property {string=} options.menuTemplate 菜单模板
     *
     * @property {Array} options.data 下拉菜单的数据
     * @property {Function} options.render 渲染模板的函数
     *
     * @property {string=} options.value 当前选中的值
     * @property {string=} options.defaultText 未选中值时默认显示的文本，如 请选择
     *
     * @property {string=} options.itemSelector
     * @property {string=} options.textAttribute
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

        me.initStruct();

        var mainElement = me.option('mainElement');

        var buttonElement = me.option('buttonElement');
        var menuElement = me.option('menuElement');

        var popup = new Popup({
            triggerElement: buttonElement,
            layerElement: menuElement,
            showLayerTrigger: me.option('showMenuTrigger'),
            showLayerDelay: me.option('showMenuDelay'),
            hideLayerTrigger: me.option('hideMenuTrigger'),
            hideLayerDelay: me.option('hideMenuDelay'),
            showLayerAnimation: function (options) {
                me.execute(
                    'showMenuAnimation',
                    {
                        menuElement: menuElement
                    }
                );
            },
            hideLayerAnimation: function (options) {
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

        popup.on('dispatch', function (e, data) {
            me.emit(data.event, data.data, true);
        });

        var menuActiveClass = me.option('menuActiveClass');
        if (menuActiveClass) {
            var element = mainElement || buttonElement;
            me
            .after('open', function () {
                element.addClass(menuActiveClass);
            })
            .after('close', function () {
                element.removeClass(menuActiveClass);
            });
        }

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
                if ($.type(value) !== 'string') {
                    me.error('value is not found by valueAttribute.');
                }

                me.set('value', value);
                me.close(e);

                e.type = 'select';
                me.emit(e, true);

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

        me.renderWith(
            me.get('data'),
            me.option('menuTemplate'),
            me.option('menuElement')
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

    proto._open = function (e) {
        if (this.is('opened')) {
            return false;
        }
        return dispatchEvent(e);
    };

    proto.open_ = dispatchEvent;


    proto.close = function () {
        this.state('opened', false);
    };

    proto._close = function (e) {
        if (!this.is('opened')) {
            return false;
        }
        return dispatchEvent(e);
    };

    proto.close_ = dispatchEvent;


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('popup').dispose();

        me.option('menuElement').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

    ComboBox.propertyUpdater = { };

    ComboBox.propertyUpdater.data =
    ComboBox.propertyUpdater.value = function (newValue, oldValue, changes) {

        var me = this;

        var menuElement = me.option('menuElement');
        var itemActiveClass = me.option('itemActiveClass');
        var textAttribute = me.option('textAttribute');
        var valueAttribute = me.option('valueAttribute');


        if (changes.data) {
            this.render();
        }
        else if (changes.value && itemActiveClass) {
            menuElement
                .find('.' + itemActiveClass)
                .removeClass(itemActiveClass);
        }


        var text;
        var value = toString(me.get('value'), null);

        if (value != null && value !== '') {

            var itemElement = menuElement.find(
                '[' + valueAttribute + '=' + value + ']'
            );

            switch (itemElement.length) {
                case 1:
                    if (itemActiveClass) {
                        itemElement.addClass(itemActiveClass);
                    }

                    text = itemElement.attr(textAttribute);
                    if (text == null) {
                        text = itemElement.html();
                    }

                    break;
                case 0:
                    break;
                default:
                    me.error('value repeated.');
                    break;
            }

        }

        me.execute(
            'setText',
            {
                buttonElement: me.option('buttonElement'),
                text: text || me.option('defaultText')
            }
        );

    };

    ComboBox.propertyValidator = {

        value: function (value) {

            var me = this;

            var itemActiveClass = me.option('itemActiveClass');
            if (value == null && itemActiveClass) {
                var itemElement = me.option('menuElement').find('.' + itemActiveClass);
                if (itemElement.length === 1) {
                    value = itemElement.attr(
                        me.option('valueAttribute')
                    );
                }
            }

            return value;

        }
    };

    ComboBox.stateUpdater = {

        opened: function (opened) {
            this.inner('popup').state('opened', opened);
        }

    };

    function dispatchEvent(e) {
        if (e) {
            return {
                dispatch: true
            };
        }
    }


    return ComboBox;

});
