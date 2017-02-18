/**
 * @file 伪造一个 promise
 * @author zhujialu
 */
define(function (require, exports, module) {

    'use strict';

    return function (callback) {

        var deferred = $.Deferred();

        setTimeout(
            function () {
                if (callback) {
                    deferred.resolve(
                        callback()
                    );
                }
                else {
                    deferred.resolve();
                }
            }
        );

        return deferred;

    };

});