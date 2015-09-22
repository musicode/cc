/**
 * @file 树
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 树形组件的特点如下：
     *
     * 1. 根节点可以是一个或多个
     * 2. 节点应有 id，便于点击时快速知道是哪个节点
     * 3. 节点可以无限深入，当然实际场景中通常只有三层
     * 4. 子节点数据懒加载，否则数据量大了之后系统会扛不住
     *
     * new Tree({
     *     nodes: [
     *         {
     *             id: '',
     *             text: '',
     *             children: [
     *
     *             ]
     *         }
     *     ],
     *     onselect: function () {
     *
     *     }
     * })
     */

    /**
     *
     * @param {Object} options
     * @param {Object} options.nodes
     * @property {string} options.nodeTemplate
     * @property {string} options.renderTemplate
     */
    function Tree(options) {
        lifeCycle.init(this, options);
    }

    var proto = Tree.prototype;

    proto.type = 'Tree';

    proto.render = function (subTree) {

    };

    proto.expand = function (id) {

    };

    proto.collapse = function (id) {

    };


    return Tree;

});