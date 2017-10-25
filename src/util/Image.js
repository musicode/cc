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

    function tryWebp(url) {
        if (!webpSupported) {
            return url;
        }
        var terms = url.split('.');
        terms.pop();
        terms.push('webp');
        return terms.join('.');
    }

    /**
     * 封装图片优化
     *
     * @param {Object} options
     * @property {string} options.url 图片 url
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

            var url = me.url;
            var url1X = me.compress(url, me.width, me.height, me.quality, 1);
            var url2X = me.compress(url, me.width, me.height, me.quality, 2);

            // 没必要 3X、4X 了，肉眼已无法分辨

            if (me.hasWebp) {
                url1X = tryWebp(url1X);
                url2X = tryWebp(url2X);
            }

            var element = me.element || (me.element = $('<img>'));

            if (me.status === STATUS_SUCCESS && element.prop('src') === url1X) {
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

            var loadComplete = function (status, hook) {
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
                .one('load' + namespace, function () {
                    loadComplete(STATUS_SUCCESS, 'onSuccess');
                })
                .one('error' + namespace, function () {
                    loadComplete(STATUS_FAILURE, 'onFailure');
                })
                .one('abort' + namespace, function () {
                    loadComplete(STATUS_ABORT, 'onAbort');
                });

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

            var props = {
                src: url1X
            };
            if (url2X !== url1X) {
                props.srcset = url2X + ' 2x';
            }

            element
            .prop(props)
            .attr({
                'data-raw': url,
                'data-real': window.devicePixelRatio > 1 ? url2X : url1X
            });

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
