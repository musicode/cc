/**
 * @file AutoComplete
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var contains = require('../function/contains');
    var autoScrollUp = require('../function/autoScrollUp');
    var autoScrollDown = require('../function/autoScrollDown');

    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');
    var Iterator = require('../helper/ElementIterator');

    var browser = require('../util/browser');
    var lifeCycle = require('../util/lifeCycle');

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.inputElement 输入框元素
     *
     * @property {jQuery} options.menuElement 菜单元素，菜单最好用样式设置好位置，这样直接 show 出来，无需涉及定位逻辑
     * @property {string=} options.menuTemplate 菜单模板
     *
     * @property {string=} options.itemSelector 菜单项选择器，默认是 li
     * @property {string=} options.itemActiveClass 菜单项 active 时的 className
     *
     * @property {number=} options.interval 长按上下键遍历的等待间隔时间，默认 60ms
     * @property {boolean=} options.cache 是否开启缓存
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框，默认包含
     * @property {boolean=} options.autoScroll 遍历时是否自动滚动，菜单出现滚动条时可开启，默认不开启
     *
     * @property {string=} options.showMenuTrigger 显示的触发方式
     * @property {number=} options.showMenuDelay 显示延时
     * @property {Function=} options.showMenuAnimate 显示动画
     *
     * @property {string=} options.hideMenuTrigger 隐藏的触发方式
     * @property {number=} options.hideMenuDelay 隐藏延时
     * @property {Function=} options.hideMenuAnimate 隐藏动画
     *
     * @property {Function=} options.renderTemplate 配置模板引擎的 render 方法，方法签名是 (data, tpl): string
     *
     * @property {Function} options.loadData 加载数据，可以是远程或本地数据
     *
     */
    function AutoComplete(options) {
        lifeCycle.init(this, options);
    }

    var proto = AutoComplete.prototype;

    proto.type = 'AutoComplete';

    proto.init = function () {

        var me = this;

        var inputElement = me.option('inputElement');

        var menuElement = me.option('menuElement');
        var autoScroll = me.option('autoScroll');
        var itemSelector = me.option('itemSelector');
        var itemActiveClass = me.option('itemActiveClass');

        // 当前选中的索引
        var activeIndex;

        // 可遍历的数据
        var iteratorData = [
            {
                element: inputElement,
                data: {
                    text: inputElement.val()
                }
            }
        ];

        var processIndex = function (index, callback) {
            var item = iteratorData[ index ];
            if (item) {
                callback(item.element, item.data);
            }
        };

        var iterator = new Iterator({
            watchElement: inputElement,
            defaultIndex: 0,
            minIndex: me.option('includeInput') ? 0 : 1,
            interval: me.option('interval'),
            change: {
                index: function (newIndex, oldIndex, changes) {

                    var diff = changes.index;

                    var action = diff.action;

                    processIndex(activeIndex, function (itemElement) {
                        if (itemActiveClass
                            && itemElement[ 0 ] !== inputElement[ 0 ]
                        ) {
                            itemElement.removeClass(itemActiveClass);
                        }
                    });

                    activeIndex = newIndex;

                    processIndex(activeIndex, function (itemElement, itemData) {

                        if (itemActiveClass
                            && itemElement[ 0 ] !== inputElement[ 0 ]
                        ) {
                            itemElement.addClass(itemActiveClass);
                        }

                        if (valueActionMap[ action ]) {
                            inputElement.val(itemData.text);
                        }

                        if (autoScroll) {
                            var fn = action === 'prev'
                                   ? autoScrollUp
                                   : autoScrollDown;

                            fn(menuElement, itemElement);
                        }

                    });
                }
            }
        });





        var keyboardAction = {
            enter: function (e, data) {

                if (data.isLongPress) {
                    return;
                }

                if (!popup.get('hidden')) {
                    me.close();
                }

                processIndex(activeIndex, function (element, data) {
                    me.emit('enter', data);
                });

            }
        };

        // chrome 按方向键上会导致光标跑到最左侧
        if (browser.chrome) {
            keyboardAction.up = function (e) {
                e.preventDefault();
            };
        }

        var cache;

        if (me.option('cache')) {
            cache = { };
        }

        var suggest = function () {

            var query = $.trim(iteratorData[ 0 ].data.text);

            if (!cache || !cache[ query ]) {
                me.execute(
                    'loadData',
                    [
                        query,
                        function (error, data) {

                            if (data) {
                                me.set('data', data);
                                me.open();
                            }
                            else {
                                me.close();
                            }

                        }
                    ]
                );
            }
            else {
                me.set('data', cache[ query ]);
                me.open();
            }

        };

        var input = new Input({
            mainElement: inputElement,
            smart: true,
            shortcut: keyboardAction,
            change: {
                value: function (value) {
                    iteratorData[ 0 ].data.text = value;
                    suggest();
                }
            }
        });




        var popup = new Popup({
            triggerElement: inputElement,
            layerElement: menuElement,
            showLayerTrigger: me.option('showMenuTrigger'),
            showLayerDelay: me.option('showMenuDelay'),
            hideLayerTrigger: me.option('hideMenuTrigger'),
            hideLayerDelay: me.option('hideMenuDelay'),
            showLayerAnimate: function () {
                me.execute(
                    'showMenuAnimate',
                    {
                        menuElement: menuElement
                    }
                );
            },
            hideLayerAnimate: function () {
                me.execute(
                    'hideMenuAnimate',
                    {
                        menuElement: menuElement
                    }
                );
            }
        });


        var dispatchEvent = function (e) {
            if (e.target.tagName) {
                me.emit(e);
            }
        };

        popup
        .before('open', function (e) {

            // 点击输入框阻止显示，让 suggest 根据是否有数据来决定
            if (contains(inputElement, e.target)) {
                suggest();
                return false;
            }

            dispatchEvent(e);

        })
        .after('open', function (e) {

            iterator.set('maxIndex', iteratorData.length - 1);

            dispatchEvent(e);

        })
        .before('close', function (e) {

            var target = e.target;

            // 点击输入框或 layer 不需要隐藏
            if (contains(inputElement, target)
                || contains(menuElement, target)
            ) {
                return false;
            }

            dispatchEvent(e);

        })
        .after('close', function (e) {

            iterator.stop();
            iterator.set('maxIndex', 0);

            activeIndex = 0;

            mouseEnterElement = null;

            dispatchEvent(e);

        });



        me
        .before('render', function () {

            iterator.stop();

        })
        .after('render', function () {

            iteratorData.length = 1;

            var maxIndex = iteratorData.length - 1;

            menuElement
            .find(itemSelector)
            .each(function () {

                var itemElement = $(this);

                var data = itemElement.data();
                if (data.text == null) {
                    data.text = itemElement.html();
                }

                maxIndex++;

                iteratorData[ maxIndex ] = {
                    element: itemElement,
                    data: data
                };

                itemElement.data(ITEM_INDEX, maxIndex);

            });

            var properties = {
                maxIndex: maxIndex
            };

            if (itemActiveClass) {
                var activeElement = menuElement.find('.' + itemActiveClass);
                if (activeElement.length === 1) {
                    var index = activeElement.data(ITEM_INDEX);
                    processIndex(index, function () {
                        properties.index = index;
                    });
                }
            }

            iterator.set(
                properties
            );

        });



        var scrollTimer;
        var mouseEnterElement;

        var namespace = me.namespace();

        menuElement
        .on('scroll' + namespace, function () {

            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }

            scrollTimer = setTimeout(
                function () {
                    scrollTimer = null;
                },
                500
            );

        })
        .on('click' + namespace, itemSelector, function () {

            var index = $(this).data(ITEM_INDEX);

            processIndex(index, function (itemElement, itemData) {

                // 通常 mouseenter 会先触发设值
                // 因此 click 需要 force
                iterator.set('index', index, {
                    action: ACTION_CLICK,
                    force: true
                });

                me.close();

                me.emit('select', itemData);

            });

        })
        .on('mouseenter' + namespace, itemSelector, function () {

            if (scrollTimer) {
                return;
            }

            mouseEnterElement = $(this);

            var index = mouseEnterElement.data(ITEM_INDEX);

            processIndex(index, function () {
                iterator.set('index', index);
            });

        })
        .on('mouseleave' + namespace, itemSelector, function () {

            if (scrollTimer) {
                return;
            }

            if (mouseEnterElement) {

                if (mouseEnterElement[ 0 ] === this) {
                    iterator.set(
                        'index',
                        iterator.option('defaultIndex')
                    );
                }

                mouseEnterElement = null;

            }

        });

        me.inner({
            iterator: iterator,
            input: input,
            popup: popup
        });

    };

    /**
     * 渲染数据
     */
    proto.render = function () {

        var me = this;

        me.option('menuElement').html(
            me.execute(
                'renderTemplate',
                [
                    me.get('data'),
                    me.option('menuTemplate')
                ]
            )
        );

    };

    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
    };

    proto.open = function () {
        this.inner('popup').open();
    };

    proto._open = function () {
        if (!this.inner('popup').get('hidden')) {
            return false;
        }
    };

    proto.close = function () {
        this.inner('popup').close();
    };

    proto._close = function () {
        if (this.inner('popup').get('hidden')) {
            return false;
        }
    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.option('menuElement').off(
            me.namespace()
        );

        me.inner('iterator').dispose();
        me.inner('input').dispose();
        me.inner('popup').dispose();

    };

    lifeCycle.extend(proto);

    AutoComplete.defaultOptions = {
        cache: true,
        interval: 60,
        includeInput: true,
        itemSelector: 'li',
        showMenuTrigger: 'focus',
        hideMenuTrigger: 'click',
        showMenuAnimate: function (options) {
            options.menuElement.show();
        },
        hideMenuAnimate: function (options) {
            options.menuElement.hide();
        }
    };

    AutoComplete.propertyUpdater = {
        data: function () {
            this.render();
        }
    };

    var ITEM_INDEX = '__index__';

    var ACTION_CLICK = 'click';

    // 会引起 value 变化的 action
    var valueActionMap = {
        prev: 1,
        next: 1
    };

    valueActionMap[ ACTION_CLICK ] = 1;


    return AutoComplete;

});
