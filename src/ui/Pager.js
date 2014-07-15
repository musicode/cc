/**
 * @file Pager
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 约定翻页开始页码为 1，好处如下：
     *
     * 1. 节省代码
     * 2. 代码清晰易懂（不用加 1 减 1 什么的，这个巨恶心）
     * 3. 符合人类直觉
     *
     * 如果非要翻页为 0，那初始化和刷新时，+ 1 处理吧
     */

    /**
     * 分页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number} options.page 当前页码
     * @property {number} options.total 总页数
     *
     * @property {number} options.showCount 中间显示的数量
     * @property {number=} options.startCount 省略号前面的数量，默认是 0
     * @property {number=} options.endCount 省略号后面的数量，默认是 0
     *
     * @property {Object} options.attribute
     * @property {string=} options.attribute.page 存放页码的属性
     *                                            点击可翻页的元素都要加上 page 属性，包括 上一页/下一页
     *
     * @property {Object=} options.template 各种模板
     * @property {string=} options.template.page 页码模板
     * @property {string=} options.template.prev 上一页模板
     * @property {string=} options.template.next 下一页模板
     * @property {string=} options.template.ellipsis 省略号模板
     * @property {string=} options.template.active 页码选中状态的模板
     * @property {Function=} options.template.render 渲染方法
     *
     * @property {boolean=} options.autoHide 是否在只有一页时自动隐藏
     *
     * @property {Function} options.onChange
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.page
     */
    function Pager(options) {
        $.extend(this, Pager.defaultOptions, options);
        this.init();
    }

    Pager.prototype = {

        constructor: Pager,

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            me.render();

            me.element
              .on(
                'click' + namespace,
                '[' + me.attribute.page + ']',
                me,
                clickPage
            );
        },

        /**
         * 渲染（刷新）翻页
         *
         * @param {Object=} data 翻页数据
         * @property {number} data.page 当前页
         * @property {number} data.total 总页数
         */
        render: function (data) {

            var me = this;

            if ($.isPlainObject(data)) {
                $.extend(me, data);
            }

            var total = me.total;
            var element = me.element;

            if (total < 2 && me.autoHide) {
                element.hide().html('');
            }
            else {

                var page = me.page;

                var showCount = me.showCount;
                var startCount = me.startCount;
                var endCount = me.endCount;
                var template = me.template;

                var datasource = [ ];

                // 上一页
                if (page > 1) {
                    datasource.push({
                        page: [ page - 1, page - 1 ],
                        tpl: template.prev
                    });
                }

                var start = Math.max(1, page - Math.ceil(showCount / 2));
                var end = Math.min(total, start + showCount - 1);

                if (startCount > 0 && start < startCount + 2) {
                    start = 1;
                    startCount = 0;
                }
                if (endCount > 0 && total - end < endCount + 2) {
                    end = total;
                    endCount = 0;
                }

                // 纠正一下，保证最多显示 showCount 个
                end = start + showCount - 1;

                if (startCount > 0) {
                    datasource.push(
                        {
                            page: [ 1, startCount ],
                            tpl: template.page
                        },
                        {
                            tpl: template.ellipsis
                        }
                    );
                }

                // 中间的页码部分，需要用 activePage 进行分割
                if (start < page) {
                    datasource.push({
                        page: [ start, page - 1 ],
                        tpl: template.page
                    });
                }

                // 选中页码
                datasource.push({
                    page: [ page, page ],
                    tpl: template.active
                });

                if (end > page) {
                    datasource.push({
                        page: [ page + 1, end ],
                        tpl: template.page
                    });
                }

                // 结束部分的页码，方便跳到最后一页
                if (endCount > 0) {
                    datasource.push(
                        {
                            tpl: template.ellipsis
                        },
                        {
                            page: [ total - endCount + 1, total ],
                            tpl: template.page
                        }
                    );
                }

                // 下一页
                if (page < total) {
                    datasource.push({
                        page: [ page + 1, page + 1 ],
                        tpl: template.next
                    });
                }

                var html = $.map(
                    datasource,
                    function (item, index) {
                        if (item.page == null) {
                            return item.tpl;
                        }
                        else {

                            var html = '';
                            var page = item.page;

                            for (var i = page[0], end = page[1]; i <= end; i++) {
                                html += template.render(item.tpl, { page: i });
                            }

                            return html;
                        }
                    }
                ).join('');

                element.show().html(html);
            }
        },

        prev: function () {

            var me = this;
            var page = me.page;

            if (page > 1) {
                me.to(page - 1);
            }

        },

        next: function () {

            var me = this;
            var page = me.page;

            if (page < me.total) {
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
            me.page = page;

            if ($.isFunction(me.onChange)) {
                me.onChange({
                    page: page
                });
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            var me = this;
            me.element.off(namespace);
            me.element = null;
        }

    };

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Pager.defaultOptions = {
        autoHide: true,
        startCount: 0,
        endCount: 0,
        attribute: {
            page: 'data-page'
        }
    };

    /**
     * jquery 命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_pager';

    /**
     * 点击翻页的事件处理函数
     *
     * @inner
     * @param {Event} e
     */
    function clickPage(e) {
        var pager = e.data;
        var page = Number($(e.currentTarget).attr(pager.attribute.page));
        if (!isNaN(page)) {
            pager.to(page);
        }
    }

    return Pager;

});
