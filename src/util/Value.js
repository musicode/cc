/**
 * @file 处理多选值
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var split = require('../function/split');

    function Value(options) {
        $.extend(this, Value.defaultOptions, options);
        this.init();
    }

    var proto = Value.prototype;

    proto.init = function () {
        this.list = [ ];
    };

    /**
     * 获取当前值
     *
     * @return {string}
     */
    proto.get = function () {
        return this.list.join(this.sep);
    };

    /**
     * 设值
     *
     * @param {string} value
     */
    proto.set = function (value) {

        var me = this;

        me.list.length = 0;

        $.each(
            split(value, me.sep),
            function (index, literal) {
                me.add(literal);
            }
        );

    };

    /**
     * 添加一个值
     *
     * @param {string} value
     * @return {boolean}
     */
    proto.add = function (value) {

        var me = this;
        var list = me.list;

        var index = $.inArray(value, list);
        if (index < 0) {
            if (!me.validate || me.validate(value)) {
                list.push(value);
            }
            else {
                return;
            }
        }
        else {
            return;
        }

        if (list.length > 1) {
            if (!me.multiple) {
                list[0] = list.pop();
                list.length = 1;
            }
            else if (me.sort) {
                list.sort(me.sort);
            }
        }

        return true;

    };



    /**
     * 删掉一个值
     *
     * @param {string} value
     * @return {boolean}
     */
    proto.remove = function (value) {
        var list = this.list;
        var index = $.inArray(value, list);
        if (index >= 0) {
            list.splice(index, 1);
            return true;
        }
    };

    /**
     * 是否包含一个值
     *
     * @param {string} value
     * @return {boolean}
     */
    proto.has = function (value) {
        return $.inArray(value, this.list) >= 0;
    };

    /**
     * 遍历值
     *
     * @param {Function=} fn
     */
    proto.each = function (fn) {
        $.each(this.list, function (index, value) {
            return fn(value, index);
        });
    };

    /**
     * 销毁
     */
    proto.dispose = function () {
        this.list = null;
    };

    Value.defaultOptions = {
        sep: ',',
        sort: function (a, b) {
            if (a > b) {
                return 1;
            }
            else if (a < b) {
                return -1;
            }
            else {
                return 0;
            }
        }
    };

    return Value;

});