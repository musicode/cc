/**
 * @file 生成全局唯一的 ID
 * @author musicode
 */
define(function (require, exports, module) {

    var index = 0;

    return function () {
        return 'cc_' + index++;
    };

});