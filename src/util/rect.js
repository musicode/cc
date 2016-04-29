/**
 * @file 矩形
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 元素列表转换为对应的矩形列表
     *
     * @param {jQuery} elements
     * @param {Object=} relativePosition
     * @return {Array.<Object>}
     */
    exports.makeRectList = function (elements, relativePosition) {

        if (!relativePosition) {
            relativePosition = { };
        }

        var relativeLeft = $.type(relativePosition.left) === 'number'
            ? relativePosition.left
            : 0;

        var relativeTop = $.type(relativePosition.top) === 'number'
            ? relativePosition.top
            : 0;

        return elements.map(function () {
            var element = $(this);
            var offset = element.offset();
            return {
                left: offset.left + relativeLeft,
                top: offset.top + relativeTop,
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