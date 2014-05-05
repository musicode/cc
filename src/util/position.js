/**
 * @file position
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var body = $(document.body);

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
     * @param {jQuery} options.element 需要定位的元素
     * @param {jQuery=} options.attachment 参照物元素，默认是 body
     * @param {string|number} options.x 目标元素的横坐标定位点，值可以是 'left' 'center' 'right' 'xx%' 10(纯数字)
     * @param {string|number} options.y 目标元素的纵坐标定位点，值可以是 'top' 'middle' 'bottom' 'yy%' 10(纯数字)
     * @param {string|number} options.attachmentX 参照物元素的横坐标定位点，取值同 options.x
     * @param {string|number} options.attachmentY 参照物元素的纵坐标定位点，取值同 options.y
     * @param {number=} options.offsetX 目标元素的横坐标偏移量，单位是 px
     * @param {number=} options.offsetY 目标元素的纵坐标偏移量，单位是 px
     */
    function pin(options) {

        var element = options.element;
        var attachment = options.attachment || body;

        var attachmentOffset = attachment.offset();

        // 计算的原点
        var originX = attachmentOffset.left + parseX(attachment, options.attachmentX);
        var originY = attachmentOffset.top + parseY(attachment, options.attachmentY);

        // element 必须是 body 的第一级子元素，否则定位条件太复杂了
        if (element.parent().prop('tagName') !== 'BODY') {
            element.appendTo(body);
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

        element.css(style);
    }

    /**
     * 解析配置中的横坐标值，可选值有以下几种：
     *
     * left   (等价于 0%)
     * center (等价于 50%)
     * right  (等价于 100%)
     * xx%    (百分比)
     * xx     (纯数字)
     *
     * @private
     * @param {jQuery} element
     * @param {string|number} x
     * @return {number}
     */
    function parseX(element, x) {

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
            x = (RegExp.$1 / 100) * element.outerWidth();
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
     * @private
     * @param {jQuery} element
     * @param {string|number} y
     * @return {number}
     */
    function parseY(element, y) {

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
            y = (RegExp.$1 / 100) * element.outerHeight();
        }

        return y;
    }

    /**
     * 拷贝对象
     *
     * @private
     * @param {Object} options
     * @return {Object}
     */
    function copy(options) {
        return $.extend({ }, options);
    }

    /**
     * 提取百分比的正则
     *
     * @private
     * @type {RegExp}
     */
    var percentExpr = /(-?\d+(\.\d+)?)%/;


    exports.pin = pin;

    /**
     * 把元素定位到参照元素的左上方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.topLeft = function (options) {
        options = copy(options);
        options.x = 'right';
        options.y = 'bottom';
        options.attachmentX = 'left';
        options.attachmentY = 'top';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正上方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.topCenter = function (options) {
        options = copy(options);
        options.x = 'center';
        options.y = 'bottom';
        options.attachmentX = 'center';
        options.attachmentY = 'top';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的右上方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.topRight = function (options) {
        options = copy(options);
        options.x = 'left';
        options.y = 'bottom';
        options.attachmentX = 'right';
        options.attachmentY = 'top';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正左方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.middleLeft = function (options) {
        options = copy(options);
        options.x = 'right';
        options.y = 'middle';
        options.attachmentX = 'left';
        options.attachmentY = 'middle';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正中心
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.middleCenter = function (options) {
        options = copy(options);
        options.x = 'center';
        options.y = 'middle';
        options.attachmentX = 'center';
        options.attachmentY = 'middle';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正右方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.middleRight = function (options) {
        options = copy(options);
        options.x = 'left';
        options.y = 'middle';
        options.attachmentX = 'right';
        options.attachmentY = 'middle';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的左下方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.bottomLeft = function (options) {
        options = copy(options);
        options.x = 'right';
        options.y = 'top';
        options.attachmentX = 'left';
        options.attachmentY = 'bottom';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的正下方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.bottomCenter = function (options) {
        options = copy(options);
        options.x = 'center';
        options.y = 'top';
        options.attachmentX = 'center';
        options.attachmentY = 'bottom';
        pin(options);
    };

    /**
     * 把元素定位到参照元素的右下方
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.attachment
     * @param {number=} options.offsetX
     * @param {number=} options.offsetY
     */
    exports.bottomRight = function (options) {
        options = copy(options);
        options.x = 'left';
        options.y = 'top';
        options.attachmentX = 'right';
        options.attachmentY = 'bottom';
        pin(options);
    };

});
