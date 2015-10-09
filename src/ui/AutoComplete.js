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
    var Iterator = require('../helper/DOMIterator');

    var lifeUtil = require('../util/life');

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.inputElement 输入框元素
     *
     * @property {jQuery} options.menuElement 菜单元素
     * @property {string=} options.menuTemplate 菜单模板
     *
     * @property {string=} options.itemSelector 菜单项选择器，默认是 li
     * @property {string=} options.itemActiveClass 菜单项 active 时的 className
     *
     * @property {number=} options.interval 长按上下键遍历的等待间隔时间
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框
     * @property {boolean=} options.autoScroll 遍历时是否自动滚动，菜单出现滚动条时可开启
     *
     * @property {string=} options.showMenuTrigger 显示的触发方式
     * @property {number=} options.showMenuDelay 显示延时
     * @property {Function=} options.showMenuAnimation 显示动画
     *
     * @property {string=} options.hideMenuTrigger 隐藏的触发方式
     * @property {number=} options.hideMenuDelay 隐藏延时
     * @property {Function=} options.hideMenuAnimation 隐藏动画
     *
     * @property {Function=} options.render 配置模板引擎
     *
     * @property {Function} options.load 加载数据，可以是远程或本地数据，方法签名是 (query, callback)
     *
     */
    function AutoComplete(options) {
        lifeUtil.init(this, options);
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
            minIndex: me.option('includeInput') ? 0 : 1,
            defaultIndex: 0,
            step: 1,
            loop: true,
            prevKey: 'up',
            nextKey: 'down',
            interval: me.option('interval'),
            propertyChange: {
                index: function (newIndex, oldIndex, changes) {

                    var action = changes.index.action;

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

                if (me.is('opened')) {
                    me.close();
                }

                processIndex(activeIndex, function (element, data) {
                    me.emit('enter', data);
                });

            }
        };

        var suggest = function () {
            me.execute(
                'load',
                [
                    $.trim(iteratorData[ 0 ].data.text),
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
        };

        var input = new Input({
            mainElement: inputElement,
            silentOnLongPress: true,
            shortcut: keyboardAction,
            propertyChange: {
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
            showLayerAnimation: function () {
                me.execute(
                    'showMenuAnimation',
                    {
                        menuElement: menuElement
                    }
                );
            },
            hideLayerAnimation: function () {
                me.execute(
                    'hideMenuAnimation',
                    {
                        menuElement: menuElement
                    }
                );
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });


        var dispatchEvent = function (e, data) {
            if (data && data.event) {
                me.emit(e, data);
            }
        };

        popup
        .before('open', dispatchEvent)
        .after('open', dispatchEvent)
        .before('close', dispatchEvent)
        .after('close', dispatchEvent);

        me
        .before('open', function (e, data) {

            var event = data && data.event;
            if (event) {
                var target = event.target;
                // 点击输入框阻止显示，让 suggest 根据是否有数据来决定
                if (contains(inputElement, target)) {
                    suggest();
                    return false;
                }
            }

        })
        .after('open', function (e, data) {

            iterator.set('maxIndex', iteratorData.length - 1);

        })
        .before('close', function (e, data) {

            var event = data && data.event;
            if (event) {
                var target = event.target;
                // 点击输入框或 layer 不需要隐藏
                if (contains(inputElement, target)
                    || contains(menuElement, target)
                ) {
                    return false;
                }
            }

        })
        .after('close', function (e, data) {

            iterator.stop();
            iterator.set('maxIndex', 0);

            activeIndex = 0;

            mouseEnterElement = null;

        })
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
                iterator.sync();
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
                    iterator.sync();
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


    proto.render = function () {

        var me = this;

        me.renderWith(
            me.get('data'),
            me.option('menuTemplate'),
            me.option('menuElement')
        );

    };

    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
    };


    proto.open = function () {
        this.state('opened', true);
    };

    proto._open = function () {
        if (this.is('opened')) {
            return false;
        }
    };


    proto.close = function () {
        this.state('opened', false);
    };

    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('iterator').dispose();
        me.inner('input').dispose();
        me.inner('popup').dispose();

        me.option('menuElement').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

    AutoComplete.propertyUpdater = {
        data: function () {
            this.render();
        }
    };

    AutoComplete.stateUpdater = {
        opened: function (opened) {
            this.inner('popup').state('opened', opened);
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
