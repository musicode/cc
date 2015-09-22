/**
 * @file Message
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 解决 iframe 嵌套其他域页面的兼容问题
     *
     * 被嵌套页面需加载此 js，才能和 top window 进行通讯
     *
     * 1. 如果支持 postMessage，就用 postMessage
     *
     *     window.onmessage = function (e) {
     *         e = e || event; // 兼容 IE8
     *         if (e.origin === 'http://xxx') { // 安全校验
     *             console.log(e.data);
     *         }
     *     };
     *
     *
     * 2. 如果不支持 postMessage, 就要用到代理页，代理页和嵌入页同域，
     *
     *    如 baidu.com 要嵌入 jd.com，需要加一个 baidu.com/agent.html 作为代理页
     *
     *    因为不支持 postMessage 的浏览器只有 IE67，且它们同样不支持 hashchange 事件，
     *    所以只能用轮询监听 hash 变化
     *
     *     function poll() {
     *         var hash = location.hash.slice(1);
     *         top.window.onmessage({
     *             origin: 'http://baidu.com',
     *             data: { }  // 把 hash 解析成 object
     *         });
     *         setTimeout(poll, 100);
     *     }
     *     poll();
     *
     *     上面的代码使用到 top.window.onmessage
     *     因此 baidu.com 可以用一个 window.onmessage 函数搞定
     *     不用再次判断是否支持 postMessage 了
     */

    var timer = require('../function/timer');
    var guid = require('../function/guid');

    var urlUtil = require('./url');

    /**
     * Message 构造函数
     *
     * @constructor
     * @param {Object} options
     * @property {string} options.agentUrl 代理页面，必须和最终产品页域名保持一致
     * @property {number=} options.interval 间隔时间，默认 100 ms 发送一次信息
     * @property {Function():Object} options.reader 读取当前页面信息的函数
     */
    function Message(options) {
        $.extend(this, Message.defaultOptions, options);
        this.init();
    }

    var proto = Message.prototype;

    proto.type = 'Message';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        me.id = guid();
        me.origin = urlUtil.getOrigin(me.agentUrl);

        me.timer = timer(
            function () {
                me.send(me.reader() || { });
            },
            me.interval,
            me.interval
        );

        me.timer.start();

    };

    /**
     * 发送信息
     */
    proto.send = $.isFunction(window.postMessage)
        && 'onmessage' in window

        ? function (data) {
            // postMessage 可以完美跨域
            window.top.postMessage(
                data,
                this.origin
            );
        }

        : function (data) {

            // 创建同域代理 iframe，同域才能通信
            var me = this;

            var iframe = $('#' + me.id);
            if (iframe.length === 0) {
                iframe = $('<iframe id="' + me.id  + '"></iframe>')
                iframe.hide().appendTo('body');
            }

            iframe.prop(
                'src',
                me.agentUrl + '#' + $.param(data)
            );

        };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        me.timer.stop();
        me.timer = null;

    };

    /**
     * 默认配置
     *
     * @type {Object}
     */
    Message.defaultOptions = {
        interval: 100
    };


    return Message;

});