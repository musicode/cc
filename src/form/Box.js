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
     * 不支持原生 radio 和 checkbox，如下：
     *
     * <label>
     *     <input type="radio" name="name" value="value" checked disabled />
     *     text
     * </label>
     *
     * 只支持模拟实现，如下：
     *
     * <label name="name" name="name" value="value" checked disabled>
     *     <i class="icon icon-radio"></i>
     *     text
     * </label>
     *
     *
     * 理由如下：
     *
     * 1. 原生 box 必须加 name，在设计表单验证时，表单字段的选择器是 [name]
     *
     *    通过选择器找到原生 box，一些定位逻辑其实不太好处理（因为它太小了）
     *
     * 2. 如果支持原生 box，那么 mainElement 是否要加这些 attribute 呢？
     *
     *    如果加，两个元素（mainElement 和 checkbox/radio）有相同的 attribute
     *    如果不加，从 name 对应表单字段来讲，语义上不是很好
     *
     * 3. 从用户体验一致性来讲，肯定是模拟实现更好看啊！
     *
     *
     *
     * ## 特殊性
     *
     * 单选框不同于复选框的一个地方是：
     *
     * 不能处理一个单选框，而是处理 name 属性相同的一组单选框
     *
     * 所以单选框必须和 BoxGroup 一起使用
     *
     *
     */

    var debounce = require('../function/debounce');
    var setAttribute = require('../function/attr');

    var lifeCycle = require('../util/lifeCycle');


    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {string=} options.name
     * @property {string=} options.value
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

        me.initStructure();

        var mainElement = me.option('mainElement');
        var nativeElement = mainElement.find(':radio,:checkbox');
        if (nativeElement.length > 0) {
            throw new Error('[CC Error] form/Box mainElement 不能包含 radio 或 checkbox.');
        }

        mainElement.on(
            'click' + me.namespace(),
            // 有时候会连续触发两次，因此用 debounce 解决
            debounce(
                function (e) {

                    if (me.is('disabled')) {
                        return;
                    }

                    var checked = me.is('checked');
                    if (checked) {
                        if (me.option('toggle')) {
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



        me.inner({
            main: mainElement
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

        setAttribute(
            instance.inner('main'),
            name,
            value
        );

    }

    function getBoxAttribute(instance, name) {

        return instance.inner('main').attr(name);

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

            setBoxClass(
                this,
                'checkedClass',
                checked ? 'addClass' : 'removeClass'
            );

        },

        disabled: function (disabled) {

            setBoxAttribute(this, 'disabled', disabled);

            setBoxClass(
                this,
                'disabledClass',
                disabled ? 'addClass' : 'removeClass'
            );

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