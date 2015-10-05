/**
 * @file 放大镜
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var isHidden = require('../function/isHidden');
    var innerOffset = require('../function/innerOffset');
    var imageDimension = require('../function/imageDimension');

    var Draggable = require('../helper/Draggable');

    var document = require('../util/instance').document;
    var lifeUtil = require('../util/life');

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
        lifeUtil.init(this, options);
    }

    var proto = Zoom.prototype;

    proto.type = 'Zoom';

    proto.init = function () {

        var me = this;

        var thumbnailElement = me.option('thumbnailElement');
        if (isHidden(thumbnailElement)) {
            me.error('thumbnailElement must be visible.');
        }
        if (!thumbnailElement.is('img')) {
            me.error('thumbnailElement muse be a <img />.');
        }

        var viewportElement = me.option('viewportElement');
        var finderElement = me.option('finderElement');
        var imageUrl = me.option('imageUrl');
        var namespace = me.namespace();

        // 缩放尺寸
        var scaledWidth = thumbnailElement.prop('width');
        var scaledHeight = thumbnailElement.prop('height');

        // 原始尺寸
        var rawWidth;
        var rawHeight;

        // 取景器尺寸
        var finderWidth;
        var finderHeight;

        // 缩放比例
        var scaleX;
        var scaleY;

        // thumbnail 偏移坐标
        var thumbnailOffset;

        var scaledImageReady = function () {

            // 取景器尺寸
            finderWidth = finderElement.innerWidth();
            finderHeight = finderElement.innerHeight();

            rawImageReady();

        };

        var rawImageReady = function () {

            if (!scaledWidth || !rawWidth) {
                return;
            }

            scaleX = scaledWidth / rawWidth;
            scaleY = scaledHeight / rawHeight;
console.log(scaleX, scaleY)
            viewportElement.css({
                width: finderWidth / scaleX,
                height: finderHeight / scaleY,
                background: 'url(' + imageUrl + ') no-repeat'
            });

        };

        if (!scaledWidth && !scaledHeight) {
            thumbnailElement
                .one('load' + namespace, function () {
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

        var dragger = new Draggable({
            mainElement: finderElement,
            containerElement: thumbnailElement,
            dragAnimation: function (options) {
                finderElement.css(options.mainStyle);
            },
            bind: function (options) {

                var namespace = options.namespace;
                var enterType = 'mouseenter' + namespace;
                var leaveType = 'mouseleave' + namespace;

                var delayTimer;

                var clearTimer = function (e) {
                    if (delayTimer) {
                        clearTimeout(delayTimer);
                        delayTimer = null;
                    }
                };

                var leaveHandler = function (e) {
                    delayTimer = setTimeout(
                        function () {
                            delayTimer = null;
                            options.upHandler(e);
                            document.off(namespace);
                        },
                        50
                    );
                };

                thumbnailElement
                    .on(
                        enterType,
                        function (e) {

                            if (delayTimer) {
                                clearTimer();
                                return;
                            }

                            thumbnailOffset = innerOffset(thumbnailElement);

                            options.downHandler(e, {
                                x: finderWidth / 2,
                                y: finderHeight / 2
                            });

                            document
                                .off(namespace)
                                .on('mousemove' + namespace, options.moveHandler);
                        }
                    )
                    .on(leaveType, leaveHandler);

                finderElement
                    .on(enterType, clearTimer)
                    .on(leaveType, leaveHandler);


            },
            onbeforedrag: function () {
                me.execute(
                    'showFinderAnimation',
                    {
                        finderElement: finderElement
                    }
                );
                me.execute(
                    'showViewportAnimation',
                    {
                        viewportElement: viewportElement
                    }
                );
            },
            onafterdrag: function () {
                me.execute(
                    'hideFinderAnimation',
                    {
                        finderElement: finderElement
                    }
                );
                me.execute(
                    'hideViewportAnimation',
                    {
                        viewportElement: viewportElement
                    }
                );
            },
            ondrag: function (e, data) {
                var left = (data.left - thumbnailOffset.x) / scaleX;
                var top = (data.top - thumbnailOffset.y) / scaleY;
                console.log(data, left + ',' + top)
                viewportElement.css({
                    'background-position': '-' + left + 'px -' + top + 'px'
                });
            }
        });

        me.inner({
            dragger: dragger
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        var namespace = me.namespace();

        document.off(namespace);

        me.option('thumbnailElement').off(
            namespace
        );

        me.inner('dragger').dispose();

    };

    lifeUtil.extend(proto);


    return Zoom;

});