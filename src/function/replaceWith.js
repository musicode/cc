/**
 * @file jq 的 replaceWith 会解绑所有事件，太坑了..
 * @author musicode
 */
define(function (require) {

    'use strict';

    return function (oldElement, newElement) {

        oldElement = oldElement[0];
        newElement = newElement[0];

        oldElement.parentNode.replaceChild(newElement, oldElement);

    };

});