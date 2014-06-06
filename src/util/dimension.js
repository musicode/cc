/**
 * @file dimension
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * @description
     *
     * 不同浏览器之间取 dimension 的方式不同
     *
     * 比如 scrollTop：
     * IE 和 FF  用 document.documentElement.scrollTop
     *   Chrome  用 document.body.scrollTop
     *
     * 还有类似的取视窗大小等
     */

    var documentElement = document.documentElement;
    var body = document.body;

    /**
     * 获取窗口垂直滚动距离
     *
     * @return {number}
     */
    exports.getWindowScrollTop = function () {
        return Math.max(
                    documentElement.scrollTop,
                    body.scrollTop
                );
    };

    /**
     * 获取窗口水平滚动距离
     *
     * @return {number}
     */
    exports.getWindowScrollLeft = function () {
        return Math.max(
                    documentElement.scrollLeft,
                    body.scrollLeft
                );
    };

    /**
     * 获取窗口的滚动宽度
     *
     * @return {number}
     */
    exports.getWindowScrollWidth = function () {
        return Math.max(
                    body.clientWidth,
                    documentElement.clientWidth
                );
    };

    /**
     * 获取窗口的滚动高度
     *
     * @return {number}
     */
    exports.getWindowScrollHeight = function () {
        return Math.max(
                    body.clientHeight,
                    documentElement.clientHeight
                );
    };

    /**
     * 获取视窗宽度
     *
     * @return {number}
     */
    exports.getViewportWidth = function () {
        return Math.min(
                    body.clientWidth,
                    documentElement.clientWidth
                );
    };

    /**
     * 获取视窗高度
     *
     * @return {number}
     */
    exports.getViewportHeight = function () {
        return Math.min(
                    body.clientHeight,
                    documentElement.clientHeight
                );
    };

});