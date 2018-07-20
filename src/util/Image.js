/**
 * @file 封装图片优化
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var supportWebp = require('../function/supportWebp');

    var webpSupported;

    supportWebp().then(function () {
        webpSupported = true;
    });

    var namespace = '.cc_util_image';

    var STATUS_EMPTY = 0;
    var STATUS_LOADING = 1;
    var STATUS_SUCCESS = 2;
    var STATUS_FAILURE = 3;
    var STATUS_TIMEOUT = 4;
    var STATUS_ABORT = 5;

    /**
     * 封装图片优化
     *
     * @param {Object} options
     * @property {string} options.url 图片 url
     * @property {?string} options.template 图片模板
     * @property {?Array<string>} options.hostFallbacks 图片备份 host
     * @property {?number} options.width 图片显示宽度
     * @property {?number} options.height 图片显示高度
     * @property {?number} options.quality 图片显示质量
     * @property {?boolean} options.hasWebp 是否有 webp 图片源
     * @property {?number} options.timeout 超时时间，单位是毫秒
     * @property {Function} options.compress 图片压缩，返回实际加载的图片 url
     * @property {?Function} options.onLoading 开始加载
     * @property {?Function} options.onSuccess 加载成功
     * @property {?Function} options.onFailure 加载失败
     * @property {?Function} options.onTimeout 加载超时
     * @property {?Function} options.onAbort 加载中断
     * @property {?Function} options.onSame 更新时没有变化时触发
     */
    function Image(options) {
        $.extend(this, options);
        this.status = STATUS_EMPTY;
    }

    Image.prototype = {

        constructor: Image,

        load: function () {

            var me = this;

            var width = me.width;
            var height = me.height;
            var quality = me.quality;
            var needWebp = webpSupported && me.hasWebp;

            var url = me.url;
            var url1X = me.compress(url, width, height, quality, 1, needWebp);
            var url2X = me.compress(url, width, height, quality, 2, needWebp);

            // 没必要 3X、4X 了，肉眼已无法分辨

            var element = me.element || (me.element = $(me.template || '<img>'));

            if (me.status === STATUS_SUCCESS
                && element.prop('src') === url1X
            ) {
                if (me.onSame) {
                    me.onSame();
                }
                return;
            }

            var removeTimer = function () {
                if (me.timer) {
                    clearTimeout(me.timer);
                    me.timer = null;
                }
            };

            var hostFallbacks = me.hostFallbacks;
            if (hostFallbacks && !hostFallbacks.length) {
                hostFallbacks = null;
            }

            var hostIndex = -1;

            var loadComplete = function (status, hook) {

                if (hook === 'onFailure' || hook === 'onTimeout' && hostFallbacks) {
                    hostIndex++;
                    if (hostFallbacks[hostIndex]) {
                        var pattern = /(https?:\/\/)[^\/]+(\/.+)/;
                        var replacement = '$1' + hostFallbacks[hostIndex] + '$2';
                        loadImage(
                            element,
                            url.replace(pattern, replacement),
                            url1X.replace(pattern, replacement),
                            url2X.replace(pattern, replacement)
                        );
                        return;
                    }
                }
                me.status = status;
                removeTimer();
                element.off(namespace);
                if (hook && me[hook]) {
                    me[hook]();
                }
            };

            if (me.status === STATUS_LOADING) {
                loadComplete(STATUS_EMPTY);
            }

            me.status = STATUS_LOADING;

            if (me.onLoading) {
                me.onLoading();
            }

            element
                .on('load' + namespace, function () {
                    loadComplete(STATUS_SUCCESS, 'onSuccess');
                })
                .on('error' + namespace, function () {
                    loadComplete(STATUS_FAILURE, 'onFailure');
                })
                .on('abort' + namespace, function () {
                    loadComplete(STATUS_ABORT, 'onAbort');
                });

            var loadImage = function (element, url, url1X, url2X) {

                removeTimer();

                if (me.timeout > 0) {
                    me.timer = setTimeout(
                        function () {
                            me.timer = null;
                            loadComplete(STATUS_TIMEOUT, 'onTimeout');
                        },
                        me.timeout
                    );
                }

                element
                .prop({
                    src: url1X,
                    srcset: url2X + ' 2x'
                })
                .attr({
                    'data-raw': url,
                    'data-real': window.devicePixelRatio > 1 ? url2X : url1X
                });

            };

            loadImage(element, url, url1X, url2X);

        },

        abort: function () {
            var element = this.element;
            if (element && element[0].abort) {
                element[0].abort();
            }
        },

        update: function (width, height, quality) {
            var me = this;
            var status = me.status;

            if (width !== me.width
                || height !== me.height
                || quality !== me.quality
            ) {
                if (status === STATUS_LOADING) {
                    me.abort();
                }
                else if (status === STATUS_SUCCESS) {
                    // 从大到小不用重新加载
                    if (width < me.width && height < me.height) {
                        if (me.onSame) {
                            me.onSame();
                        }
                        return;
                    }
                }
                me.width = width;
                me.height = height;
                me.quality = quality;
                me.load();
            }
            else if (status === STATUS_SUCCESS) {
                if (me.onSame) {
                    me.onSame();
                }
            }
            else if (status === STATUS_LOADING) {
                if (me.onLoading) {
                    me.onLoading();
                }
            }
            else if (status === STATUS_TIMEOUT
                || status === STATUS_FAILURE
            ) {
                if (me.element) {
                    me.element.remove();
                    me.element = null;
                }
                me.load();
            }
            else if (status === STATUS_EMPTY) {
                me.load();
            }
        },

        getWidth: function () {
            var element = this.element
            return element.width() || 0;
        },

        getHeight: function () {
            var element = this.element
            return element.height() || 0;
        },

        remove: function () {
            var element = this.element
            if (element) {
                var el = element[0];
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }
        },

        appendTo: function (container) {
            var element = this.element
            if (element) {
                container.append(element);
            }
        },

        prependTo: function (container) {
            var element = this.element
            if (element) {
                container.prepend(element);
            }
        },

        dispose: function () {
            var me = this;
            if (me.timer) {
                clearTimeout(me.timer);
                me.timer = null;
            }
            if (me.element) {
                me.element.remove();
                me.element = null;
            }
            me.status = STATUS_EMPTY;
        }

    };

    Image.STATUS_EMPTY = STATUS_EMPTY;
    Image.STATUS_LOADING = STATUS_LOADING;
    Image.STATUS_SUCCESS = STATUS_SUCCESS;
    Image.STATUS_FAILURE = STATUS_FAILURE;
    Image.STATUS_TIMEOUT = STATUS_TIMEOUT;
    Image.STATUS_ABORT = STATUS_ABORT;

    return Image;

});
