/**
 * @file 单选多选
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var split = require('./split');

    var VALUE_SEPARATE = ',';

    return function (base, multiple, toggle, sort) {

        var list = split(base, VALUE_SEPARATE);

        return function (item, add) {

            if (item != null) {

                var index = $.inArray(item, list);

                if (index >= 0) {
                    if (toggle || !add) {
                        list.splice(index, 1);
                    }
                }
                else if (add) {
                    list.push(item);
                }

            }

            if (list.length > 1) {
                if (!multiple) {
                    list = [ list.pop() ];
                }
                else if (sort) {
                    list.sort(sort);
                }
            }

            return list.join(VALUE_SEPARATE);

        };

    }

});