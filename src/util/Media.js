/**
 * @file 封装 video/audio 标签
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var debounce = require('../function/debounce');

    var STATUS_WAITING = 0;
    var STATUS_LOADING = 1;
    var STATUS_PLAYING = 2;
    var STATUS_PAUSED = 3;
    var STATUS_ERROR = 4;
    var STATUS_STALLED = 5;
    var STATUS_TIMEOUT = 6;

    // 有些手机是 0.01....
    function isEffectiveTime(time) {
        return time > 0.1;
    }

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

            me.initTime = $.now();
            me.loadSuccess = { };

            var timeoutTimer;
            var prevTime;

            var setStatus = function (status, name) {
                me.status = status;
                if ($.isFunction(me[name])) {
                    me[name]();
                }
            };

            // 有些奇葩浏览器，会在触发 play 之后立即触发 pause
            // 简直无法理解...
            var callHook = debounce(
                function (status, name) {
                    if (timeoutTimer) {
                        clearTimeout(timeoutTimer);
                        timeoutTimer = null;
                    }
                    if (status !== me.status) {
                        if (status === STATUS_PLAYING) {
                            if (isEffectiveTime(element.currentTime)) {
                                me.loadSuccess[element.src] = true;
                            }
                            else {
                                // 移动端通常会触发了 playing
                                // 其实并没有开始播放
                                setStatus(STATUS_PAUSED, 'onPaused');
                                return;
                            }
                        }
                        setStatus(status, name);
                    }
                },
                500,
                true
            );


            element.onplay = function () {
                callHook(STATUS_LOADING, 'onLoading');
                timeoutTimer = setTimeout(
                    function () {
                        if (me.disposed
                            || me.status !== STATUS_LOADING
                            || isEffectiveTime(element.currentTime)
                            || !element.paused
                            || !me.loadSuccess[element.src]
                        ) {
                            return;
                        }
                        callHook(STATUS_TIMEOUT, 'onTimeout');
                    },
                    me.timeout
                );
            };

            element.oncanplay = function () {
                me.loadSuccess[element.src] = true;
            };

            element.onplaying = function () {
                callHook(STATUS_PLAYING, 'onPlaying');
            };

            element.ontimeupdate = function () {
                callHook(STATUS_PLAYING, 'onPlaying');
            };

            element.onpause = function () {
                if (me.status === STATUS_PLAYING) {
                    callHook(STATUS_PAUSED, 'onPaused');
                }
            };

            // 报错，比如不支持的格式，或视频源不存在
            element.onerror = function () {
                if (me.status === STATUS_LOADING
                    && !me.loadSuccess[element.src]
                ) {
                    callHook(STATUS_ERROR, 'onError');
                }
            };

            // 网络状况不佳，导致视频下载中断
            element.onstalled = function () {
                if (me.status === STATUS_LOADING
                    && !me.loadSuccess[element.src]
                ) {
                    callHook(STATUS_STALLED, 'onStalled');
                }
            };

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
            var parent = element.parentNode;
            if (parent) {
                parent.removeChild(element);
            }
        },

        dispose: function () {
            var me = this;
            me.element.src = '';
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