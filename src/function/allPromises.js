/**
 * @file 处理多个 Promise 的 resolve 和 reject
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    return function (promises) {

        var deferred = $.Deferred();

        $.when
            .apply($, promises)
            .then(
                function () {
                    deferred.resolve(
                        $.makeArray(arguments)
                    );
                },
                function () {
                    deferred.reject(
                        $.makeArray(arguments)
                    );
                }
            );

        return deferred;

    };

});