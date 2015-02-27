/**
 * @file 放大镜
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var offsetParent = require('../function/offsetParent');
    var imageDimension = require('../function/imageDimension');
    var instance = require('../util/instance');

    /**
     *
     * 放大镜
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 缩小版的图片元素，这是一个 <img />
     * @property {jQuery} options.viewport 显示原始图片的元素，这不是一个 <img />，只是把它当作显示图片的容器
     * @property {jQuery} options.finder 取景元素，会跟随鼠标移动
     * @property {string} options.url 原始图片地址
     */
    function Zoom(options) {
        return lifeCycle.init(this, options);
    }

    Zoom.prototype = {

        constructor: Zoom,

        type: 'Zoom',

        init: function () {

            var me = this;

            // 缩放尺寸
            var scaleImage = me.element;
            if (scaleImage.is(':hidden')) {
                throw new Error('Zoom element must be visible!');
            }

            var scaleWidth = scaleImage.width();
            var scaleHeight = scaleImage.height();

            // 图片浏览窗口尺寸
            var viewport = me.viewport;

            // 取景器尺寸
            var finder = me.finder;
            var finderWidth = finder.outerWidth(true);
            var finderHeight = finder.outerHeight(true);

            // 默认隐藏，鼠标移入后显示
            finder.hide();
            viewport.hide();

            var url = me.url;

            imageDimension(
                url,
                function (rawWidth, rawHeight) {

                    var scaleX = scaleWidth / rawWidth;
                    var scaleY = scaleHeight / rawHeight;

                    var viewportWidth = finderWidth / scaleX;
                    var viewportHeight = finderHeight / scaleY;

                    // 避免同时发两个请求
                    // 而是等 imageDimension 加载过之后
                    // 赋给背景图，可利用缓存
                    viewport.css({
                        width: viewportWidth,
                        height: viewportHeight,
                        background: 'url(' + url + ') no-repeat'
                    });

                    var scaleImageOffset = scaleImage.offset();
                    var pageOffset = {
                        left: 0,
                        top: 0
                    };

                    // 确定移动范围
                    var left = scaleImageOffset.left;
                    var top = scaleImageOffset.top;
                    var right = left + scaleWidth;
                    var bottom = top + scaleHeight;

                    // 确定偏移量
                    var scaleImageParent = offsetParent(scaleImage);
                    if (scaleImageParent.is('body')) {
                        scaleImageOffset = pageOffset;
                    }

                    var finderParent = offsetParent(finder);
                    var finderOffset = scaleImageOffset;

                    if (scaleImageParent[0] !== finderParent[0]) {
                        if (!finderParent.is('body')) {
                            finder.appendTo('body');
                        }
                        finderOffset = pageOffset;
                    }

                    var enterType = 'mouseenter' + namespace;
                    var moveType = 'mousemove' + namespace;

                    scaleImage

                    .on(enterType, function (e) {

                        finder.show();
                        viewport.show();

                        instance.document.on(
                            moveType,
                            function (e) {

                                var x = e.pageX;
                                var y = e.pageY;

                                if (x < left || x > right
                                    || y < top || y > bottom
                                ) {
                                    finder.hide();
                                    viewport.hide();
                                    instance.document.off(moveType);
                                    return;
                                }

                                // 全局坐标
                                x -= 0.5 * finderWidth;
                                y -= 0.5 * finderHeight;

                                if (x < left) {
                                    x = left;
                                }
                                else if (x > right - finderWidth) {
                                    x = right - finderWidth;
                                }

                                if (y < top) {
                                    y = top;
                                }
                                else if (y > bottom - finderHeight) {
                                    y = bottom - finderHeight;
                                }

                                finder.css({
                                    left: x - finderOffset.left,
                                    top: y - finderOffset.top
                                });

                                // 转换成原始图坐标
                                x = (x - scaleImageOffset.left) / scaleX;
                                y = (y - scaleImageOffset.top) / scaleY;

                                if (x > rawWidth - viewportWidth) {
                                    x = rawWidth - viewportWidth;
                                }
                                if (y > rawHeight - viewportHeight) {
                                    y = rawHeight - viewportHeight;
                                }

                                viewport.css({
                                    'background-position': '-' + x + 'px -' + y + 'px'
                                });

                            }
                        );

                    });

                }
            );


        },

        /**
         * 销毁
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            instance.document.off(namespace);
            me.element.off(namespace);

            me.element =
            me.finder =
            me.viewport = null;

        }
    };

    jquerify(Zoom.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Zoom.defaultOptions = {

    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_zoom';


    return Zoom;

});