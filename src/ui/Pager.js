/**
 * @file Pager
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 分页
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element
     * @property {number} options.page 当前页码
     * @property {number} options.total 总页数
     * @property {number=} options.first 起始页码，默认是 1
     *
     * @property {number} options.count 中间显示的数量
     * @property {number=} options.startCount 省略号前面的数量，默认是 0
     * @property {number=} options.endCount 省略号后面的数量，默认是 0
     *
     * @property {string=} options.pageAttr 存放页码的属性
     *                                      点击可翻页的元素都要加上 pageAttr，包括 上一页/下一页
     *
     * @property {Object=} options.template 各种模板
     * @property {string=} options.template.page 页码模板
     * @property {string=} options.template.prev 上一页模板
     * @property {string=} options.template.next 下一页模板
     * @property {string=} options.template.ellipsis 省略号模板
     * @property {string=} options.template.active 页码选中状态的模板
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
                '[' + me.pageAttr + ']',
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

            // 原则上只能传 0 和 1
            // 如果不是，这里通过与运算纠正
            me.first &= 1;

            var total = me.total;
            var element = me.element;

            if (total < 2 && me.autoHide) {
                element.hide().html('');
            }
            else {

                var html = '';

                // 这里统一以 first 为 1 进行计算
                // 不然感觉逻辑好乱，最后再根据配置转换一下
                var offset = me.first === 1 ? 0 : 1;
                var page = me.page + offset;

                var count = me.count;
                var startCount = me.startCount;
                var endCount = me.endCount;

                var start = Math.max(1, page - Math.ceil(count / 2));
                var end = Math.min(total, start + count - 1);

                if (startCount > 0 && start < startCount + 2) {
                    start = 1;
                }
                if (endCount > 0 && total - end < endCount + 2) {
                    end = total;
                }

                var pageTemplate = me.pageTemplate;
                var ellipsisTemplate = me.ellipsisTemplate;

                // 上一页
                if (page > 1) {
                    html += renderPages(me.prevTemplate, page - 1, offset);
                }

                // 开始部分的页码，方便跳到第一页
                if (startCount > 0 && start > 1) {
                    html += renderPages(pageTemplate, [ 1, startCount ], offset)
                          + ellipsisTemplate;
                }

                // 中间的页码部分，需要用 selectedPage 进行分割
                if (start < page) {
                    html += renderPages(pageTemplate, [ start, page - 1 ], offset);
                }

                // 选中页码
                html += renderPages(me.active, page);

                if (end > page) {
                    html += renderPages(pageTemplate, [ page + 1, end ], offset);
                }

                // 结束部分的页码，方便跳到最后一页
                if (endCount > 0 && end < total) {
                    html += ellipsisTemplate
                          + renderPages(pageTemplate, [ total - endCount + 1, total ], offset);
                }

                // 下一页
                if (page < total) {
                    html += renderPages(me.nextTemplate, page + 1, offset);
                }

                element.show().html(html);
            }
        },

        prev: function () {

            var me = this;
            var page = me.page;

            if (page > me.first) {
                me.to(page - 1);
            }

        },

        next: function () {

            var me = this;
            var page = me.page;
            var total = me.total;

            if (me.first === 0) {
                total -= 1;
            }

            if (page < total) {
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
            var data = {
                page: page
            };

            me.page = page;

            if ($.isFunction(me.onChange)) {
                me.onChange(data);
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

        first: 1,
        autoHide: true,
        pageAttr: 'data-page',
        startCount: 0,
        endCount: 0,

        template: {
            // 如果想用 ajax 处理翻页，必须写上 pageAttr 属性
            // 如果采取跳转的方式，则自行改写模板的 href 为跳转 url
            page: '<a href="#" data-page="${value}" onclick="return false;">${text}</a>',

            prev: '<a class="pager-prev" href="#" data-page="${value}" onclick="return false;">上一页</a>',
            next: '<a class="pager-next" href="#" data-page="${value}" onclick="return false;">下一页</a>',
            ellipsis: '<a class="pager-ellipsis">...</a>',
            active: '<a class="pager-selected" href="#" onclick="return false;">${text}</a>'
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
        var page = Number($(e.currentTarget).attr(pager.pageAttr));
        if (!isNaN(page)) {
            pager.to(page);
        }
    }

    /**
     * 渲染一段翻页，页码范围是 range
     *
     * @inner
     * @param {string} tpl
     * @param {Array.<Object>} data 页码范围
     * @return {string}
     */
    function renderPages(tpl, range, offset) {

        var html = '';

        $.each(
            getDatasource(range, offset),
            function (index, item) {
                html += template(tpl, item);
            }
        );

        return html;
    }

    /**
     * 获得渲染模板的数据源
     *
     * @inner
     * @param {number|Array.<number>} range
     * @param {number} offset
     * @return {Array.<Object>}
     */
    function getDatasource(range, offset) {

        var result = [ ];

        if ($.type(range) === 'number') {
            range = [ range, range ];
        }

        for (var i = range[0], end = range[1]; i <= end; i++) {
            result.push({
                text: i,
                value: i - offset
            });
        }

        return result;
    }


    return Pager;

});
