/**
 * @file DOM 遍历器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var Keyboard = require('./Keyboard');
    var Iterator = require('./Iterator');

    var lifeUtil = require('../util/life');
    var keyboardUtil = require('../util/keyboard');

    /**
     *
     * @constrctor
     * @param {Object} options
     * @property {jQuery} options.watchElement 监听键盘事件的元素
     * @property {number} options.index 当前索引
     * @property {number} options.minIndex 最小索引
     * @property {number} options.maxIndex 最大索引
     * @property {number} options.defaultIndex 默认索引
     * @property {number} options.interval 长按时的遍历时间间隔，单位毫秒，值越小遍历速度越快
     * @property {number} options.step prev 和 next 的步进值
     * @property {boolean=} options.loop 是否可循环遍历
     * @property {string} options.prevKey prev 操作对应的键名，键名参考 util/keyboard
     * @property {string} options.nextKey next 操作对应的键名，键名参考 util/keyboard
     *
     */
    function DOMIterator(options) {
        lifeUtil.init(this, options);
    }

    var proto = DOMIterator.prototype;

    proto.init = function () {

        var me = this;

        var iterator = new Iterator({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex'),
            defaultIndex: me.option('defaultIndex'),
            interval: me.option('interval'),
            step: me.option('step'),
            loop: me.option('loop'),
            propertyChange: {
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

        var watchElement = me.option('watchElement');
        var keyboard = new Keyboard({
            watchElement: watchElement,
            shortcut: shortcut
        });

        var playing = false;

        keyboard
        .before('longpress', function (e, data) {

            var reserve;
            var keyCode = data.keyCode;

            if (keyCode === keyboardUtil[ prevKey ]) {
                reserve = true;
            }
            else if (keyCode === keyboardUtil[ nextKey ]) {
                reserve = false;
            }

            if (reserve != null) {
                playing = true;
                iterator.start(reserve);
            }

        })
        .after('longpress', function () {

            if (playing) {
                playing = false;
                iterator.pause();
            }

        });

        if (watchElement.is(':text')) {
            keyboard
                .on('keydown', function (e) {
                    // 处理某些浏览器按方向键上会导致光标跑到最左侧
                    if (e.keyCode === keyboardUtil.up) {
                        e.preventDefault();
                    }
                });
        }


        me.inner({
            iterator: iterator,
            keyboard: keyboard
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
        this.inner('iterator').dispose();
        this.inner('keyboard').dispose();
    };

    lifeUtil.extend(proto);

    DOMIterator.propertyUpdater = {
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

    return DOMIterator;

});