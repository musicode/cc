/**
 * @file Pager
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
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
     * @property {jQuery} options.element
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
     * @property {Function=} options.renderTemplate 渲染方法
     *
     * @property {Function} options.onChange
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.page
     */
    function Pager(options) {
        return lifeCycle.init(this, options);
    }

    Pager.prototype = {

        constructor: Pager,

        type: 'Pager',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            me.render();

            me
            .element
            .on(
                'click' + namespace,
                '[data-page]',
                me,
                function (e) {

                    var page = $(this).data('page');

                    if ($.type(page) === 'number') {
                        me.to(page);
                    }
                }
            );
        },

        /**
         * 渲染（刷新）翻页
         *
         * @param {Object=} data 翻页数据
         * @property {number} data.page 当前页
         * @property {number} data.count 总页数
         */
        render: function (data) {

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var count = me.count;
            var element = me.element;

            if (count < 2 && me.autoHide) {
                element.hide().html('');
            }
            else {

                var page = Math.min(me.page, count);

                var showCount = me.showCount;
                var startCount = me.startCount;
                var endCount = me.endCount;

                var datasource = [ ];

                // 上一页
                if (page > 1) {
                    datasource.push({
                        page: [ page - 1, page - 1 ],
                        tpl: me.prevTemplate
                    });
                }

                var start = Math.max(1, page - Math.ceil(showCount / 2));
                if (startCount > 0 && start < startCount + 2) {
                    startCount = 0;
                }

                var end = Math.min(count, start + showCount - 1);
                if (endCount > 0 && count - end < endCount + 2) {
                    endCount = 0;
                }

                if (startCount > 0) {
                    datasource.push(
                        {
                            page: [ 1, startCount ],
                            tpl: me.pageTemplate
                        },
                        {
                            tpl: me.ellipsisTemplate
                        }
                    );
                }

                // 中间的页码部分，需要用 activePage 进行分割
                if (start < page) {
                    datasource.push({
                        page: [ start, page - 1 ],
                        tpl: me.pageTemplate
                    });
                }

                // 选中页码
                datasource.push({
                    page: [ page, page ],
                    tpl: me.activeTemplate
                });

                if (end > page) {
                    datasource.push({
                        page: [ page + 1, end ],
                        tpl: me.pageTemplate
                    });
                }

                // 结束部分的页码，方便跳到最后一页
                if (endCount > 0) {
                    datasource.push(
                        {
                            tpl: me.ellipsisTemplate
                        },
                        {
                            page: [ count - endCount + 1, count ],
                            tpl: me.pageTemplate
                        }
                    );
                }

                // 下一页
                if (page < count) {
                    datasource.push({
                        page: [ page + 1, page + 1 ],
                        tpl: me.nextTemplate
                    });
                }

                var html = $.map(
                    datasource,
                    function (item, index) {

                        var tpl = item.tpl;
                        if (!tpl) {
                            return;
                        }

                        if (item.page == null) {
                            return tpl;
                        }
                        else {

                            var html = '';
                            var page = item.page;

                            for (var i = page[0], end = page[1]; i <= end; i++) {
                                html += me.renderTemplate({ page: i }, tpl);
                            }

                            return html;
                        }
                    }
                ).join('');

                element.html(html).show();
            }
        },

        /**
         * 上一页
         */
        prev: function () {

            var me = this;
            var page = me.page;

            if (page > 1) {
                me.to(page - 1);
            }

        },

        /**
         * 下一页
         */
        next: function () {

            var me = this;
            var page = me.page;

            if (page < me.count) {
                me.to(page + 1);
            }
        },

        /**
         * 翻到第 page 页
         *
         * @param {number} page
         */
        to: function (page) {

            var me = this;
            var isChange = page !== me.page;

            me.page = page;

            if (isChange) {
                me.emit(
                    'change',
                    {
                        page: page
                    }
                );
            }

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;
        }

    };

    jquerify(Pager.prototype);

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

        pageTemplate: '<button class="btn" data-page="${page}">${page}</button>',
        prevTemplate: '<button class="btn" data-page="${page}">上一页</button>',
        nextTemplate: '<button class="btn" data-page="${page}">下一页</button>',
        ellipsisTemplate: '<button class="btn ellipsis">...</button>',
        activeTemplate: '<button class="btn btn-primary" data-page="${page}">${page}</button>',

        renderTemplate: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] != null ? data[$1] : '';
            });
        }
    };

    /**
     * jquery 命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_pager';


    return Pager;

});
