/**
 * @file 方位配置表
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return {
         horizontal: {
            axis: 'x',
            position: 'left',
            scrollPosition: 'scrollLeft',
            size: 'width',
            minSize: 'minWidth',
            maxSize: 'maxWidth',
            innerSize: 'innerWidth',
            outerSize: 'outerWidth',
            scrollSize: 'scrollWidth'
        },
        vertical: {
            axis: 'y',
            position: 'top',
            scrollPosition: 'scrollTop',
            size: 'height',
            minSize: 'minHeight',
            maxSize: 'maxHeight',
            innerSize: 'innerHeight',
            outerSize: 'outerHeight',
            scrollSize: 'scrollHeight'
        }
    };

});