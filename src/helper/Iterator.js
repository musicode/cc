/**
 * @file DOM 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Keyboard = require('./Keyboard');

    var timer = require('../util/timer');
    var lifeCycle = require('../util/lifeCycle');

    /**
     *
     * @constrctor
     * @param {Object} options
     * @property {jQuery} options.watchElement 监听键盘事件的元素
     * @property {number} options.index 当前索引
     * @property {number} options.minIndex 最小索引
     * @property {number} options.maxIndex 最大索引
     * @property {number=} options.defaultIndex 默认索引，默认是 -1
     * @property {string=} options.prevKey prev 操作对应的键名，默认是方向键上（up）
     * @property {string=} options.nextKey next 操作对应的键名，默认是方向键下（down）
     * @property {boolean=} options.loop 是否可循环遍历，默认循环
     * @property {number=} options.interval 长按时的遍历时间间隔，单位毫秒，值越小遍历速度越快
     *
     */
    function Iterator(options) {
        lifeCycle.init(this, options);
    }

    var proto = Iterator.prototype;

    proto.init = function () {

        var me = this;

        var prev = $.proxy(me.prev, me);
        var next = $.proxy(me.next, me);

        var shortcut = { };

        shortcut[ me.option('prevKey') ] = function (e, data) {
            if (data.isLongPress) {
                return;
            }
            prev();
        };

        shortcut[ me.option('nextKey') ] = function (e, data) {
            if (data.isLongPress) {
                return;
            }
            next();
        };

        var keyboard = new Keyboard({
            watchElement: me.option('watchElement'),
            shortcut: shortcut
        });




        var start = $.proxy(me.start, me);
        var pause = $.proxy(me.pause, me);

        keyboard
        .before('longpress', start)
        .after('longpress', pause);




        var interval = me.option('interval');
        var prevTimer = timer(prev, interval);
        var nextTimer = timer(next, interval);

        me
        .after('prev', function () {
            me.inner('timer', prevTimer);
        })
        .after('next', function () {
            me.inner('timer', nextTimer);
        });




        me.inner('keyboard', keyboard);

        me.set({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
        });


    };

    proto.start = function () {

        this.inner('timer').start();

    };

    proto.pause = function () {

        var me = this;

        me.inner('timer').stop();
        me.inner('timer', null);

    };

    proto._start =
    proto._pause = function () {
        if (!this.inner('timer')) {
            return false;
        }
    };

    proto.stop = function () {

        var me = this;

        me.pause();
        me.set(
            'index',
            me.option('defaultIndex')
        );

    };

    proto.prev = function () {

        var me = this;

        var index = me.get('index') - 1;
        if (index < me.get('minIndex')) {
            index = me.get('maxIndex');
        }

        me.set('index', index, { action: 'prev' });

    };

    proto._prev = function () {
        var me = this;
        if (me.get('index') - 1 < me.get('minIndex')) {
            if (!me.option('loop')) {
                return false;
            }
        }
    };

    proto.next = function () {

        var me = this;

        var index = me.get('index') + 1;
        if (index > me.get('maxIndex')) {
            index = me.get('minIndex');
        }

        me.set('index', index, { action: 'next' });

    };

    proto._prev = function () {

        var me = this;

        if (me.get('index') + 1 < me.get('maxIndex')) {
            if (!me.option('loop')) {
                return false;
            }
        }

    };

    proto.dispose = function () {

        var me = this;

        me.stop();
        me.inner('keyboard').dispose();

    };

    lifeCycle.extend(proto);


    Iterator.defaultOptions = {
        loop: true,
        interval: 60,
        minIndex: 0,
        defaultIndex: -1,
        prevKey: 'up',
        nextKey: 'down'
    };

    Iterator.propertyValidator = {

        index: function (index) {

            if ($.type(index) !== 'number') {

                index = this.option('defaultIndex');

                if ($.type(index) !== 'number') {
                    throw new Erro('[Cobble Error] Iterator index is not a number.');
                }
            }

            return index;

        }
    };


    return Iterator;

});