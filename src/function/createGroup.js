/**
 * @file 细分数组分组
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (array, groupSize) {
        var groups = [ ];
        $.each(
            array,
            function (index, item) {
                index = Math.floor(index / groupSize);
                if (!groups[index]) {
                    groups[index] = [ ];
                }
                groups[index].push(item);
            }
        );
        return groups;
    };

});