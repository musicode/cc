/**
 * @file 对齐
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var dimension = require('./dimension');

    /**
     * 居中对齐
     *
     * @param {Object} options
     * @param {jQuery} options.element
     * @param {jQuery=} options.mask 遮罩元素
     * @param {string=} options.position absolute 或 fixed，默认 absolute
     */
    exports.center = function (options) {

        var mask = options.mask;
        if (mask) {
            mask.height(dimension.getWindowScrollHeight());
        }

        var element = options.element;

        // 不管怎么着，先置为 0，不然影响计算
        // 需要定位的元素不太可能会在 css 里写 margin
        // 如果非要这么写，那就让他自己折腾去吧
        element.css('margin', 0);

        var position = options.position || 'absolute';

        var halfWidth = element.outerWidth() / 2;
        var halfHeight = element.outerHeight() / 2;

        var style = {
            position: position
        };

        if (position === 'absolute') {
            style.left = dimension.getWindowScrollLeft();
            style.top = dimension.getWindowScrollTop();
            style.marginLeft = dimension.getViewportWidth() / 2 - halfWidth;
            style.marginTop = dimension.getViewportHeight() / 2 - halfHeight;
        }
        else if (position === 'fixed') {
            style.left = '50%';
            style.top = '50%';
            style.marginLeft = -1 * halfWidth;
            style.marginTop = -1 * halfHeight;
        }

        element.css(style);
    };

});