/**
 * @file 单选和复选框
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     *
     * 单选框不同于复选框的一个地方是：
     *
     * 不能处理一个单选框，而是处理 name 属性相同的一组单选框
     *
     * 所以单选框必须和 BoxGroup 一起使用
     */

    var debounce = require('../function/debounce');
    var lifeUtil = require('../util/life');
    var common = require('./common');

    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {string=} options.name
     * @property {string=} options.value
     * @property {boolean=} options.checked 是否选中
     * @property {boolean=} options.disabled 是否禁用
     * @property {boolean=} options.toggle 是否可反选
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     */
    function Box(options) {
        lifeUtil.init(this, options);
    }

    var proto = Box.prototype;

    proto.type = 'Box';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var toggle = me.option('toggle');

        mainElement.on(
            'click' + me.namespace(),
            // 有时候会连续触发两次，因此用 debounce 解决
            debounce(
                function () {

                    if (me.is('disabled')) {
                        return;
                    }

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



        me.inner({
            main: mainElement,
            native: common.findNative(me, toggle ? 'input[type="checkbox"]' : 'input[type="radio"]')
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
        lifeUtil.dispose(this);
    };

    lifeUtil.extend(proto);


    Box.propertyUpdater = {

        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            common.prop(this, 'value', value);
        }

    };

    Box.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            return common.validateValue(this, value);
        }

    };

    Box.stateUpdater = {

        checked: function (checked) {

            common.prop(this, 'checked', checked);

            common.setClass(
                this,
                'checkedClass',
                checked ? 'add' : 'remove'
            );

        },

        disabled: function (disabled) {

            common.prop(this, 'disabled', disabled);

            common.setClass(
                this,
                'disabledClass',
                disabled ? 'add' : 'remove'
            );

        }

    };

    Box.stateValidator = {

        checked: function (checked) {

            if ($.type(checked) !== 'boolean') {
                checked = common.prop(this, 'checked');
            }

            return checked;

        },

        disabled: function (disabled) {

            if ($.type(disabled) !== 'boolean') {
                disabled = common.prop(this, 'disabled');
            }

            return disabled;

        }

    };


    return Box;

});