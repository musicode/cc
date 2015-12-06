/**
 * @file 是否支持 flash player
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 是否支持 flash player
     *
     * @return {boolean}
     */
    return function () {

        var swf;
        var plugins = navigator.plugins;

        if (plugins && plugins.length > 0) {
            swf = plugins['Shockwave Flash'];
        }
        else if (document.all) {
            swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        }

        return !!swf;

    };

});