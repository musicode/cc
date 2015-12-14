define(function (require, exports, module) {

    'use strict';

    var Tree = require('cc/ui/Tree');
    var etpl = require('cc/util/etpl');

    var tplRender = { };

    Tree.defaultOptions = {
        labelSelector: '.tree-node > label',
        toggleSelector: '.tree-node > .fa',

        nodeActiveClass: 'active',
        nodeExpandedClass: 'expanded',
        nodeCollapsedClass: 'collapsed',

        nodeSelector: '.tree',
        idAttribute: 'data-id',

        nodeTemplate: '<div class="tree'

                    + '<!-- if: ${node.expanded} -->'
                    +     ' expanded'
                    + '<!-- /if -->'

                    + '<!-- if: ${node.active} -->'
                    +     ' active'
                    + '<!-- /if -->'

                    + '<!-- if: ${cache.parent} -->'
                    +     ' sub-tree" data-parent-id="${cache.parent.id}"'
                    + '<!-- else -->'
                    +     '"'
                    + '<!-- /if -->'

                    + ' data-id="${node.id}" data-level="${cache.level}">'
                    +     '<div class="tree-node">'

                    +         '<!-- if: !${node.children} || ${node.children.length} > 0 -->'

                    +         '<!-- if: ${node.expanded} -->'
                    +             '<i class="fa fa-minus-square${className}"></i>'
                    +         '<!-- else -->'
                    +             '<i class="fa fa-plus-square${className}"></i>'
                    +         '<!-- /if -->'

                    +         '<!-- /if -->'

                    +         '<label>${node.name}</label>'
                    +     '</div>'
                    +     '<!-- if: ${node.children} -->'
                    +     '<div class="tree-children">${childrenView|raw}</div>'
                    +     '<!-- /if -->'
                    + '</div>',

        render: function (data, tpl) {

            var render = tplRender[ tpl ];
            if (!render) {
                render = tplRender[ tpl ] = etpl.compile(tpl);
            }

            return render(data);
        },

        onbeforeexpand: function (e, data) {

            var nodeId = data.node.id;
            if (nodeId) {
                var me = this;
                var node = me.grep(nodeId);
                if (node) {
                    var nodeElement = me.find('[data-id="' + nodeId + '"]');
                    var childrenElement = nodeElement.find('.tree-children');

                    if (!node.children) {

                        if (!childrenElement.length) {
                            childrenElement = $('<div class="tree-children"></div>');
                            nodeElement.append(childrenElement);
                        }

                        childrenElement.html('<div class="tree-status">loading</div>');

                        me
                        .load(nodeId)
                        .then(function (data) {

                            node.children = data;

                            me.render(nodeId);

                        });

                    }
                    else if (!node.children.length) {
                        childrenElement.html(
                            '<div class="tree-status">loading</div>'
                        );
                    }

                }

            }
        },
        onafterexpand: function (e, data) {

            var nodeId = data.node.id;
            if (nodeId) {
                var me = this;
                var node = me.grep(nodeId);
                if (node) {
                    var nodeElement = me.find('[data-id="' + nodeId + '"]');
                    var toggleElement = nodeElement.find('.fa-plus-square').eq(0);
                    if (toggleElement.length) {
                        toggleElement
                            .removeClass('fa-plus-square')
                            .addClass('fa-minus-square');
                    }
                }
            }

        },
        onaftercollapse: function (e, data) {

            var nodeId = data.node.id;
            if (nodeId) {
                var me = this;
                var node = me.grep(nodeId);
                if (node) {
                    var nodeElement = me.find('[data-id="' + nodeId + '"]');
                    var toggleElement = nodeElement.find('.fa-minus-square').eq(0);
                    if (toggleElement.length) {
                        toggleElement
                            .removeClass('fa-minus-square')
                            .addClass('fa-plus-square');
                    }
                }
            }

        }
    };

    return Tree;

});
