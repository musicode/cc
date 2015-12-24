/**
 * @file 放大镜
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

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
     * @property {Function} options.showFinderAnimation
     * @property {Function} options.hideFinderAnimation
     * @property {Function} options.showViewportAnimation
     * @property {Function} options.hideViewportAnimation
     */
    function Zoom(options) {
        lifeUtil.init(this, options);
    }

    var proto = Zoom.prototype;

    proto.type = 'Zoom';

    proto.init = function () {

        var me = this;

        var thumbnailElement = me.option('thumbnailElement');
        if (!thumbnailElement.is('img')) {
            me.error('thumbnailElement must be a <img />.');
        }

        var viewportElement = me.option('viewportElement');
        var finderElement = me.option('finderElement');

        // 缩放尺寸
        var thumbnailWidth = thumbnailElement.prop('width');
        var thumbnailHeight = thumbnailElement.prop('height');

        // 取景器尺寸
        var finderWidth = finderElement.outerWidth();
        var finderHeight = finderElement.outerHeight();

        // 缩放比例
        var scaleX;
        var scaleY;

        // thumbnail 偏移坐标
        var thumbnailOffset;

        var scaledImageReady = function () {

            var imageUrl = me.option('imageUrl');

            imageDimension(
                imageUrl,
                function (rawWidth, rawHeight) {

                    scaleX = thumbnailWidth / rawWidth;
                    scaleY = thumbnailHeight / rawHeight;

                    viewportElement.css({
                        width: finderWidth / scaleX,
                        height: finderHeight / scaleY,
                        background: 'url(' + imageUrl + ') no-repeat'
                    });

                }
            );

        };

        var namespace = me.namespace();

        if (!thumbnailWidth && !thumbnailHeight) {
            thumbnailElement
                .one('load' + namespace, function () {
                    thumbnailWidth = this.width;
                    thumbnailHeight = this.height;
                    scaledImageReady();
                });
        }
        else {
            scaledImageReady();
        }



        var dragger = new Draggable({
            mainElement: finderElement,
            containerElement: thumbnailElement,
            dragAnimation: function (options) {
                finderElement.css(options.mainStyle);
            },
            init: function (options) {

                var enterType = 'mouseenter' + namespace;
                var leaveType = 'mouseleave' + namespace;

                var delayTimer;

                var clearTimer = function () {
                    if (delayTimer) {
                        clearTimeout(delayTimer);
                        delayTimer = null;
                    }
                };

                var leaveHandler = function () {
                    delayTimer = setTimeout(
                        function () {
                            delayTimer = null;
                            options.upHandler();
                            document.off(namespace);
                        },
                        50
                    );
                };

                thumbnailElement
                    .on(enterType, function () {

                        if (delayTimer) {
                            clearTimer();
                            return;
                        }

                        var data = {
                            offsetX: finderWidth / 2,
                            offsetY: finderHeight / 2
                        };

                        if (!options.downHandler(data)) {
                            return;
                        }

                        thumbnailOffset = thumbnailElement.position();

                        document
                            .off(namespace)
                            .on('mousemove' + namespace, options.moveHandler);

                    })
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
                var left = (data.left - thumbnailOffset.left) / scaleX;
                var top = (data.top - thumbnailOffset.top) / scaleY;
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

        me.inner('dragger').dispose();

        var namespace = me.namespace();
        document.off(namespace);

        me.option('thumbnailElement').off(
            namespace
        );
        me.option('finderElement').off(
            namespace
        );

    };

    lifeUtil.extend(proto);


    return Zoom;

});