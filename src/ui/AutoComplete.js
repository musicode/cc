/**
 * @file AutoComplete
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');

    /**
     * [TODO] Input 支持 scope
     */

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @param {jQuery} options.input 输入框元素
     * @param {jQuery} options.menu 补全菜单
     *
     * @property {Object=} options.animation
     * @property {Function=} options.animation.open 展开动画
     * @property {Function=} options.animation.close 关闭动画
     *
     * @param {Function} options.renderMenu 如果是简单需求，配置 options.itemTemplate 即可
     * @param {string=} options.itemTemplate 菜单项模板
     * @param {string} options.itemSelector 可上下键遍历的菜单项元素选择器
     * @param {string} options.itemHoverClass 菜单项 hover 时的 className
     * @param {string} options.itemActiveClass 菜单项 active 时的 className
     *
     * @param {Function=} options.onItemActive 菜单项 active 时的事件处理函数
     * @argument {Object} options.onItemActive.data 用 options.parseItem 解析 active 菜单项获得的数据
     *
     * @param {Function=} options.parseItem 获得菜单项数据，返回格式为 { text: '' }
     *
     * @param {number=} options.wait 长按上下键遍历的等待间隔时间
     * @param {boolean=} options.includeInput 上下遍历是否包含输入框
     *
     * @param {Function} options.load 加载数据，可以是远程或本地数据
     * @argument {string} options.load.text 用户输入的文本
     * @argument {Function} options.load.callback 拉取完数据后的回调
     *
     * @param {Function} options.onSelect 用户点击选中某个菜单项触发
     * @param {Function} options.onEnter 用户按下回车触发
     */
    function AutoComplete(options) {
        $.extend(this, AutoComplete.defaultOptions, options);
        this.init();
    }

    AutoComplete.prototype = {

        constructor: AutoComplete,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var cache =
            me.cache = {

                data: { },

                // 遍历起始索引
                startIndex: me.includeInput ? 0 : -1,

                resetIndex: function () {

                    var elementItems = cache.elementItems;
                    if (elementItems) {
                        if (cache.hoverIndex > cache.startIndex) {
                            elementItems.eq(cache.hoverIndex).removeClass(me.itemHoverClass);
                        }
                        if (cache.activeIndex > cache.startIndex) {
                            elementItems.eq(cache.activeIndex).removeClass(me.itemActiveClass);
                        }
                    }

                    cache.activeData = null;

                    cache.hoverIndex =
                    cache.activeIndex = cache.startIndex;
                }

            };

            cache.input = createInput(me);
            cache.popup = createPopup(me);

            var itemSelector = me.itemSelector;

            me.menu.on('click' + namespace, itemSelector, me, clickItem)
                   .on('mouseenter' + namespace, itemSelector, me, enterItem)
                   .on('mouseleave' + namespace, itemSelector, me, leaveItem);

        },

        /**
         * 显示下拉菜单
         */
        open: function () {
            this.cache.popup.show();
        },

        /**
         * 隐藏下拉菜单
         */
        close: function () {
            this.cache.popup.hide();
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;
            var cache = me.cache;

            me.menu.off(namespace);

            cache.popup.dispose();

            // 可能还在长按中，必须结束掉
            cache.input.onLongPressEnd();
            cache.input.dispose();

            me.input =
            me.menu =
            me.cache = null;
        }
    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    AutoComplete.defaultOptions = {

        wait: 60,
        includeInput: true,
        animation: { },

        itemSelector: 'li',
        itemHoverClass: 'item-hover',
        itemActiveClass: 'item-active',

        parseItem: function (item) {
            return {
                text: item.innerHTML
            };
        },
        onItemActive: function (data) {
            this.input.val(data.text);
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble-ui-autocomplete';

    /**
     * 用 Popup 处理提示层的显示隐藏逻辑
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @return {Popup}
     */
    function createPopup(autoComplete) {

        var input = autoComplete.input;
        var menu = autoComplete.menu;
        var cache = autoComplete.cache;

        var options = {
            trigger: input,
            element: menu,
            showBy: 'focus',
            hideBy: 'blur',
            onBeforeShow: function (event) {
                // 由 focus 事件触发的要调一下 suggest
                if (event) {
                    suggest(autoComplete);
                    return false;
                }
            },
            onAfterShow: function () {

                cache.resetIndex();

                var elementItems = menu.find(autoComplete.itemSelector);
                var dataItems = elementItems.map(function (index, item) {
                    return autoComplete.parseItem(item);
                });

                if (autoComplete.includeInput) {
                    elementItems.splice(0, 0, input);
                    dataItems.splice(0, 0, { text: input.val() });
                }

                cache.elementItems = elementItems;
                cache.dataItems = dataItems;
            },
            onBeforeHide: function (event) {
                // 点击 input 不触发失焦隐藏
                if (event && event.target === input[0]) {
                    return false;
                }
            },
            onAfterHide: function () {
                cache.resetIndex();
                cache.elementItems =
                cache.dataItems = null;
            }
        };

        var animation = autoComplete.animation;
        if (animation.open) {
            options.show = $.proxy(animation.open, autoComplete);
        }
        if (animation.close) {
            options.hide = $.proxy(animation.close, autoComplete);
        }

        return new Popup(options);
    }

    /**
     * 用 Input 处理按键
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @return {Input}
     */
    function createInput(autoComplete) {

        var cache = autoComplete.cache;
        var action;

        return new Input({

            element: autoComplete.input,

            // 长按不触发 onChange
            longPress: false,
            onLongPressStart: function () {
                if (action) {
                    cache.timer = setInterval(
                        function () {
                            action(autoComplete);
                        },
                        autoComplete.wait
                    );
                }
            },
            onLongPressEnd: function () {
                if (cache.timer) {
                    clearInterval(cache.timer);
                    cache.timer = null;
                }
            },

            keyEvents: {
                up: function () {
                    if (cache.elementItems) {
                        (action = previousItem)(autoComplete);
                    }
                },
                down: function () {
                    if (cache.elementItems) {
                        (action = nextItem)(autoComplete);
                    }
                },
                enter: function () {
                    var data = cache.activeData;
                    autoComplete.close();
                    if (typeof autoComplete.onEnter === 'function') {
                        autoComplete.onEnter(data);
                    }
                }
            },
            onKeyUp: function () {
                action = null;
            },
            onChange: function () {
                suggest(autoComplete);
            }
        });
    }

    /**
     * 触发 suggestion
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function suggest(autoComplete) {

        var cache = autoComplete.cache;

        var update = function (data, fromCache) {
            if (data && data.length > 0) {

                if (!fromCache) {
                    cache.data[query] = data;
                }

                var itemTemplate = autoComplete.itemTemplate;
                if (itemTemplate) {
                    autoComplete.menu.html(template(itemTemplate, data));
                }
                else {
                    autoComplete.renderMenu(data);
                }

                autoComplete.open();
            }
            else {
                autoComplete.close();
            }
        };

        var query = $.trim(autoComplete.input.val());
        var data = cache.data[query];

        if (data) {
            update(data, true);
        }
        else {
            autoComplete.load(query, update);
        }
    }

    /**
     * 渲染模板
     *
     * @inner
     * @param {string} tpl
     * @param {Array.<Object>} data
     * @return {string}
     */
    function template(tpl, data) {

        var result = [ ];

        $.each(
            data,
            function (index, item) {
                result.push(
                    tpl.replace(
                        /\${(\w+)}/g,
                        function ($0, $1) {
                            return item[$1] != null ? item[$1] : '';
                        }
                    )
                );
            }
        );

        return result.join('');
    }

    /**
     * 点击菜单项
     *
     * @inner
     * @param {Event} e
     */
    function clickItem(e) {

        var autoComplete = e.data;
        var cache = autoComplete.cache;

        var index = cache.elementItems.index(e.currentTarget);
        var data = cache.dataItems[index];

        activeItem(autoComplete, index);
        autoComplete.close();

        if (typeof autoComplete.onSelect === 'function') {
            autoComplete.onSelect(data);
        }
    }

    /**
     * 遍历到上一个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function previousItem(autoComplete) {

        var cache = autoComplete.cache;

        var index = cache.activeIndex - 1;
        if (index < 0) {
            index = cache.elementItems.length - 1;
        }

        activeItem(autoComplete, index);
    }

    /**
     * 遍历到下一个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function nextItem(autoComplete) {

        var cache = autoComplete.cache;

        var index = cache.activeIndex + 1;
        if (index >= cache.elementItems.length) {
            index = 0;
        }

        activeItem(autoComplete, index);
    }

    /**
     * active 某个菜单项
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @param {number} index 选择的索引
     */
    function activeItem(autoComplete, index) {

        var cache = autoComplete.cache;
        cache.resetIndex();

        cache.elementItems
             .eq(index)
             .addClass(autoComplete.itemActiveClass);

        cache.activeIndex = index;

        var data = cache.dataItems[index];
        cache.activeData = data;

        if (typeof autoComplete.onItemActive === 'function') {
            autoComplete.onItemActive(data);
        }
    }

    /**
     * 鼠标移入菜单项
     *
     * @inner
     * @param {Event} e
     */
    function enterItem(e) {

        var autoComplete = e.data;
        var cache = autoComplete.cache;

        cache.resetIndex();

        var target = $(e.currentTarget);
        target.addClass(autoComplete.itemHoverClass);

        cache.hoverIndex =
        cache.activeIndex = cache.elementItems.index(target);
    }

    /**
     * 鼠标移出菜单项
     *
     * @inner
     * @param {Event} e
     */
    function leaveItem(e) {
        e.data.cache.resetIndex();
    }


    return AutoComplete;

});
