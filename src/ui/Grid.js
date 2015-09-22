/**
 * @file 表格
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * {
     *    fields: [
     *        {
     *            title: '',
     *            field: '',
     *            sortable: true,
     *            content: function () {
     *
     *            }
     *        }
     *    ]
     * }
     *
     * @param {Object} options
     * @property {Array.<Object>} options.fields
     */
    function Grid(options) {

    }

    Grid.prototype = {

        constructor: Grid,

        type: 'Grid',

        init: function () {

        }

    };

    Grid.defaultOptions = {

        template: '<div class="grid">'
                +     '<div class="grid-header"></div>'
                +     '<div class="grid-body"></div>'
                +     '<div class="grid-footer"></div>'
                + '</div>'


    };

    return Grid;

});