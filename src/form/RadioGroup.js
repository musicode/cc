/**
 * @file radio 必须成组使用，单个是没意义的
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Radio = require('../form/Radio');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var init = require('../function/init');

    /**
     * 单选框分组
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element box 组件的容器元素
     * @property {string=} options.template
     * @property {string=} options.checkedClass
     * @property {string=} options.disabledClass
     * @property {Function=} options.onChange
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

            var radios = me.radios = element.find(':radio');
            var group = me.group = [ ];

            radios.each(
                function () {

                    var options = {
                        element: $(this)
                    };

                    var props = [
                        'checkedClass', 'disabledClass',
                        'template', 'wrapperSelector'
                    ];

                    $.each(
                        props,
                        function (index, name) {
                            if (me[name]) {
                                options[name] = me[name];
                            }
                        }
                    );

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

                    me.setValue(this.value);

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
                 ? me.checkedRadio.getValue()
                 : '';
        },

        /**
         * 设置当前选中值
         *
         * @param {string|number} value
         */
        setValue: function (value) {

            var me = this;
            var radio = me.element.find('[value="' + value + '"]');

            if (radio.length === 1 && radio) {

                var index = me.radios.index(radio);
                var instance = me.group[index];

                if (instance.isDisabled()) {
                    return;
                }

                if (me.checkedRadio) {

                    if (me.checkedRadio === instance) {
                        return;
                    }

                    instance.check();

                    me.checkedRadio.uncheck();
                }
                else {
                    instance.check();
                }

                me.checkedRadio = instance;

                me.emit('change');
            }

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

    jquerify(RadioGroup.prototype);

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
    RadioGroup.init = init(RadioGroup);


    return RadioGroup;

});