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
     * @property {jQuery} options.menuElement 补全菜单元素
     * @property {string=} options.menuTemplate 补全菜单模板
     *
     * @property {string} options.itemSelector 菜单项选择器
     * @property {string=} options.itemActiveClass 菜单项选中状态时的 className
     *
     * @property {number} options.interval 长按上下键自动遍历的时间间隔
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框
     * @property {boolean=} options.autoScroll 遍历时补全菜单是否自动滚动，当补全数据很多时开启体验更好
     *
     * @property {string=} options.showMenuTrigger 显示补全菜单的触发方式
     * @property {number=} options.showMenuDelay 显示补全菜单的延时
     * @property {Function=} options.showMenuAnimation 显示补全菜单的动画
     *
     * @property {string=} options.hideMenuTrigger 隐藏补全菜单的触发方式
     * @property {number=} options.hideMenuDelay 隐藏补全菜单的延时
     * @property {Function=} options.hideMenuAnimation 隐藏补全菜单的动画
     *
     * @property {Function} options.render 配置模板引擎
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

        var updateScrollPosition = function (fn) {
            processIndex(
                activeIndex,
                function (itemElement) {
                    fn(menuElement, itemElement);
                }
            );
        };

        var updateActiveItemClass = function (action) {
            if (itemActiveClass) {
                processIndex(
                    activeIndex,
                    function (itemElement) {
                        if (itemElement[ 0 ] !== inputElement[ 0 ]) {
                            itemElement[ action ](itemActiveClass);
                        }
                    }
                );
            }
        };

        var updateInputValue = function (index) {
            processIndex(
                index,
                function (itemElement, itemData) {
                    inputElement.val(itemData.text);
                }
            );
        };

        var iterator = new Iterator({
            mainElement: inputElement,
            minIndex: me.option('includeInput') ? 0 : 1,
            defaultIndex: 0,
            step: 1,
            loop: true,
            prevKey: 'up',
            nextKey: 'down',
            interval: me.option('interval'),
            propertyChange: {
                index: function (newIndex, oldIndex, changes) {

                    updateActiveItemClass('removeClass');
                    activeIndex = newIndex;
                    updateActiveItemClass('addClass');

                    var action = changes.index.action;
                    var scroll;

                    if (action === 'prev') {
                        updateInputValue(activeIndex);
                        scroll = autoScrollUp;
                    }
                    else if (action === 'next') {
                        updateInputValue(activeIndex);
                    }

                    updateScrollPosition(scroll || autoScrollDown);

                }
            }
        });


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
            shortcut: {
                enter: function (e, data) {

                    if (data.isLongPress) {
                        return;
                    }

                    if (me.is('opened')) {
                        me.close();
                    }

                    processIndex(
                        activeIndex,
                        function (element, data) {
                            me.emit('enter', data);
                        }
                    );

                }
            },
            propertyChange: {
                value: function (value) {
                    iteratorData[ 0 ].data.text = value;
                    suggest();
                }
            }
        });


        var popup;

        var showMenuTrigger = me.option('showMenuTrigger');
        var hideMenuTrigger = me.option('hideMenuTrigger');

        if (showMenuTrigger && hideMenuTrigger) {
            popup = new Popup({
                triggerElement: inputElement,
                layerElement: menuElement,
                showLayerTrigger: showMenuTrigger,
                showLayerDelay: me.option('showMenuDelay'),
                hideLayerTrigger: hideMenuTrigger,
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
                        if (opened) {
                            me.open();
                        }
                        else {
                            me.close();
                        }
                    }
                }
            });


            popup
            .on('dispatch', function (e, data) {

                var target = data.data.event.target;
                var event = data.event;

                switch (event.type) {

                    case 'beforeopen':
                        // 点击输入框阻止显示，让 suggest 根据是否有数据来决定
                        if (contains(inputElement, target)) {
                            suggest();
                            return false;
                        }
                        break;

                    case 'beforeclose':
                        // 点击输入框或 menu 不需要隐藏
                        if (contains(inputElement, target)
                            || contains(menuElement, target)
                        ) {
                            return false;
                        }
                        break;
                }

                me.emit(event, data.data, true);

            });
        }

        me
        .after('open', function () {

            iterator.set('maxIndex', iteratorData.length - 1);

        })
        .after('close', function () {

            iterator.stop();
            iterator.set('maxIndex', 0);

            mouseEnterElement = null;

        })
        .before('render', function () {

            iterator.stop();

        })
        .after('render', function () {

            iteratorData.length = 1;

            var maxIndex = 0;

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

            processIndex(
                index,
                function (itemElement, itemData) {

                    updateInputValue(index);

                    me.close();
                    me.emit('select', itemData);

                }
            );

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

        if (!popup) {
            inputElement
            .on('blur', function () {
                iterator.stop();
            });
        }

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
        if (this.is('opened')
            || !this.inner('popup')
        ) {
            return false;
        }
    };


    proto.close = function () {
        this.state('opened', false);
    };

    proto._close = function () {
        if (!this.is('opened')
            || !this.inner('popup')
        ) {
            return false;
        }
    };


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('iterator').dispose();
        me.inner('input').dispose();

        var popup = me.inner('popup');
        if (popup) {
            popup.dispose();
        }

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
            var popup = this.inner('popup');
            if (popup) {
                popup.state('opened', opened);
            }
        }
    };

    var ITEM_INDEX = '__index__';


    return AutoComplete;

});
