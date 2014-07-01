/**
 * @file position
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var pin = require('../function/pin');

    exports.pin = pin;

    /**
     * 把元素定位到参照元素的左上方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.topLeft = function (options) {
        pin({
            element: options.element,
            x: 'right',
            y: 'bottom',
            attachment: {
                element: options.attachment,
                x: 'left',
                y: 'top'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的正上方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.topCenter = function (options) {
        pin({
            element: options.element,
            x: 'center',
            y: 'bottom',
            attachment: {
                element: options.attachment,
                x: 'center',
                y: 'top'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的右上方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.topRight = function (options) {
        pin({
            element: options.element,
            x: 'left',
            y: 'bottom',
            attachment: {
                element: options.attachment,
                x: 'right',
                y: 'top'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的正左方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.middleLeft = function (options) {
        pin({
            element: options.element,
            x: 'right',
            y: 'middle',
            attachment: {
                element: options.attachment,
                x: 'left',
                y: 'middle'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的正中心
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.middleCenter = function (options) {
        pin({
            element: options.element,
            x: 'center',
            y: 'middle',
            attachment: {
                element: options.attachment,
                x: 'center',
                y: 'middle'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的正右方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.middleRight = function (options) {
        pin({
            element: options.element,
            x: 'left',
            y: 'middle',
            attachment: {
                element: options.attachment,
                x: 'right',
                y: 'middle'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的左下方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.bottomLeft = function (options) {
        pin({
            element: options.element,
            x: 'right',
            y: 'top',
            attachment: {
                element: options.attachment,
                x: 'left',
                y: 'bottom'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的正下方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.bottomCenter = function (options) {
        pin({
            element: options.element,
            x: 'center',
            y: 'top',
            attachment: {
                element: options.attachment,
                x: 'center',
                y: 'bottom'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

    /**
     * 把元素定位到参照元素的右下方
     *
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {jQuery=} options.attachment
     * @property {number=} options.offsetX
     * @property {number=} options.offsetY
     */
    exports.bottomRight = function (options) {
        pin({
            element: options.element,
            x: 'left',
            y: 'top',
            attachment: {
                element: options.attachment,
                x: 'right',
                y: 'bottom'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };

});
