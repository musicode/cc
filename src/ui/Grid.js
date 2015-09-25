/**
 * @file 表格
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../util/lifeCycle');

    /**
     * {
     *    columns: [
     *        {
     *            title: '',
     *            key: '',
     *            sortable: true,
     *            content: function () {
     *
     *            }
     *        }
     *    ],
     *    data: [
     *        {
     *            name: '',
     *            value: ''
     *        }
     *    ]
     * }
     *
     * @param {Object} options
     * @property {Array.<Object>} options.fields
     */
    function Grid(options) {
        lifeCycle.init(this, options);
    }

    var proto = Grid.prototype;

    proto.type = 'Grid';

    proto.init = function () {

    };

    proto.render = function () {

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

    };

    lifeCycle.extend(proto);

    Grid.defaultOptions = {

        template: '<div class="grid">'
                +     '<div class="grid-header"></div>'
                +     '<div class="grid-body"></div>'
                +     '<div class="grid-footer"></div>'
                + '</div>'

    };


    return Grid;

});