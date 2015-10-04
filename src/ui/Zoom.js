/**
 * @file 放大镜
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var isHidden = require('../function/isHidden');
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

        // 视口尺寸（根据比例自动计算）
        var viewportWidth;
        var viewportHeight;

        // 缩放比例
        var scaleX;
        var scaleY;

        var scaledImageReady = function () {

            // 取景器尺寸
            finderWidth = finderElement.innerWidth();
            finderHeight = finderElement.innerHeight();

            rawImageReady();

        };

        var rawImageReady = function () {

            if (!finderWidth || !finderHeight) {
                return;
            }

            scaleX = scaledWidth / rawWidth;
            scaleY = scaledHeight / rawHeight;

            viewportWidth = finderWidth / scaleX;
            viewportHeight = finderHeight / scaleY;

            viewportElement.css({
                width: viewportWidth,
                height: viewportHeight,
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

                thumbnailElement
                    .on(
                        'mouseenter' + namespace,
                        function (e) {

                            var offset = finderElement.offset();

                            e.clientX = offset.left + finderWidth / 2;
                            e.clientY = offset.top + finderHeight / 2;

                            options.downHandler(e);
                            document
                                .off(namespace)
                                .on('mousemove' + namespace, options.moveHandler);
                        }
                    )
                    .on(
                        'mouseleave' + namespace,
                        function (e) {
                            options.upHandler(e);
                            document.off(namespace);
                        }
                    );

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
                var left = data.left / scaleX;
                var top = data.top / scaleY;
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