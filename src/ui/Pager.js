/**
 * @file Pager
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('../function/toNumber');
    var lifeCycle = require('../function/lifeCycle');

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
     * @property {boolean=} options.autoHide 是否在只有一页时自动隐藏
     *
     * @property {string=} options.pageTemplate 页码模板
     * @property {string=} options.prevTemplate 上一页模板
     * @property {string=} options.nextTemplate 下一页模板
     * @property {string=} options.ellipsisTemplate 省略号模板
     * @property {string=} options.activeTemplate 页码选中状态的模板
     *
     * @property {Function=} options.renderTemplate 渲染方法
     *
     */
    function Pager(options) {
        lifeCycle.init(this, options);
    }

    var proto = Pager.prototype;

    proto.type = 'Pager';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        me.set({
            page: me.option('page'),
            count: me.option('count')
        });

        var mainElement = me.option('mainElement');

        mainElement
        .on(
            'click' + me.namespace(),
            '[' + ATTR_PAGE + ']',
            function () {

                var page = toNumber(
                    $(this).attr(ATTR_PAGE)
                );

                if (page > 0) {
                    me.set('page', page);
                }

            }
        );

        me.inner('main', mainElement);

    };

    /**
     * 渲染
     */
    proto.render = function () {

        var me = this;

        var firstPage = 1;
        var count = me.get('count');
        var mainElement = me.inner('main');

        if (count < 2 && me.option('autoHide')) {
            me.execute('hideAnimate');
            mainElement.html('');
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
        var start = Math.max(firstPage, page - Math.ceil(showCount / 2));
        var end = Math.min(count, start + showCount - 1);

        if (end === count && end - start < showCount) {
            start = Math.max(firstPage, end - showCount + 1);
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

        if (startCount > 0 && start > firstPage) {

            offset = start - startCount;

            if (offset > 1) {
                datasource.unshift(
                    {
                        range: [ firstPage, startCount ],
                        tpl: pageTemplate
                    },
                    {
                        tpl: ellipsisTemplate
                    }
                );
            }
            else {
                datasource.unshift({
                    range: [ firstPage, start - 1 ],
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
                        'renderTemplate',
                        [ data, tpl ]
                    );
                };

                var data = {
                    first: firstPage,
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

        mainElement.html(html);

        me.execute(
            'showAnimate',
            {
                mainElement: mainElement
            }
        );

    };

    /**
     * 上一页
     */
    proto.prev = function () {

        var me = this;
        var page = me.get('page');

        if (page > 1) {
            me.set('page', page - 1);
        }

    };

    /**
     * 下一页
     */
    proto.next = function () {

        var me = this;
        var page = me.get('page');

        if (page < me.get('count')) {
            me.set('page', page + 1);
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Pager.defaultOptions = {

        autoHide: true,

        showCount: 6,
        startCount: 1,
        endCount: 2,

        showAnimate: function (options) {
            options.mainElement.show();
        },

        hideAnimate: function (options) {
            options.mainElement.hide();
        }

    };


    Pager.propertyUpdater = { };

    Pager.propertyUpdater.page =
    Pager.propertyUpdater.count = function () {
        this.render();
        return false;
    };

    var ATTR_PAGE = 'data-page';


    return Pager;

});
