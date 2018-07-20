/**
 * @file 封装 video/audio 标签
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var STATUS_WAITING = 0;
    var STATUS_LOADING = 1;
    var STATUS_PLAYING = 2;
    var STATUS_PAUSED = 3;
    var STATUS_ERROR = 4;
    var STATUS_STALLED = 5;
    var STATUS_TIMEOUT = 6;

    var loadSuccess = { };

    /**
     * 封装 video/audio 标签
     *
     * @param {Object} options
     * @property {HTMLElement} options.element 多媒体元素 <video>、<audio>
     * @property {?number} options.timeout 超时时间，单位是毫秒
     * @property {?Function} options.onLoading 开始加载
     * @property {?Function} options.onPlaying 开始播放
     * @property {?Function} options.onPaused 暂停播放
     * @property {?Function} options.onError 加载错误
     * @property {?Function} options.onStalled 加载中断
     * @property {?Function} options.onTimeout 加载超时
     * @property {?Function} options.onSourceChange 源变化时触发
     */
    function Media(options) {
        $.extend(this, options);
        this.status = STATUS_WAITING;
        this.init();
    }

    Media.prototype = {

        constructor: Media,

        init: function () {

            var me = this;
            var element = me.element;

            var namespace =
            me.namespace = '.cc_util_media' + Math.random();

            var prevTime;
            var currentTime;

            var setStatus = function (status, name) {
                me.status = status;
                if ($.isFunction(me[name])) {
                    me[name]();
                }
            };

            // 有些奇葩浏览器，会在触发 play 之后立即触发 pause
            // 简直无法理解...
            var callHook = function (status, name) {
                // 当 element.src = '' 时，读取出来是当前页面的 url
                if (me.disposed
                  || !element.src
                  || element.src === location.href
                  || status === me.status
                ) {
                    return;
                }
                currentTime = $.now();
                if (prevTime && currentTime - prevTime < 500) {
                    return;
                }
                prevTime = currentTime;
                if (me.playTimer) {
                    clearTimeout(me.playTimer);
                    me.playTimer = null;
                }
                if (status === STATUS_PLAYING) {
                    loadSuccess[element.src] = true;
                }
                setStatus(status, name);
            };

            me.timeoutHandler = function () {
                if (me.disposed
                    || !element.paused
                    || loadSuccess[element.src]
                ) {
                    return;
                }
                callHook(STATUS_TIMEOUT, 'onTimeout');
            };

            var wrapper =
            me.wrapper = $(element);

            var playingHandler = function () {
                callHook(STATUS_PLAYING, 'onPlaying');
            };

            wrapper
                .on('play' + namespace, function () {
                    if (me.status !== STATUS_PLAYING) {
                        callHook(STATUS_LOADING, 'onLoading');
                    }
                })
                .on('canplay' + namespace, function () {
                    loadSuccess[element.src] = true;
                })
                .on('playing' + namespace, playingHandler)
                .on('timeupdate' + namespace, playingHandler)
                .on('pause' + namespace, function () {
                    if (me.status === STATUS_PLAYING) {
                        callHook(STATUS_PAUSED, 'onPaused');
                    }
                })
                // 报错，比如不支持的格式，或视频源不存在
                .on('error' + namespace, function () {
                    if (me.status !== STATUS_PLAYING) {
                        callHook(STATUS_ERROR, 'onError');
                    }
                })
                // 网络状况不佳，导致视频下载中断
                .on('stalled' + namespace, function () {
                    if (me.status !== STATUS_PLAYING) {
                        callHook(STATUS_STALLED, 'onStalled');
                    }
                });
        },

        play: function (source) {
            var me = this;
            var element = me.element;
            if (source) {
                var currentSource = element.src;
                if (currentSource) {
                    if (source !== currentSource) {
                        me.setSource(source)
                        if ($.isFunction(me.onSourceChange)) {
                            me.onSourceChange();
                        }
                    }
                }
                else {
                    me.setSource(source)
                }
            }
            if (me.timeout) {
                if (me.playTimer) {
                    clearTimeout(me.playTimer);
                }
                me.playTimer = setTimeout(
                    me.timeoutHandler,
                    me.timeout
                );
            }
            me.status = STATUS_WAITING;
            element.load();
            element.play();
        },

        setSource: function (source) {
            try {
                this.element.src = source;
            }
            catch (e) {

            }
        },

        show: function () {
            this.wrapper.show();
        },

        hide: function () {
            this.wrapper.hide();
        },

        getWidth: function () {
            return this.element.clientWidth || 0;
        },

        setWidth: function (width) {
            this.element.width = width;
        },

        getHeight: function () {
            return this.element.clientHeight || 0;
        },

        setHeight: function (height) {
            this.element.height = height;
        },

        remove: function () {
            var element = this.element;
            element.pause();
            var parent = element.parentNode;
            if (parent) {
                parent.removeChild(element);
            }
        },

        dispose: function () {
            var me = this;
            this.wrapper.off(this.namespace);
            me.remove();
            me.disposed = true;
        }

    };

    Media.STATUS_WAITING = STATUS_WAITING;
    Media.STATUS_LOADING = STATUS_LOADING;
    Media.STATUS_PLAYING = STATUS_PLAYING;
    Media.STATUS_PAUSED = STATUS_PAUSED;
    Media.STATUS_ERROR = STATUS_ERROR;
    Media.STATUS_STALLED = STATUS_STALLED;
    Media.STATUS_TIMEOUT = STATUS_TIMEOUT;

    return Media;

});