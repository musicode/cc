/**
 * @file 等待数组中的 promise 切换状态
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var allPromises = require('./allPromises');

    return function (array, callback) {

        var promises = [ ];
        var indexes = [ ];

        $.each(
            array,
            function (index, item) {
                if ($.isFunction(item.then)) {
                    promises.push(item);
                    indexes.push(index);
                }
            }
        );

        if (promises.length > 0) {
            return allPromises(promises)
                .then(function (data) {
                    $.each(
                        data,
                        function (index, item) {
                            array[indexes[index]] = item;
                        }
                    );
                    callback();
                });
        }
        else {
            return callback();
        }

    };

});