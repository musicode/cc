/**
 * @file 矩形
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 元素列表转换为对应的矩形列表
     *
     * @param {jQuery} element
     * @param {jQuery=} relativeContainer
     * @return {Array.<Object>}
     */
    exports.makeRectList = function (element, relativeContainer) {

        var scrollLeft = 0;
        var scrollTop = 0;

        if (relativeContainer) {
            scrollLeft = relativeContainer.scrollLeft();
            scrollTop = relativeContainer.scrollTop();
        }

        return element.map(function () {
            var element = $(this);
            var left;
            var top;
            if (relativeContainer) {
                var position = element.position();
                left = position.left + scrollLeft;
                top = position.top + scrollTop;
            }
            else {
                var offset = element.offset();
                left = offset.left;
                top = offset.top;
            }
            return {
                left: left,
                top: top,
                width: element.outerWidth(),
                height: element.outerHeight()
            };
        });
    };

    /**
     * 获得最大交集的矩形
     *
     * @param {Object} rect
     * @param {Array.<Object>} rectList
     * @return {Array.<Object>}
     */
    exports.sortByIntersectionArea = function (rect, rectList) {

        var areaList = $.map(rectList, function (item, index) {

            // 交集的四角
            var left = Math.max(rect.left, item.left);
            var top = Math.max(rect.top, item.top);
            var right = Math.min(rect.left + rect.width, item.left + item.width);
            var bottom = Math.min(rect.top + rect.height, item.top + item.height);

            // 面积
            var width = right - left;
            var height = bottom - top;

            return {
                index: index,
                area: width > 0 && height > 0
                    ? width * height
                    : 0
            };

        });

        // 降序
        areaList.sort(function (a, b) {
            if (a.area < b.area) {
                return 1;
            }
            else if (a.area > b.area) {
                return -1;
            }
            return 0;
        });

        return areaList;

    };

});