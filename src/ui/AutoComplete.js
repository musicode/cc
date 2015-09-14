/**
 * @file AutoComplete
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 90%
     *
     * 鼠标点击菜单项不能触发 select，否则会导致 input.select()，从而触发 focus 事件
     * 因此改名为 itemClick
     *
     * 事件列表：
     *
     * 1. itemClick - 用户点击选中某个菜单项触发
     * 2. beforeRender - 渲染菜单之前触发
     * 3. afterRender - 渲染菜单之后触发
     * 4. beforeOpen - 打开菜单之前触发
     * 5. afterOpen - 打开菜单之后触发
     * 6. beforeClose - 关闭菜单之前触发
     * 7. afterClose - 关闭菜单之后触发
     * 8. enter - 用户按下回车触发
     * 9. change - 当遍历导致输入框值变化时触发
     *
     */

    var timer = require('../function/timer');
    var aspect = require('../function/aspect');
    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var autoScrollUp = require('../function/autoScrollUp');
    var autoScrollDown = require('../function/autoScrollDown');

    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');
    var Iterator = require('../helper/Iterator');

    /**
     * 自动补全
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素
     * @property {jQuery} options.menu 补全菜单，菜单最好使用绝对定位，这样直接 show 出来，无需涉及定位逻辑
     *
     * @property {string=} options.itemSelector 菜单项选择器，默认是 li
     *
     * @property {number=} options.delay 长按上下键遍历的等待间隔时间，默认 60ms
     * @property {boolean=} options.includeInput 上下遍历是否包含输入框，默认包含
     * @property {boolean=} options.autoScroll 遍历时是否自动滚动，菜单出现滚动条时可开启，默认不开启
     *
     * @property {string=} options.activeClass 菜单项 active 时的 className
     *
     * @property {Object} options.show
     * @property {number=} options.show.delay 显示延时
     * @property {Function=} options.show.animation 显示动画
     *
     * @property {Object} options.hide
     * @property {number=} options.hide.delay 隐藏延时
     * @property {Function=} options.hide.animation 隐藏动画
     *
     * @property {string=} options.template 菜单模板
     * @property {Function=} options.renderTemplate 配置模板引擎的 render 方法，方法签名是 (data, tpl): string
     *
     * @property {Function} options.load 加载数据，可以是远程或本地数据
     * @argument {string} options.load.text 用户输入的文本
     * @argument {Function} options.load.callback 拉取完数据后的回调
     *
     */
    function AutoComplete(options) {
        return lifeCycle.init(this, options);
    }

    var proto = AutoComplete.prototype;

    proto.type = 'AutoComplete';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var menu = me.menu;
        var element = me.element;
        var activeClass = me.activeClass;

        // 当前选中数据
        var activeData;

        // 当前选中的元素
        var activeElement;

        // 缓存结果
        me.cache = { };

        // 可遍历的数据
        var iteratorData = [
            {
                element: element,
                data: {
                    text: element.val()
                }
            }
        ];

        var iterator =
        me.iterator = new Iterator({
            element: element,
            startIndex: 0,
            minIndex: me.includeInput ? 0 : 1,
            data: iteratorData,
            delay: me.delay,
            onChange: function (e, data) {

                var to = data.to;
                var from = data.from;
                var action = data.action;

                var target = this.data[to];

                if (activeElement) {
                    activeElement.removeClass(activeClass);
                }

                activeElement = target.element;

                if (me.autoScroll) {

                    var fn = action === 'prev'
                           ? autoScrollUp
                           : autoScrollDown;

                    fn(menu, activeElement);

                }

                if (to > 0) {
                    activeElement.addClass(activeClass);
                }

                activeData = target.data;

                if (action !== ACTION_RENDER) {
                    element.val(
                        activeData.text
                    );
                }

                me.emit(
                    'change',
                    {
                        // 对外界使用来说，要隐藏 input 为 0 的实现
                        index: to - 1,
                        data: activeData
                    }
                );

            }
        });

        me.input = new Input({
            element: element,
            smart: true,
            action: {
                up: function (e) {
                    e.preventDefault();
                },
                enter: function (e, longPress) {

                    if (longPress) {
                        return;
                    }

                    if (popup.hidden) {
                        activeData = iteratorData[0].data;
                    }
                    else {
                        me.close();
                    }

                    me.emit('enter', activeData);

                }
            },
            onChange: function () {

                iteratorData[0].data.text = element.val();

                suggest(me);

            }
        });

        var popup =
        me.popup = new Popup({
            element: element,
            layer: me.menu,
            show: me.show,
            hide: me.hide,
            context: me
        });

        me
        .on(
            'beforeShow',
            function (e) {

                if (e.target === element[0]) {
                    suggest(me);
                    e.stopPropagation();
                    return false;
                }

                me.emit('beforeOpen');

            }
        )
        .on(
            'afterShow',
            function () {

                iterator.enable();

                me.emit('afterOpen');

            }
        )
        .on(
            'beforeHide',
            function (e) {

                var target = e.target;

                // 交互触发
                if (target && target.tagName) {
                    // 点击输入框，不需要隐藏
                    if (target === element[0]) {
                        e.stopPropagation();
                        return false;
                    }
                }

                me.emit('beforeClose');

            }
        )
        .on(
            'afterHide',
            function () {

                iterator.stop();
                iterator.disable();

                me.emit('afterClose');

            }
        );

        var itemSelector = me.itemSelector;

        var isScrolling = false;
        var scrollTimer;

        var bindMouseLeave = function () {
            menu
            .on('mouseleave' + namespace, itemSelector, function () {

                if (isScrolling) {
                    return;
                }

                iterator.to(
                    iterator.startIndex
                );

                unbindMouseLeave();

            });
        };

        var unbindMouseLeave = function () {
            menu.off('mouseleave' + namespace);
        };

        menu
        .on('scroll' + namespace, function () {

            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }

            isScrolling = true;

            scrollTimer = setTimeout(
                function () {
                    scrollTimer = null;
                    isScrolling = false;
                },
                500
            );

        })
        .on('click' + namespace, itemSelector, function () {

            unbindMouseLeave();

            var index = $(this).data(indexKey);

            iterator.to(
                index,
                {
                    force: true
                }
            );

            me.close();

            me.emit(
                'itemClick',
                activeData
            );

        })
        .on('mouseenter' + namespace, itemSelector, function () {

            if (isScrolling) {
                return;
            }

            if (activeElement) {
                activeElement.removeClass(activeClass);
            }

            activeElement = $(this);
            activeElement.addClass(activeClass);

            iterator.index = activeElement.data(indexKey);

            bindMouseLeave();

        });

    };

    /**
     * 渲染数据
     *
     * @param {Array} data
     */
    proto.render = function (data) {

        var me = this;
        me.data = data;

        var iterator = me.iterator;

        var iteratorData = iterator.getData();
        iteratorData.length = 1;

        var menu = me.menu;
        var html = me.renderTemplate(data, me.template);

        menu
        .html(html)
        .find(me.itemSelector)
        .each(function (index) {

            var item = $(this);

            var data = item.data();
            if (data.text == null) {
                data.text = item.html();
            }

            var nextIndex =
            iteratorData.push({
                element: item,
                data: data
            });

            item.data(indexKey, nextIndex - 1);

        });

        iterator.setData(iteratorData);

        // 可以在 renderTemplate 时设置某一项选中
        var activeItem = menu.find('.' + me.activeClass);

        if (activeItem.length === 1) {
            var index = activeItem.data(indexKey);
            if ($.type(index) === 'number') {
                iterator.to(
                    index,
                    {
                        action: ACTION_RENDER
                    }
                );
            }
        }

    };

    /**
     * 显示下拉菜单
     */
    proto.open = function () {

        var popup = this.popup;

        if (popup.hidden) {
            popup.open();
        }

    };

    /**
     * 隐藏下拉菜单
     */
    proto.close = function () {

        var popup = this.popup;

        if (!popup.hidden) {
            popup.close();
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.menu.off(namespace);

        me.input.dispose();
        me.popup.dispose();

        me.element =
        me.menu =
        me.data =
        me.cache = null;

    };

    jquerify(proto);

    aspect(proto, 'render');

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    AutoComplete.defaultOptions = {
        delay: 60,
        includeInput: true,
        itemSelector: 'li',
        show: {
            trigger: 'focus'
        },
        hide: {
            trigger: 'click'
        }
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_autocomplete';

    var indexKey = '__index__';

    var ACTION_RENDER = 'render';

    /**
     * 渲染并显示数据
     *
     * @inner
     * @param {AutoComplete} autoComplete
     * @param {Array} data
     */
    function renderData(autoComplete, data) {
        if (data && data.length > 0) {
            autoComplete.render(data);
            autoComplete.open();
        }
        else {
            autoComplete.close();
        }
    }

    /**
     * 触发 suggestion
     *
     * @inner
     * @param {AutoComplete} autoComplete
     */
    function suggest(autoComplete) {

        var cache = autoComplete.cache;
        var query = $.trim(autoComplete.element.val());
        var data = cache[query];

        if (data && data.length > 0) {
            renderData(autoComplete, data);
        }
        else {
            autoComplete.load(
                query,
                function (data) {
                    cache[query] = data;
                    renderData(autoComplete, data);
                }
            );
        }
    }


    return AutoComplete;

});
