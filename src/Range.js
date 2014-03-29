/**
 * @file Range
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 操作 input 或 textarea 的选区
     *
     * 标准浏览器很简单
     *
     * element.selectionStart 选区开始位置
     * element.selectionEnd   选区结束位置
     *
     * IE 比较复杂
     *
     * http://yiminghe.iteye.com/blog/508999
     */

    'use strict';

    var isOldIE = !window.getSelection;

    /**
     * 封装标准浏览器的 Range
     *
     * @constructor
     * @param {HTMLElement} element
     */
    function Range(element) {
        this.element = element;
    }

    Range.prototype = {

        constructor: Range,

        /**
         * 获取选区开始结束位置
         *
         * @return {Object}
         */
        getRange: isOldIE ? getIERange : getRange,

        /**
         * 设置选区开始结束位置
         *
         * @param {number} start 开始位置
         * @param {number} end 结束位置
         */
        setRange: isOldIE ? setIERange : setRange,

        /**
         * 获取选区文本
         *
         * @return {string}
         */
        getText: function () {
            var value = this.element.value;
            var range = this.getRange();
            return value.substring(range.start, range.end);
        },

        /**
         * 设置选区文本
         *
         * @param {string} text
         */
        setText: function (text) {
            var element = this.element;
            var value = element.value;
            var range = this.getRange();
            element.value = value.substring(0, range.start)
                          + text
                          + value.substr(range.end);
        },

        /**
         * 销毁对象
         */
        dispose: function () {
            this.element = null;
        }
    };

    isOldIE = null;

    /**
     * 标准浏览器的实现
     */
    function getRange() {
        var element = this.element;
        return {
            start: element.selectionStart,
            end: element.selectionEnd
        };
    }

    function setRange(start, end) {
        var element = this.element;
        element.focus();
        element.setSelectionRange(start, end);
    }

    /**
     * IE 的实现
     */
    function getIERange() {
        var element = this.element;
        element.focus();

        var bookmark = document.selection.createRange().getBookmark();
        var textRange = element.createTextRange();
        textRange.moveToBookmark(bookmark);

        var clone = textRange.duplicate();
        clone.setEndPoint('StartToStart', textRange);

        var value = element.value;
        for (var i = 0; clone.moveStart('character', -1) !== 0; i++) {
            if (value.charAt(i) === '\n') {
                i++;
            }
        }

        return {
            start: i,
            end: i + textRange.text.length
        };
    }

    function setIERange(start, end) {

        var element = this.element;
        if (element.value.length < end) {
            return;
        }

        var range = element.createTextRange();

        // 重置到开始位置
        range.collapse(true);

        range.moveStart('character', start);
        range.moveEnd('character', end - 1);
        range.select();
    }


    return Range;

});
