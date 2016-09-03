/**
 * @file 有条件的任务
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * @param {Function} task
     * @param {Function} condition
     */
    return function (task, condition) {
        var result = condition();
        if (result === true) {
            task();
        }
        else if (result && result.then) {
            result.then(function (result) {
                if (result === true) {
                    task();
                }
            });
        }
    };

});