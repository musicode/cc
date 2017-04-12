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

            var timeoutTimer;
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
                if (status === me.status) {
                    return;
                }
                currentTime = $.now();
                if (prevTime && currentTime - prevTime < 500) {
                    return;
                }
                prevTime = currentTime;

                if (timeoutTimer) {
                    clearTimeout(timeoutTimer);
                    timeoutTimer = null;
                }
                if (status === STATUS_PLAYING) {
                    loadSuccess[element.src] = true;
                }
                setStatus(status, name);
            };

            var wrapper =
            this.wrapper = $(element);

            wrapper
                .on('play' + namespace, function () {
                    callHook(STATUS_LOADING, 'onLoading');
                    timeoutTimer = setTimeout(
                        function () {
                            if (me.disposed
                                || me.status !== STATUS_LOADING
                                || !element.paused
                                || !loadSuccess[element.src]
                                ) {
                                return;
                            }
                            callHook(STATUS_TIMEOUT, 'onTimeout');
                        },
                        me.timeout
                    );
                })
                .on('canplay' + namespace, function () {
                    loadSuccess[element.src] = true;
                })
                .on('playing' + namespace, function () {
                    callHook(STATUS_PLAYING, 'onPlaying');
                })
                .on('timeupdate' + namespace, function () {
                    callHook(STATUS_PLAYING, 'onPlaying');
                })
                .on('pause' + namespace, function () {
                    if (me.status === STATUS_PLAYING) {
                        callHook(STATUS_PAUSED, 'onPaused');
                    }
                })
                // 报错，比如不支持的格式，或视频源不存在
                .on('error' + namespace, function () {
                    if (me.status === STATUS_LOADING
                        && !loadSuccess[element.src]
                    ) {
                        callHook(STATUS_ERROR, 'onError');
                    }
                })
                // 网络状况不佳，导致视频下载中断
                .on('stalled' + namespace, function () {
                    if (me.status === STATUS_LOADING
                        && !loadSuccess[element.src]
                    ) {
                        callHook(STATUS_STALLED, 'onStalled');
                    }
                });

        },

        play: function (source) {
            var element = this.element;
            if (source) {
                var currentSource = element.src;
                if (currentSource) {
                    if (source !== currentSource) {
                        element.src = source;
                        if ($.isFunction(this.onSourceChange)) {
                            this.onSourceChange();
                        }
                    }
                    else {
                        element.src = '';
                        element.src = source;
                    }
                }
                else {
                    element.src = source;
                }
            }
            this.status = STATUS_WAITING;
            element.play();
        },

        pause: function () {
            this.element.pause();
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
            me.wrapper.off(me.namespace);
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