/**
 * @file Pager
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('../function/toNumber');
    var lifeUtil = require('../util/life');

    /**
     * 约定翻页开始页码为 1，好处如下：
     *
     * 1. 节省代码
     * 2. 代码清晰易懂（不用加 1 减 1 什么的，这个巨恶心）
     * 3. 符合人类直觉
     *
     * 如果非要翻页为 0，那初始化和刷新时，+ 1 处理吧
     *
     * 希望点击触发翻页的元素，必须具有 data-page 属性，属性值为希望翻到的页码
     */

    /**
     * 分页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {number} options.page 当前页码，从 1 开始
     * @property {number} options.count 总页数
     * @property {number} options.showCount 中间显示的数量
     * @property {number=} options.startCount 省略号前面的数量，默认是 1
     * @property {number=} options.endCount 省略号后面的数量，默认是 2
     *
     * @property {boolean=} options.hideOnSingle 是否在只有一页时自动隐藏
     *
     * @property {string=} options.pageSelector 如果是静态链接（a）可不传
     * @property {string=} options.pageAttribute 如果是静态链接（a）可不传
     *
     * @property {string=} options.pageTemplate 页码模板
     * @property {string=} options.prevTemplate 上一页模板
     * @property {string=} options.nextTemplate 下一页模板
     * @property {string=} options.ellipsisTemplate 省略号模板
     * @property {string=} options.activeTemplate 页码选中状态的模板
     *
     * @property {Function=} options.render 渲染方法
     *
     */
    function Pager(options) {
        lifeUtil.init(this, options);
    }

    var proto = Pager.prototype;

    proto.type = 'Pager';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var pageSelector = me.option('pageSelector');
        var pageAttribute = me.option('pageAttribute');
        if (pageSelector && pageAttribute) {
            mainElement
            .on(
                'click' + me.namespace(),
                pageSelector,
                function () {
                    var page = $(this).attr(pageAttribute);
                    if (page >= FIRST_PAGE) {

                        // 转成 number
                        page = + page;

                        me.set('page', page);
                        me.emit('select', { page: page });

                    }
                }
            );
        }

        me.inner({
            main: mainElement
        });

        me.set({
            page: me.option('page'),
            count: me.option('count')
        });

    };

    proto.render = function () {

        var me = this;

        var count = me.get('count');
        var mainElement = me.inner('main');

        if (count < 2 && me.option('hideOnSingle')) {
            me.state('hidden', true);
            return;
        }

        var page = Math.min(me.get('page'), count);

        var showCount = me.option('showCount');
        var startCount = me.option('startCount');
        var endCount = me.option('endCount');

        var pageTemplate = me.option('pageTemplate');
        var prevTemplate = me.option('prevTemplate');
        var nextTemplate = me.option('nextTemplate');
        var activeTemplate = me.option('activeTemplate');
        var ellipsisTemplate = me.option('ellipsisTemplate');



        var datasource = [ ];




        // 以当前选中的页码为界，先处理左边的，再处理右边的
        var start = Math.max(FIRST_PAGE, page - Math.ceil(showCount / 2));
        var end = Math.min(count, start + showCount - 1);

        if (end === count && end - start < showCount) {
            start = Math.max(FIRST_PAGE, end - showCount + 1);
        }

        // 选中页面左侧
        if (start < page) {
            datasource.push({
                range: [ start, page - 1 ],
                tpl: pageTemplate
            });
        }

        // 选中页码
        datasource.push({
            tpl: activeTemplate
        });

        // 选中页面左侧
        if (end > page) {
            datasource.push({
                range: [ page + 1, end ],
                tpl: pageTemplate
            });
        }





        // startCount
        var offset;

        if (startCount > 0 && start > FIRST_PAGE) {

            offset = start - startCount;

            if (offset > 1) {
                datasource.unshift(
                    {
                        range: [ FIRST_PAGE, startCount ],
                        tpl: pageTemplate
                    },
                    {
                        tpl: ellipsisTemplate
                    }
                );
            }
            else {
                datasource.unshift({
                    range: [ FIRST_PAGE, start - 1 ],
                    tpl: pageTemplate
                });
            }

        }

        if (endCount > 0 && end < count) {

            offset = count - end - endCount;

            if (offset > 1) {
                datasource.push(
                    {
                        tpl: ellipsisTemplate
                    },
                    {
                        range: [ count - endCount + 1, count ],
                        tpl: pageTemplate
                    }
                );
            }
            else {
                datasource.push({
                    range: [ end + 1, count ],
                    tpl: pageTemplate
                });
            }

        }




        // 上一页
        datasource.unshift({
            tpl: prevTemplate
        });

        // 下一页
        datasource.push({
            tpl: nextTemplate
        });



        var html = $.map(
            datasource,
            function (item, index) {

                var tpl = item.tpl;
                if (!tpl) {
                    return;
                }

                var html = '';

                var append = function () {
                    html += me.execute(
                        'render',
                        [ data, tpl ]
                    );
                };

                var data = {
                    first: FIRST_PAGE,
                    last: count,
                    active: page
                };

                var range = item.range;
                if (range) {
                    for (var i = range[0], end = range[1]; i <= end; i++) {
                        data.page = i;
                        append();
                    }
                }
                else {
                    append();
                }

                return html;

            }
        ).join('');

        me.renderWith(html);

        me.state('hidden', false);

    };


    proto.prev = function () {

        var me = this;

        me.set(
            'page',
            me.get('page') - 1
        );

    };

    proto._prev = function () {

        if (this.get('page') > FIRST_PAGE) {}
        else {
            return false;
        }

    };


    proto.next = function () {

        var me = this;

        me.set(
            'page',
            me.get('page') + 1
        );

    };

    proto._next = function () {

        var me = this;

        if (me.get('page') < me.get('count')) {}
        else {
            return false;
        }

    };


    proto.show = function () {
        this.state('hidden', false);
    };

    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };


    proto.hide = function () {
        this.state('hidden', true);
    };

    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

    Pager.propertyUpdater = { };

    Pager.propertyUpdater.page =
    Pager.propertyUpdater.count = function () {
        this.render();
        return false;
    };

    Pager.propertyValidator = {

        page: function (page) {
            return toNumber(page, FIRST_PAGE);
        }

    };

    Pager.stateUpdater = {

        hidden: function (hidden) {

            var me = this;

            me.execute(
                hidden ? 'hideAnimation' : 'showAnimation',
                {
                    mainElement: me.inner('main')
                }
            );

        }

    };

    var FIRST_PAGE = 1;


    return Pager;

});
