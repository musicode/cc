/**
 * @file DOM 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Keyboard = require('./Keyboard');
    var Iterator = require('./Iterator');

    var lifeCycle = require('../util/lifeCycle');
    var keyboardUtil = require('../util/keyboard');

    /**
     *
     * @constrctor
     * @param {Object} options
     * @property {jQuery} options.watchElement 监听键盘事件的元素
     * @property {number} options.index 当前索引
     * @property {number} options.minIndex 最小索引
     * @property {number} options.maxIndex 最大索引
     * @property {number=} options.defaultIndex 默认索引，默认是 -1
     * @property {number=} options.interval 长按时的遍历时间间隔，单位毫秒，值越小遍历速度越快
     * @property {number=} options.step prev 和 next 的步进值，默认是 1
     * @property {boolean=} options.loop 是否可循环遍历，默认循环
     * @property {string=} options.prevKey prev 操作对应的键名，默认是方向键上（up）
     * @property {string=} options.nextKey next 操作对应的键名，默认是方向键下（down）
     *
     */
    function ElementIterator(options) {
        lifeCycle.init(this, options);
    }

    var proto = ElementIterator.prototype;

    proto.init = function () {

        var me = this;

        var iterator = new Iterator({
            defaultIndex: me.option('defaultIndex'),
            interval: me.option('interval'),
            loop: me.option('loop'),
            change: {
                index: function (newIndex, oldIndex, changes) {
                    me.set('index', newIndex, changes.index);
                },
                minIndex: function (minIndex) {
                    me.set('minIndex', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxIndex', maxIndex);
                }
            }
        });


        var prevKey = me.option('prevKey');
        var nextKey = me.option('nextKey');

        var shortcut = { };
        shortcut[ prevKey ] = function (e, data) {
            if (!data.isLongPress) {
                iterator.prev();
            }
        };
        shortcut[ nextKey ] = function (e, data) {
            if (!data.isLongPress) {
                iterator.next();
            }
        };

        var keyboard = new Keyboard({
            watchElement: me.option('watchElement'),
            shortcut: shortcut
        });

        var prevKeyCode = keyboardUtil[ prevKey ];
        var nextKeyCode = keyboardUtil[ nextKey ];

        keyboard
        .before('longpress', function (e, data) {

            var reserve;
            var keyCode = data.keyCode;

            if (keyCode === prevKeyCode) {
                reserve = true;
            }
            else if (keyCode === nextKeyCode) {
                reserve = false;
            }

            if (reserve != null) {
                iterator.start(reserve);
            }

        })
        .after('longpress', function () {

            iterator.pause();

        });


        me.inner({
            iterator: iterator,
            keyboard: keyboard
        });

        me.set({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
        });

    };

    proto.start = function (reserve) {
        this.inner('iterator').start(reserve);
    };

    proto.pause = function () {
        this.inner('iterator').pause();
    };

    proto.stop = function () {
        this.inner('iterator').stop();
    };

    proto.prev = function () {
        this.inner('iterator').prev();
    };

    proto.next = function () {
        this.inner('iterator').next();
    };

    proto.dispose = function () {

        var me = this;

        me.inner('iterator').dispose();
        me.inner('keyboard').dispose();

    };

    lifeCycle.extend(proto);


    ElementIterator.defaultOptions = {
        loop: true,
        interval: 100,
        step: 1,
        index: 0,
        minIndex: 0,
        defaultIndex: -1,
        prevKey: 'up',
        nextKey: 'down'
    };

    ElementIterator.propertyUpdater = {

        index: function (index) {
            this.inner('iterator').set('index', index);
        },
        minIndex: function (minIndex) {
            this.inner('iterator').set('minIndex', minIndex);
        },
        maxIndex: function (maxIndex) {
            this.inner('iterator').set('maxIndex', maxIndex);
        }

    };


    return ElementIterator;

});