/**
 * @file 模拟 <input type="radio" />
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var debounce = require('../function/debounce');

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


    /**
     * 单选框构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     */
    function Radio(options) {
        lifeCycle.init(this, options);
    }

    var proto = Radio.prototype;


    proto.type = 'Radio';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var radioSelector = ':radio';
        var radioElement = mainElement.find(radioSelector);
        if (radioElement.length !== 1) {

            mainElemen.html(
                me.option('mainTemplate')
            );

            radioElement = mainElement.find(radioSelector);

        }

        mainElement.on(
            'click' + me.namespace(),
            // 有时候会连续触发两次
            debounce(
                function (e) {

                    if (me.get('disabled')) {
                        return;
                    }

                    me.set('checked', true);

                },
                50
            )
        );

        me.inner({
            radio: radioElement,
            main: mainElement
        });

        me.set({
            value: radioElement.val(),
            checked: radioElement.prop('checked'),
            disabled: radioElement.prop('disabled')
        });


    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);


    Radio.propertyUpdater = {

        checked: function (checked) {

            var me = this;

            me.inner('radio').prop(
                'checked',
                !!checked
            );

            var checkedClass = me.option('checkedClass');
            if (checkedClass) {

                var mainElement = me.inner('main');

                mainElement[ checked ? 'addClass' : 'removeClass' ](
                    checkedClass
                );

            }

        },

        disabled: function (disabled) {

            var me = this;

            me.inner('radio').prop(
                'disabled',
                !!disabled
            );

            var disabledClass = me.option('disabledClass');
            if (disabledClass) {

                var mainElement = me.inner('main');

                mainElement[ disabled ? 'addClass' : 'removeClass' ](
                    disabledClass
                );

            }

        },

        value: function (value) {

            this.inner('radio').val(value);

        }

    };


    return Radio;

});