/**
 * @file 减法
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var decimalLength = require('./decimalLength');
    var float2Int = require('./float2Int');

    /**
     * 减法
     *
     * @param {number} a
     * @param {number} b
     * @return {number}
     */
    return function (a, b) {

        var length = Math.max(
                        decimalLength(a),
                        decimalLength(b)
                    );

        a = float2Int(a, length);
        b = float2Int(b, length);

        return (a - b) / Math.pow(10, length);

    };

});