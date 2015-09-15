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

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var init = require('../function/init');


    /**
     * 复选框构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element <input type="checkbox" /> 元素
     * @property {string=} options.template 模拟复选框的模版
     * @property {string=} options.checkedClass 选中的 className
     * @property {string=} options.disabledClass 禁用的 className
     * @property {string=} options.wrapperSelector 应用 className 的元素选择器，默认是 label
     */
    function Checkbox(options) {
        return lifeCycle.init(this, options);
    }

    var proto = Checkbox.prototype;

    proto.type = 'Checkbox';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var element = me.element;
        var template = me.template;

        if (template) {
            element.hide().before(template);
        }

        if (element.prop('checked')) {
            me.check();
        }

        if (element.prop('disabled')) {
            me.disable();
        }

        element.on(
            'click' + namespace,
            function (e) {

                if (me.isDisabled()) {
                    return;
                }

                if (element.prop('checked')) {
                    me.check();
                }
                else {
                    me.uncheck();
                }

            }
        );

    };

    /**
     * 选中复选框
     */
    proto.check = function () {
        var me = this;
        me.element.prop('checked', true);
        me.setClass('add', me.checkedClass);
    };

    /**
     * 取消选中复选框
     */
    proto.uncheck = function () {
        var me = this;
        me.element.prop('checked', false);
        me.setClass('remove', me.checkedClass);
    };

    /**
     * 启用复选框
     */
    proto.enable = function () {
        var me = this;
        me.element.prop('disabled', false);
        me.setClass('remove', me.disabledClass);
    };

    /**
     * 禁用复选框
     */
    proto.disable = function () {
        var me = this;
        me.element.prop('disabled', true);
        me.setClass('add', me.disabledClass);
    };

    /**
     * 是否选中
     *
     * @returns {boolean}
     */
    proto.isChecked = function () {
        return this.element.prop('checked');
    };

    /**
     * 是否禁用
     *
     * @returns {boolean}
     */
    proto.isDisabled = function () {
        return this.element.prop('disabled');
    };

    /**
     * 获取值
     *
     * @return {string}
     */
    proto.getValue = function () {
        this.element.val();
    };

    /**
     * 设置值
     *
     * @param {string|number} value
     */
    proto.setValue = function (value) {
        this.element.val(value);
    };

    /**
     * 为 wrapper 元素设置 className
     *
     * @param {string} type 动作类型，可选值有 add remove
     * @param {string} className
     */
    proto.setClass = function (type, className) {

        if (!className) {
            return;
        }

        var me = this;
        var wrapper = me.element.closest(me.wrapperSelector);
        if (wrapper.length === 1) {
            wrapper[type + 'Class'](className);
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.element.off(namespace);
        me.element = null;

    };

    jquerify(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Checkbox.defaultOptions = {
        wrapperSelector: 'label'
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Checkbox>}
     */
    Checkbox.init = init(Checkbox);

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_checkbox';


    return Checkbox;

});