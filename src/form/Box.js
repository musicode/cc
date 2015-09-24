/**
 * @file 单选和复选框
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     *
     * ## 结构
     *
     * 复选框的结构通常如下：
     *
     * <label>
     *     <input type="radio" name="city" /> 北京
     * </label>
     *
     * 好处是点击 `北京` 或 复选框，都能选中
     *
     * ## 默认选中
     *
     * 如果需要默认选中，input 可以设置为 checked，如下：
     *
     * <input type="radio" name="city" checked="checked" />
     *
     * ## 默认禁用
     *
     * 如果需要默认禁用，input 可以设置为 disabled，如下：
     *
     * <input type="radio" name="city" disabled="disabled" />
     *
     * ## 特殊性
     *
     * 单选框不同于复选框的一个地方是：
     *
     * 不能处理一个单选框，而是处理 name 属性相同的一组单选框
     *
     * 所以 Radio 必须和 BoxGroup 一起使用
     */

    var debounce = require('../function/debounce');
    var setAttribute = require('../function/attr');

    var lifeCycle = require('../util/lifeCycle');


    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     * @property {boolean=} options.toggle 是否可反选
     */
    function Box(options) {
        lifeCycle.init(this, options);
    }

    var proto = Box.prototype;

    proto.type = 'Box';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var mainTemplate = me.option('mainTemplate');
        if (mainTemplate) {
            mainElemen.html(mainTemplate);
        }

        mainElement.on(
            'click' + me.namespace(),
            // 有时候会连续触发两次，因此用 debounce 解决
            debounce(
                function (e) {

                    if (me.is('disabled')) {
                        return;
                    }

                    var toggle = me.option('toggle');

                    var checked = me.is('checked');
                    if (checked) {
                        if (toggle) {
                            checked = false;
                        }
                    }
                    else {
                        checked = true;
                    }

                    me.state('checked', checked);

                },
                50
            )
        );

        var nativeElement = mainElement.find(':radio,:checkbox');
        if (nativeElement.length !== 1) {
            nativeElement = null;
        }

        me.inner({
            main: mainElement,
            native: nativeElement
        });

        me.set({
            name: me.option('name'),
            value: me.option('value')
        });

        me.state({
            checked: me.option('checked'),
            disabled: me.option('disabled')
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);


    function setBoxAttribute(instance, name, value) {

        $.each(
            [
                instance.inner('main'),
                instance.inner('native')
            ],
            function (index, element) {
                setAttribute(
                    element,
                    name,
                    value
                );
            }
        );

    }

    function getBoxAttribute(instance, name) {

        var result;

        $.each(
            [
                instance.inner('main'),
                instance.inner('native')
            ],
            function (index, element) {
                result = element && element.attr(name);
                if (result != null) {
                    return false;
                }
            }
        );

        return result;

    }

    function setBoxClass(instance, name, action) {

        var className = instance.option(name);
        if (className) {
            instance.inner('main')[ action ](
                className
            );
        }

    }





    Box.propertyUpdater = {

        name: function (name) {
            setBoxAttribute(this, 'name', name);
        },

        value: function (value) {
            setBoxAttribute(this, 'value', value);
        }

    };

    Box.propertyValidator = {

        name: function (name) {

            if ($.type(name) !== 'string') {

                name = getBoxAttribute(this, 'name');

                if ($.type(name) !== 'string') {
                    throw new Error('[CC Error] form/Box mainElement must have the name attribute.')
                }

            }

            return name;

        },

        value: function (value) {

            switch ($.type(value)) {
                case 'string':
                case 'number':
                    return value;
            }

            return getBoxAttribute(this, 'value') || '';

        }

    };

    Box.stateUpdater = {

        checked: function (checked) {

            setBoxAttribute(this, 'checked', checked);
            setBoxClass(this, 'checkedClass', checked ? 'addClass' : 'removeClass');

        },

        disabled: function (disabled) {

            setBoxAttribute(this, 'disabled', disabled);
            setBoxClass(this, 'disabledClass', disabled ? 'addClass' : 'removeClass');

        }

    };

    Box.stateValidator = {

        checked: function (checked) {

            if ($.type(checked) !== 'boolean') {
                checked = getBoxAttribute(this, 'checked') === 'checked';
            }

            return checked;

        },

        disabled: function (disabled) {

            if ($.type(disabled) !== 'boolean') {
                disabled = getBoxAttribute(this, 'disabled') === 'disabled';
            }

            return disabled;

        }

    }


    return Box;

});