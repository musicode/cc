/**
 * @file wheel
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 火狐支持 DOMMouseScroll 事件，事件属性为 event.detail
     * 其他浏览器支持 mousewheel 事件，事件属性为 event.wheelDelta
     *
     * event.detail 向上滚动为负值，向下滚动为正值，值为 3 的倍数
     * event.wheelDelta 向下滚动为正值，向上滚动为负值，值为 120 的倍数
     *
     * 此模块统一使用 wheel 事件
     *      统一使用 data.delta
     *      统一为向上为负值，向下为正值，值为 1 的倍数
     */

    var guid = require('../function/guid');

    var DATA_KEY = 'cc-util-wheel';

    var EVENT_WHEEL = 'cc-wheel';

    var support = 'onmousewheel' in document.body
                ? 'mousewheel'               // Webkit 和 IE 支持 mousewheel
                : 'DOMMouseScroll';          // 火狐的老版本

    exports.WHEEL = EVENT_WHEEL;

    exports.init = function (element) {

        var namespace = '.' + guid();

        element
            .data(DATA_KEY, namespace)
            .on(support + namespace, function (e) {

                var delta;

                var event = e.originalEvent;
                var wheelDelta = event.wheelDelta;

                if (wheelDelta % 120 === 0) {
                    delta = -wheelDelta / 120;
                }
                else if (wheelDelta % 3 === 0) {
                    delta = -wheelDelta / 3;
                }
                else if (event.detail % 3 === 0) {
                    delta = -event.detail / 3;
                }
                else {
                    delta = event.delta || 0;
                }

                e.type = EVENT_WHEEL;

                element.trigger(e, { delta: delta });

            });

    };

    exports.dispose = function (element) {

        var namespace = element.data(DATA_KEY);
        if (namespace) {
            element
                .removeData(DATA_KEY)
                .off(namespace);
        }

    };

});
