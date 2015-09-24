/**
 * @file 模拟 <input type="checkbox" />
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
     *     <input type="checkbox" name="city" /> 北京
     * </label>
     *
     * 好处是点击 `北京` 或 复选框，都能实现 toggle
     *
     * ## 默认选中
     *
     * 如果需要默认选中，input 可以设置为 checked，如下：
     *
     * <input type="checkbox" name="city" checked="checked" />
     *
     * ## 默认禁用
     *
     * 如果需要默认禁用，input 可以设置为 disabled，如下：
     *
     * <input type="checkbox" name="city" disabled="disabled" />
     *
     */

    var debounce = require('../function/debounce');
    var lifeCycle = require('../util/lifeCycle');


    /**
     * 复选框构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     */
    function Checkbox(options) {
        lifeCycle.init(this, options);
    }

    var proto = Checkbox.prototype;

    proto.type = 'Checkbox';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var checkboxSelector = ':checkbox';
        var checkboxElement = mainElement.find(checkboxSelector);
        if (checkboxElement.length !== 1) {

            mainElemen.html(
                me.option('mainTemplate')
            );

            checkboxElement = mainElement.find(checkboxSelector);

        }

        mainElement.on(
            'click' + me.namespace(),
            debounce(
                function (e) {

                    if (me.get('disabled')) {
                        return;
                    }

                    me.set(
                        'checked',
                        !me.get('checked')
                    );

                },
                50
            )
        );

        me.inner({
            checkbox: checkboxElement,
            main: mainElement
        });

        me.set({
            value: checkboxElement.val(),
            checked: checkboxElement.prop('checked'),
            disabled: checkboxElement.prop('disabled')
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


    Checkbox.defaultOptions = {

    };


    Checkbox.propertyUpdater = {

        checked: function (checked) {

            var me = this;

            me.inner('checkbox').prop(
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

            me.inner('checkbox').prop(
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

            this.inner('checkbox').val(value);

        }

    };


    return Checkbox;

});