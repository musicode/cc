/**
 * @file 定位元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var body = $(document.body);

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
     * @param {jQuery} element
     * @param {string|number} x
     * @param {number=} width
     * @return {number}
     */
    function parseX(element, x, width) {

        if (x === 'left') {
            return 0;
        }
        else if (x === 'center') {
            x = '50%';
        }
        else if (x === 'right') {
            x = '100%';
        }

        if (typeof x === 'string' && percentExpr.test(x)) {
            x = (RegExp.$1 / 100) * (width || element.outerWidth(true));
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
     * @param {jQuery} element
     * @param {string|number} y
     * @param {number} height
     * @return {number}
     */
    function parseY(element, y, height) {

        if (y === 'top') {
            return 0;
        }
        else if (y === 'middle') {
            y = '50%';
        }
        else if (y === 'bottom') {
            y = '100%';
        }

        if (typeof y === 'string' && percentExpr.test(y)) {
            y = (RegExp.$1 / 100) * (height || element.outerHeight(true));
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
     * @property {jQuery} options.element 需要定位的元素
     * @property {jQuery=} options.attachment 参照物元素，默认是 body
     * @property {string|number} options.x 目标元素的横坐标定位点，值可以是 'left' 'center' 'right' 'xx%' 10(纯数字)
     * @property {string|number} options.y 目标元素的纵坐标定位点，值可以是 'top' 'middle' 'bottom' 'yy%' 10(纯数字)
     * @property {string|number} options.attachmentX 参照物元素的横坐标定位点，取值同 options.x
     * @property {string|number} options.attachmentY 参照物元素的纵坐标定位点，取值同 options.y
     * @property {number=} options.attachmentWidth 参照物元素的宽度，默认取 attachment.outerWidth(true)
     * @property {number=} options.attachmentHeight 参照物元素的高度，默认取 attachment.outerHeight(true)
     * @property {number=} options.offsetX 目标元素的横坐标偏移量，单位是 px
     * @property {number=} options.offsetY 目标元素的纵坐标偏移量，单位是 px
     * @property {boolean=} options.silence 是否不设置样式，而是返回样式
     * @return {?Object}
     */
    return function (options) {

        var element = options.element;
        var attachment = options.attachment || body;

        var attachmentOffset = attachment.offset();

        // 计算的原点
        var originX = attachmentOffset.left
                    + parseX(attachment, options.attachmentX, options.attachmentWidth);

        var originY = attachmentOffset.top
                    + parseY(attachment, options.attachmentY, options.attachmentHeight);

        // element 必须是 body 的第一级子元素，否则定位条件太复杂了
        if (!element.parent().is('body')) {
            body.append(element);
        }

        // 相对原点的偏移量
        var offsetX = parseX(element, options.x);
        var offsetY = parseY(element, options.y);

        var x = originX - offsetX;
        var y = originY - offsetY;

        if (typeof options.offsetX === 'number') {
            x += options.offsetX;
        }
        if (typeof options.offsetY === 'number') {
            y += options.offsetY;
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