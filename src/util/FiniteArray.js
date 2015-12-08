/**
 * @file 有限数组
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 需求场景举例如下：
     *
     * 1. 10 秒内最多输入 3 次
     *
     * 2. 5 秒后的丢包率如果大于 x，表示网络较卡
     *
     *
     * 类似这种需求都是用一个数组去存值，比如例 1 每次输入都往数组 push 一个时间戳，
     * 然后比较倒数第三个（因为是有限数组，所以通常也是第一个）的时间戳，时间差是否大于 10 秒，
     *
     * 如果不满足条件，则不再 push
     * 如果满足条件，则删除第一个，再 push
     *
     */

    /**
     * @param {Object} options
     * @property {number} options.max 数组最大长度
     */
    function FiniteArray(options) {
        $.extend(this, options);
        this.init();
    }

    var proto = FiniteArray.prototype;

    proto.init = function () {
        this.list = [ ];
    };

    /**
     * 往数组尾部添加一项
     *
     * @param {*} item
     */
    proto.push = function (item) {

        var me = this;
        var list = me.list;

        if (me.isFull()) {
            list.shift();
        }

        if (list.length < me.max) {
            list.push(item);
        }

    };

    /**
     * 获取第 index 个元素
     *
     * @param {number} index
     * @return {*}
     */
    proto.get = function (index) {
        return this.list[index];
    };

    /**
     * 获取第一个元素
     *
     * @return {*}
     */
    proto.first = function () {
        return this.get(0);
    };

    /**
     * 获取最后一个元素
     *
     * @return {*}
     */
    proto.last = function () {
        return this.get(this.list.length - 1);
    };

    /**
     * 数组是否已满
     *
     * @return {boolean}
     */
    proto.isFull = function () {
        return this.list.length === this.max;
    };

    /**
     * 遍历数组
     *
     * @param {Function} fn
     */
    proto.each = function (fn) {
        $.each(
            this.list,
            function (index, item) {
                return fn(item, index);
            }
        );
    };

    /**
     * 获取数组的大小
     *
     * @return {number}
     */
    proto.size = function () {
        return this.list.length;
    };

    /**
     * 清空数组
     */
    proto.clear = function () {
        this.list.length = 0;
    };

    return FiniteArray;

});