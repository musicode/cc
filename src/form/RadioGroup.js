/**
 * @file radio 必须成组使用，单个是没意义的
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Radio = require('../form/Radio');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     * 单选框分组
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element box 组件的容器元素
     * @property {string} options.template
     * @property {string=} options.checkedClass
     * @property {string=} options.disabledClass
     * @property {Funciton=} options.onChange
     */
    function RadioGroup(options) {
        return lifeCycle.init(this, options);
    }

    RadioGroup.prototype = {

        constructor: RadioGroup,

        type: 'RadioGroup',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            var radios = element.find(':radio');
            var group = me.group = [ ];

            radios.each(
                function () {

                    var options = {
                        element: $(this)
                    };

                    if (me.template) {
                        options.template = me.template;
                    }
                    if (me.checkedClass) {
                        options.checkedClass = me.checkedClass;
                    }
                    if (me.disabledClass) {
                        options.disabledClass = me.disabledClass;
                    }

                    var instance = new Radio(options);

                    if (this.checked) {
                        me.checkedRadio = instance;
                    }

                    group.push(instance);
                }
            );

            element.on(
                'change',
                ':radio',
                function (e) {

                    if (me.checkedRadio) {
                        me.checkedRadio.uncheck();
                    }

                    var index = radios.index(this);
                    me.checkedRadio = group[index];

                    me.emit('change');
                }
            );

        },

        /**
         * 获取当前选中值
         *
         * @return {string}
         */
        getValue: function () {

            var me = this;

            return me.checkedRadio
                 ? me.checkedRadio.element.prop('value')
                 : '';
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            $.each(
                me.group,
                function (index, radio) {
                    radio.dispose();
                }
            );

            me.element =
            me.group = null;
        }
    };

    jquerify(RadioGroup);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    RadioGroup.defaultOptions = { };


    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<RadioGroup>}
     */
    RadioGroup.init = function (element, options) {

        var result = [ ];

        element.each(
            function () {
                result.push(
                    new RadioGroup(
                        $.extend(
                            {
                                element: $(this)
                            },
                            options
                        )
                    )
                );
            }
        );

        return result;
    };


    return RadioGroup;

});