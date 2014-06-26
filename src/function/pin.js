/**
 * @file 定位元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

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

        var x = options.x;

        if (x === 'left') {
            return 0;
        }
        else if (x === 'center') {
            x = '50%';
        }
        else if (x === 'right') {
            x = '100%';
        }

        if ($.type(x) === 'string' && percentExpr.test(x)) {
            x = (RegExp.$1 / 100) * (options.width || options.element.outerWidth(true));
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

        var y = options.y;

        if (y === 'top') {
            return 0;
        }
        else if (y === 'middle') {
            y = '50%';
        }
        else if (y === 'bottom') {
            y = '100%';
        }

        if ($.type(y) === 'string' && percentExpr.test(y)) {
            y = (RegExp.$1 / 100) * (options.height || options.element.outerHeight(true));
        }

        return y;
    }

    /**
     * 提取百分比的正则
     *
     * @inner
     * @type {RegExp}
     */
    var percentExpr = /(-?\d+(\.\d+)?)%/;

    /**
     * 定位一个元素
     *
     * 把 a 定位到 b 的右下角
     * pin({
     *     element: $('a'),
     *     attachment: $('b'),
     *     x: 'left',
     *     y: 'top',
     *     attachmentX: 'right',
     *     attachmentY: 'bottom',
     *     offsetX: 10,
     *     offsetY: 10
     * });
     *
     * @param {Object} options
     *
     * @property {jQuery} options.element 需要定位的元素
     * @property {string|number} options.x 目标元素的横坐标定位点，值可以是 'left' 'center' 'right' 'xx%' 10(纯数字)
     * @property {string|number} options.y 目标元素的纵坐标定位点，值可以是 'top' 'middle' 'bottom' 'yy%' 10(纯数字)
     *
     * @property {jQuery} options.attachment 参照对象
     * @property {jQuery} options.attachment.element 参照元素，默认是 body
     * @property {jQuery} options.attachment.x 参照物元素的横坐标定位点，取值同 options.x
     * @property {jQuery} options.attachment.y 参照物元素的纵坐标定位点，取值同 options.y
     * @property {jQuery=} options.attachment.width 参照物元素的宽度，默认取 attachment.outerWidth(true)
     * @property {jQuery=} options.attachment.height 参照物元素的高度，默认取 attachment.outerHeight(true)
     *
     * @property {Object=} options.offset 偏移量
     * @property {number=} options.offset.x 水平方向偏移量，单位是 px
     * @property {number=} options.offset.y 垂直方向偏移量，单位是 px
     *
     * @property {boolean=} options.silence 是否不设置样式，而是返回样式
     *
     * @return {?Object}
     */
    return function (options) {

        var element = options.element;
        var attachment = options.attachment || { };

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

        if (options.silence) {
            return style;
        }
        else {
            element.css(style);
        }
    };

});