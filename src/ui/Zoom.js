/**
 * @file 放大镜
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var isHidden = require('../function/isHidden');
    var eventPage = require('../function/eventPage');
    var offsetParent = require('../function/offsetParent');
    var imageDimension = require('../function/imageDimension');

    var instance = require('../util/instance');
    var lifeCycle = require('../util/lifeCycle');

    /**
     *
     * 放大镜
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.thumbnailElement 缩小版的图片元素，这是一个 <img />
     * @property {jQuery} options.viewportElement 显示原始图片的元素，这不是一个 <img />，只是把它当作显示图片的容器
     * @property {jQuery} options.finderElement 取景元素，会跟随鼠标移动
     * @property {string} options.imageUrl 原始图片地址
     */
    function Zoom(options) {
        lifeCycle.init(this, options);
    }

    var proto = Zoom.prototype;

    proto.type = 'Zoom';

    proto.init = function () {

        var me = this;

        var thumbnailElement = me.option('thumbnailElement');
        if (isHidden(thumbnailElement)) {
            throw new Error('Zoom thumbnailElement must be visible!');
        }

        var viewportElement = me.option('viewportElement');
        var finderElement = me.option('finderElement');
        var imageUrl = me.option('imageUrl');

        // 缩放尺寸
        var scaledWidth = thumbnailElement.width();
        var scaledHeight = thumbnailElement.height();

        // 原始尺寸
        var rawWidth;
        var rawHeight;

        var finderWidth;
        var finderHeight;

        var scaledImageReady = function () {

            // 取景器尺寸
            finderWidth = finderElement.outerWidth(true);
            finderHeight = finderElement.outerHeight(true);

            // 默认隐藏，鼠标移入后显示
            if (!isHidden(finderElement)) {
                me.execute(
                    'hideFinderAnimate',
                    {
                        finderElement: finderElement
                    }
                );
            }
            if (!isHidden(viewportElement)) {
                me.execute(
                    'hideViewportAnimate',
                    {
                        viewportElement: viewportElement
                    }
                );
            }

            rawImageReady();

        };

        var rawImageReady = function () {

            if (!scaledWidth || !scaledHeight || !rawWidth || !rawHeight) {
                return;
            }

            var scaleX = scaledWidth / rawWidth;
            var scaleY = scaledHeight / rawHeight;

            var viewportWidth = finderWidth / scaleX;
            var viewportHeight = finderHeight / scaleY;

            // 避免同时发两个请求
            // 而是等 imageDimension 加载过之后
            // 赋给背景图，可利用缓存
            viewportElement.css({
                width: viewportWidth,
                height: viewportHeight,
                background: 'url(' + imageUrl + ')'
            });

            var scaleImageOffset = thumbnailElement.offset();
            var pageOffset = {
                left: 0,
                top: 0
            };

            // 确定移动范围
            var left = scaleImageOffset.left;
            var top = scaleImageOffset.top;
            var right = left + scaledWidth;
            var bottom = top + scaledHeight;

            // 确定偏移量
            var scaleImageParent = offsetParent(thumbnailElement);
            if (scaleImageParent.is('body')) {
                scaleImageOffset = pageOffset;
            }

            var finderParent = offsetParent(finderElement);
            var finderOffset = scaleImageOffset;

            if (scaleImageParent[0] !== finderParent[0]) {
                if (!finderParent.is('body')) {
                    finder.appendTo('body');
                }
                finderOffset = pageOffset;
            }

            var namespace = me.namespace();
            var enterType = 'mouseenter' + namespace;
            var moveType = 'mousemove' + namespace;

            thumbnailElement

            .on(enterType, function (e) {

                me.execute(
                    'showFinderAnimate',
                    {
                        finderElement: finderElement
                    }
                );
                me.execute(
                    'showViewportAnimate',
                    {
                        viewportElement: viewportElement
                    }
                );

                instance.document.on(
                    moveType,
                    function (e) {

                        var pos = eventPage(e);

                        var x = pos.x;
                        var y = pos.y;

                        if (x < left || x > right
                            || y < top || y > bottom
                        ) {
                            me.execute(
                                'hideFinderAnimate',
                                {
                                    finderElement: finderElement
                                }
                            );
                            me.execute(
                                'hideViewportAnimate',
                                {
                                    viewportElement: viewportElement
                                }
                            );
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

                        finderElement.css({
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

                        viewportElement.css({
                            'background-position': '-' + x + 'px -' + y + 'px'
                        });

                    }
                );

            });

        };

        if (!scaledWidth && !scaledHeight) {
            thumbnailElement.one('load', function () {
                scaledWidth = this.width;
                scaledHeight = this.height;
                scaledImageReady();
            });
        }
        else {
            scaledImageReady();
        }

        imageDimension(
            imageUrl,
            function (width, height) {

                rawWidth = width;
                rawHeight = height;

                rawImageReady();

            }
        );

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        var namespace = me.namespace();

        instance.document.off(namespace);

        me.option('thumbnailElement').off(
            namespace
        );

    };

    lifeCycle.extend(proto);

    Zoom.defaultOptions = {
        showFinderAnimate: function (options) {
            options.finderElement.show();
        },
        hideFinderAnimate: function (options) {
            options.finderElement.hide();
        },
        showViewportAnimate: function (options) {
            options.viewportElement.show();
        },
        hideViewportAnimate: function (options) {
            options.viewportElement.hide();
        }
    };


    return Zoom;

});