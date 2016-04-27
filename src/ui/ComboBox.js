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
     *                                         menuActiveClass 会优先作用于它，否则作用于 menuElement
     *
     * @property {jQuery} options.buttonElement 按钮元素
     * @property {jQuery} options.menuElement 下拉菜单元素
     * @property {string=} options.menuTemplate 菜单模板
     *
     * @property {Array.<Object>=} options.data 渲染下拉菜单的数据
     * @property {Function} options.render 渲染模板的函数
     *
     * @property {string=} options.value 当前选中的值
     * @property {string} options.defaultText 未选中值时默认显示的文本，如 请选择
     *
     * @property {string} options.itemSelector 菜单项选择器
     * @property {string=} options.textAttribute 菜单项文本属性名称
     * @property {string} options.valueAttribute 菜单项值属性名称
     *
     * @property {string=} options.itemActiveClass 菜单项选中状态的 className，可提升用户体验
     * @property {string=} options.menuActiveClass 菜单展开状态的 className
     *
     * @property {string} options.showMenuTrigger 显示下拉菜单的触发方式
     * @property {number=} options.showMenuDelay 显示下拉菜单的触发延时
     * @property {Function} options.showMenuAnimation 显示下拉菜单的动画
     *
     * @property {string} options.hideMenuTrigger 隐藏下拉菜单的触发方式
     * @property {number=} options.hideMenuDelay 隐藏下拉菜单的延时
     * @property {Function} options.hideMenuAnimation 隐藏下拉菜单的动画
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


        var buttonElement = me.option('buttonElement');
        var menuElement = me.option('menuElement');

        var popup = new Popup({
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
            watchSync: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });

        popup.on('dispatch', function (e, data) {
            var event = me.emit(e.originalEvent, data);
            me.dispatch(event, data);
        });

        var mainElement = me.option('mainElement');
        var menuActiveClass = me.option('menuActiveClass');
        if (menuActiveClass) {
            var element = mainElement || menuElement;
            popup
                .after('open', function () {
                    element.addClass(menuActiveClass);
                })
                .after('close', function () {
                    element.removeClass(menuActiveClass);
                });
        }

        var itemSelector = me.option('itemSelector');
        var valueAttribute = me.option('valueAttribute');

        menuElement.on(
            'click' + me.namespace(),
            itemSelector,
            function (e) {

                if (me.is('opened')) {
                    me.close(e);
                }

                if (e.isDefaultPrevented()) {
                    return;
                }

                me.set(
                    'value',
                    $(this).attr(valueAttribute)
                );

                var event = $.Event(e.originalEvent);
                event.type = 'select';

                me.dispatch(
                    me.emit(event)
                );

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

    proto.close = function () {
        this.state('opened', false);
    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('popup').dispose();

        me.option('menuElement').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto, [ 'open', 'close' ]);

    ComboBox.propertyUpdater = { };

    ComboBox.propertyUpdater.data =
    ComboBox.propertyUpdater.value = function (newValue, oldValue, change) {

        var me = this;

        var menuElement = me.option('menuElement');
        var itemActiveClass = me.option('itemActiveClass');
        var textAttribute = me.option('textAttribute');
        var valueAttribute = me.option('valueAttribute');


        if (change.data) {
            this.render();
        }
        else if (change.value && itemActiveClass) {
            menuElement
                .find('.' + itemActiveClass)
                .removeClass(itemActiveClass);
        }


        var text;
        var value = toString(me.get('value'), null);

        if (value != null) {

            var getText = function (element) {
                text = element.attr(textAttribute);
                if (text == null) {
                    text = element.html();
                }
                return text;
            };

            if (value !== '') {
                var itemElement = menuElement.find(
                    '[' + valueAttribute + '="' + value + '"]'
                );

                switch (itemElement.length) {
                    case 1:
                        if (itemActiveClass) {
                            itemElement.addClass(itemActiveClass);
                        }
                        text = getText(itemElement);
                        break;
                    case 0:
                        break;
                    default:
                        me.error('value repeated.');
                        break;
                }
            }
            else {
                menuElement
                    .find('[' + valueAttribute + ']')
                    .each(function () {
                        var target = $(this);
                        var value = target.attr(valueAttribute);
                        if (value === '') {
                            text = getText(target);
                            return false;
                        }
                    });
            }

        }

        me.execute(
            'setText',
            {
                buttonElement: me.option('buttonElement'),
                text: text || me.option('defaultText')
            }
        );

        return false;

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
            var popup = this.inner('popup');
            if (opened) {
                popup.open();
            }
            else {
                popup.close();
            }
        }
    };


    return ComboBox;

});
