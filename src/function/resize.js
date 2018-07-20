/**
 * @file 拖拽改变元素大小
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toNumber = require('./toNumber');
    var instance = require('../util/instance');

    return function (options) {

        var element = options.element;

        // 安全活动区域
        var safeTop = options.safeTop;
        var safeRight = options.safeRight;
        var safeBottom = options.safeBottom;
        var safeLeft = options.safeLeft;

        // 在安全活动区域内的最小尺寸
        var minWidth = options.minWidth;
        var minHeight = options.minHeight;

        // 是否保持比例
        var keepRatio = options.keepRatio;

        var width = element.width();
        var height = element.height();

        var ratio = width / height;

        var offset = element.offset();

        var parentOffset;
        if (element.css('position') !== 'fixed') {
            parentOffset = element.offsetParent().offset();
            offset.top -= parentOffset.top;
            offset.left -= parentOffset.left;
        }
        else {
            parentOffset = { left: 0, top: 0 };
        }

        var fromX;
        var fromY;
        var limitX;
        var limitY;
        var update;

        switch (options.point) {
            case 'lt':
                fromX = offset.left + element.width();
                fromY = offset.top + element.height();
                limitX = fromX - minWidth;
                limitY = fromY - minHeight;

                update = function (x, y) {
                    if (x > limitX) {
                       x = limitX;
                    }
                    if (safeLeft && x < safeLeft) {
                        x = safeLeft;
                    }
                    if (y > limitY) {
                        y = limitY;
                    }
                    if (safeTop && y < safeTop) {
                        y = safeTop;
                    }
                    width = fromX - x;
                    if (keepRatio) {
                        height = width / ratio;
                        if (safeBottom && y + height > safeBottom) {
                            height = safeBottom - y;
                            width = height * ratio;
                        }
                    }
                    else {
                        height = fromY - y;
                    }
                    element.css({
                        top: y,
                        left: x,
                        width: width,
                        height: height
                    });
                };
                break;

            case 't':
                fromY = offset.top + element.height();
                limitY = fromY - minHeight;

                update = function (x, y) {
                    if (keepRatio) {
                        return;
                    }
                    if (y > limitY) {
                        y = limitY;
                    }
                    if (safeTop && y < safeTop) {
                        y = safeTop;
                    }
                    element.css({
                        top: y,
                        height: fromY - y
                    });
                };
                break;

            case 'rt':
                fromX = offset.left;
                fromY = offset.top + element.height();
                limitX = fromX + minWidth;
                limitY = fromY - minHeight;

                update = function (x, y) {
                    if (x < limitX) {
                       x = limitX;
                    }
                    if (safeRight && x > safeRight) {
                        x = safeRight;
                    }
                    if (y > limitY) {
                        y = limitY;
                    }
                    if (safeTop && y < safeTop) {
                        y = safeTop;
                    }
                    width = x - fromX;
                    if (keepRatio) {
                        height = width / ratio;
                        if (safeBottom && y + height > safeBottom) {
                            height = safeBottom - y;
                            width = height * ratio;
                        }
                    }
                    else {
                        height = fromY - y;
                    }
                    element.css({
                        top: y,
                        left: fromX,
                        width: width,
                        height: height
                    });
                };
                break;

            case 'l':
                fromX = offset.left + element.width();
                limitX = fromX - minWidth;

                update = function (x, y) {
                    if (keepRatio) {
                        return;
                    }
                    if (x > limitX) {
                        x = limitX;
                    }
                    if (safeLeft && x < safeLeft) {
                        x = safeLeft;
                    }
                    element.css({
                        left: x,
                        width: fromX - x
                    });
                };
                break;

            case 'r':
                fromX = offset.left;
                limitX = fromX + minWidth;

                update = function (x, y) {
                    if (keepRatio) {
                        return;
                    }
                    if (x < limitX) {
                        x = limitX;
                    }
                    if (safeRight && x > safeRight) {
                        x = safeRight;
                    }
                    element.css({
                        width: x - fromX
                    });
                };
                break;

            case 'lb':
                fromX = offset.left + element.width();
                fromY = offset.top;
                limitX = fromX - minWidth;
                limitY = fromY + minHeight;

                update = function (x, y) {
                    if (x > limitX) {
                       x = limitX;
                    }
                    if (safeLeft && x < safeLeft) {
                        x = safeLeft;
                    }
                    width = fromX - x;
                    if (keepRatio) {
                        height = width / ratio;
                        y = toNumber(element.css('top'), 0, 'int')
                        if (safeBottom && y + height > safeBottom) {
                            height = safeBottom - y;
                            width = height * ratio;
                        }
                    }
                    else {
                        if (y < limitY) {
                            y = limitY;
                        }
                        if (safeBottom && y > safeBottom) {
                            y = safeBottom;
                        }
                        height = y - fromY;
                    }
                    element.css({
                        left: x,
                        width: width,
                        height: height
                    });
                };
                break;

            case 'b':
                fromY = offset.top;
                limitY = fromY + minHeight;

                update = function (x, y) {
                    if (keepRatio) {
                        return;
                    }
                    if (y < limitY) {
                        y = limitY;
                    }
                    if (safeBottom && y > safeBottom) {
                        y = safeBottom;
                    }
                    element.css({
                        height: y - fromY
                    });
                };
                break;

            case 'rb':
                fromX = offset.left;
                fromY = offset.top;
                limitX = fromX + minWidth;
                limitY = fromY + minHeight;

                update = function (x, y) {
                    if (x < limitX) {
                       x = limitX;
                    }
                    if (safeRight && x > safeRight) {
                        x = safeRight;
                    }
                    width = x - fromX;
                    if (keepRatio) {
                        height = width / ratio;
                        y = toNumber(element.css('top'), 0, 'int')
                        if (safeBottom && y + height > safeBottom) {
                            height = safeBottom - y;
                            width = height * ratio;
                        }
                    }
                    else {
                        if (y < limitY) {
                            y = limitY;
                        }
                        if (safeBottom && y > safeBottom) {
                            y = safeBottom;
                        }
                        height = y - fromY;
                    }
                    element.css({
                        width: width,
                        height: height
                    });
                };
                break;
        }

        var namespace = '.cc_function_resize' + $.now();

        instance.document
        .on(
            'mousemove' + namespace,
            function (event) {
                update(event.clientX - parentOffset.left, event.clientY - parentOffset.top);
                if (options.onChange) {
                    options.onChange();
                }
                return false;
            }
        )
        .on(
            'mouseup' + namespace,
            function (event) {
                instance.document.off(namespace);
                if (options.onComplete) {
                    setTimeout(
                        function () {
                            options.onComplete({
                                left: toNumber(element.css('left'), 0, 'int'),
                                top: toNumber(element.css('top'), 0, 'int'),
                                width: element.width(),
                                height: element.height()
                            });
                        },
                        200
                    );
                }
            }
        );

    };

});