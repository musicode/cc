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
            try {
                // 有些 IE 因为安全限制会报错
                swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            }
            catch (e) {}
        }

        return !!swf;

    };

});