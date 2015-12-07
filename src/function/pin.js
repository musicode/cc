/**
 * @file 定位元素
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('../util/instance');
    var parsePercent = require('./parsePercent');

    /**
     * 名称映射百分比
     *
     * @inner
     * @type {Object}
     */
    var name2Value = {
        left: 0,
        top: 0,
        center: '50%',
        middle: '50%',
        right: '100%',
        bottom: '100%'
    };

    /**
     * 提取百分比的正则
     *
     * @inner
     * @type {RegExp}
     */
    var percentExpr = /(-?\d+(\.\d+)?)%/;

    /**
     * 解析配置中的横坐标值，可选值有以下几种：
     *
     * left   (等价于 0%)
     * center (等价于 50%)
     * right  (等价于 100%)
     * xx%    (百分比)
     * xx     (纯数字)
     *
     * @inner
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number=} options.width
     * @property {string|number} options.x
     * @return {number}
     */
    function parseX(options) {

        var x = name2Value[options.x];

        if (x == null) {
            x = options.x;
        }

        if ($.type(x) === 'string') {
            var percent = parsePercent(x);
            if (percent != null) {
                x = percent * (options.width || options.element.outerWidth());
            }
        }

        return x;
    }

    /**
     * 解析配置中的纵坐标值，可选值有以下几种：
     *
     * top    (等价于 0%)
     * middle (等价于 50%)
     * bottom (等价于 100%)
     * yy%    (百分比)
     * yy     (纯数字)
     *
     * @inner
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number=} options.height
     * @property {string|number} options.y
     * @return {number}
     */
    function parseY(options) {

        var y = name2Value[options.y];

        if (y == null) {
            y = options.y;
        }

        if ($.type(y) === 'string') {
            var percent = parsePercent(y);
            if (percent != null) {
                y = percent * (options.height || options.element.outerHeight());
            }
        }

        return y;
    }

    /**
     * 定位一个元素
     *
     * 把 a 定位到 b 的右下角
     * pin({
     *     element: $('a'),
     *     x: 'left',
     *     y: 'top',
     *     attachment: {
     *         element: $('b'),
     *         x: 'right',
     *         y: 'bottom'
     *
     *     },
     *     offset: {
     *         x: 10,
     *         y:  10
     *     }
     * });
     *
     * @param {Object} options
     *
     * @property {jQuery} options.element 需要定位的元素
     * @property {string|number} options.x 目标元素的横坐标定位点，值可以是 'left' 'center' 'right' 'xx%' 10(纯数字)
     * @property {string|number} options.y 目标元素的纵坐标定位点，值可以是 'top' 'middle' 'bottom' 'yy%' 10(纯数字)
     *
     * @property {Object} options.attachment 参照对象
     * @property {jQuery} options.attachment.element 参照元素，默认是 body
     * @property {string|number} options.attachment.x 参照物元素的横坐标定位点，取值同 options.x
     * @property {string|number} options.attachment.y 参照物元素的纵坐标定位点，取值同 options.y
     * @property {number=} options.attachment.width 参照物元素的宽度，默认取 attachment.outerWidth()
     * @property {number=} options.attachment.height 参照物元素的高度，默认取 attachment.outerHeight()
     *
     * @property {Object=} options.offset 偏移量
     * @property {number=} options.offset.x 水平方向偏移量，单位是 px
     * @property {number=} options.offset.y 垂直方向偏移量，单位是 px
     *
     * @property {boolean=} options.silent 是否不设置样式，而是返回样式
     *
     * @return {?Object} 如果 options.silent 为 true 返回定位坐标
     */
    return function (options) {

        var element = options.element;
        var attachment = options.attachment || { };

        if (!attachment.element) {
            attachment.element = instance.body;
        }

        var attachmentOffset = attachment.element.offset();

        // 计算的原点
        var originX = attachmentOffset.left + parseX(attachment);
        var originY = attachmentOffset.top + parseY(attachment);

        var x = originX - parseX(options);
        var y = originY - parseY(options);

        var offset = options.offset;
        if (offset) {
            if ($.type(offset.x) === 'number') {
                x += offset.x;
            }
            if ($.type(offset.y) === 'number') {
                y += offset.y;
            }
        }

        var style = {
            left: x,
            top: y
        };

        var position = element.css('position');
        if (position !== 'absolute' && position !== 'fixed') {
            style.position = 'absolute';
        }

        if (options.silent) {
            return style;
        }
        else {
            element.css(style);
        }
    };

});