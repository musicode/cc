/**
 * @file 树
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var toString = require('../function/toString');
    var lifeUtil = require('../util/life');

    /**
     * 树形组件的特点如下：
     *
     * 1. 根节点可以是一个或多个
     * 2. 节点应有 id，便于点击时快速知道是哪个节点
     * 3. 节点可以无限深入，当然实际场景中通常只有三层
     * 4. 子节点数据懒加载，否则数据量大了之后系统会扛不住
     *
     * 常见交互如下：
     *
     * 1. 节点数据是否已加载
     * 2. 判断节点当前是已展开或已收起状态
     * 3. 节点点击后的反应，比如展开收起
     * 4. 刷新子树
     *
     * 需要注意的是，至少要在节点元素上加上 data-id，否则无法进行 DOM 查找
     *
     * 节点元素指的是包含 文本和子树 的的元素，这点一定要注意，它对应着节点的数据结构：
     *
     * ```
     * {
     *     id: '',
     *     name: '',
     *     children: [],
     *
     *     为了方便渲染，在交互过程中产生的状态也会记录到这里，render 可以根据这些状态去渲染节点
     *     expanded: true,
     *     active: true
     * }
     * ```
     *
     * 更新子树是一件比较蛋疼的事，因为 data 始终是一个引用，因此 data 的改变只能是单向的，
     * 即修改了 data，需要手动调用一下 render(id)
     *
     * new Tree({
     *     data: [
     *         {
     *             id: '',
     *             name: '',
     *             children: [
     *                 {
     *                     id: '',
     *                     name: ''
     *                 }
     *             ]
     *         }
     *     ],
     *     onselect: function (node) {
     *
     *     }
     * })
     */

    /**
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {string} options.value 选中的节点，值是节点 id
     * @property {Object} options.data 节点数据
     *
     * @property {string} options.nodeSelector 节点选择器，如果以每个节点都是一棵子树来看，叫做 treeSelector 似乎也可以
     *
     * @property {string} options.labelSelector 节点文本的选择器
     * @property {string} options.toggleSelector 节点展开收起开关选择器
     *
     * @property {string} options.activeClass 节点选中状态时添加的 className
     * @property {string} options.expandedClass 节点展开状态时添加的 className
     * @property {string} options.collapsedClass 节点收起状态时添加的 className
     *
     * @property {string} options.nodeTemplate 节点模板
     * @property {Function} options.render 渲染模板
     * @property {Function} options.load 加载子节点数据
     */
    function Tree(options) {
        lifeUtil.init(this, options);
    }

    var proto = Tree.prototype;

    proto.type = 'Tree';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var clickType = 'click' + me.namespace();

        var labelSelector = me.option('labelSelector');
        if (labelSelector) {
            mainElement.on(clickType, labelSelector, function (e) {
                var nodeElement = findNodeElement(me, $(this));
                me.select(
                    nodeElement.data('id')
                );
            });
        }

        var toggleSelector = me.option('toggleSelector');
        var nodeSelector = me.option('nodeSelector');
        if (toggleSelector) {

            var expandedClass = me.option('expandedClass');

            mainElement.on(clickType, toggleSelector, function (e) {

                var nodeElement = findNodeElement(me, $(this));
                if (nodeElement) {
                    var id = nodeElement.data('id');
                    if (nodeElement.hasClass(expandedClass)) {
                        me.collapse(id);
                    }
                    else {
                        me.expand(id);
                    }
                }

            });
        }



        me.inner({
            main: mainElement
        });

        me.set({
            data: me.option('data'),
            value: me.option('value')
        });

    };

    /**
     * 渲染树
     *
     * @param {string} id 子树 id，如果未传 id，渲染整棵树
     */
    proto.render = function (id) {

        var me = this;

        var html = '';

        me.walk(
            {
                leave: function (node, cache) {

                    var childrenView = '';

                    if (node.children) {
                        $.each(
                            node.children,
                            function (index, node) {
                                childrenView += cache[ node.id ].view;
                            }
                        );
                    }

                    var nodeCache = cache[ node.id ];

                    nodeCache.view = me.execute(
                        'render',
                        [
                            {
                                node: node,
                                cache: nodeCache,
                                childrenView: childrenView
                            },
                            me.option('nodeTemplate')
                        ]
                    );

                    if (id == null) {
                        if (!nodeCache.level) {
                            html += nodeCache.view;
                        }
                    }
                    else if (id === node.id) {
                        html += nodeCache.view;
                        return false;
                    }


                }
            }
        );

        if (id == null) {
            me.inner('main').html(html);
        }
        else {
            var nodeElement = findNodeElement(me, id);
            if (nodeElement) {
                nodeElement.replaceWith(html);
            }
        }

    };

    /**
     * 加载 id 节点的数据
     *
     * @param {string} id
     * @return {Promise}
     */
    proto.load = function (id) {

        var me = this;

        var deferred = $.Deferred();

        var target;

        me.walk({
            enter: function (node, cache) {
                if (node.id === id) {
                    target = node;
                    return false;
                }
            }
        });

        if (target) {
            me.execute(
                'load',
                [
                    target,
                    function (error, data) {

                        if (error) {
                            deferred.reject(error);
                        }
                        else {
                            deferred.resolve(data);
                        }

                    }
                ]
            );
        }
        else {
            deferred.reject('node[' + id + '] not found.');
        }

        return deferred;

    };

    /**
     * 遍历树
     *
     * 为了方便存储一些临时数据，enter leave 第二个参数是 cache
     * cache 的 key 是 node id，值是 node 相关的数据，本方法只记录了 parent 和 level，调用可扩展
     *
     * @param {Array|Object} data 遍历数据，如果不传，写法为 walk(options)，遍历的是实例的数据
     * @param {Function} options
     * @property {Function} options.enter 返回 false 可停止遍历
     * @property {Function} options.leave
     */
    proto.walk = function (data, options) {

        var me = this;

        if (arguments.length === 1) {
            options = data;
            data = me.get('data');
        }

        if (!$.isArray(data)) {
            data = [ data ];
        }

        var enter = options.enter || $.noop;
        var leave = options.leave || $.noop;

        var cache = { };

        $.each(
            data,
            function (index, node) {
                walkTree(
                    node,
                    null,
                    function (node, parent) {

                        var level = parent
                                  ? (cache[ parent.id ].level + 1)
                                  : 0;

                        cache[ node.id ] = {
                            level: level,
                            parent: parent
                        };

                        return enter(node, cache);

                    },
                    function (node, parent) {
                        return leave(node, cache);
                    }
                );
            }
        );

    };

    /**
     * 查找节点数据
     *
     * @param {string} id
     * @return {Object?}
     */
    proto.grep = function (id) {

        var result;

        this.walk({
            enter: function (node) {
                if (node.id === id) {
                    result = node;
                    return false;
                }
            }
        });

        return result;

    };

    /**
     * 选中节点
     *
     * @param {string} id
     */
    proto.select = function (id) {

        this.set('value', id);

    };

    /**
     * 取消选中节点
     *
     * @param {string} id
     */
    proto.unselect = function (id) {

        this.set('value', '');

    };

    /**
     * 展开节点
     *
     * @param {string} id
     */
    proto.expand = function (id) {

        var me = this;

        me.grep(id).expanded = true;

        findNodeElement(me, id)
            .removeClass(
                me.option('collapsedClass')
            )
            .addClass(
                me.option('expandedClass')
            );

    };

    /**
     * 收起节点
     *
     * @param {string} id
     */
    proto.collapse = function (id) {

        var me = this;

        me.grep(id).expanded = false;

        findNodeElement(me, id)
            .removeClass(
                me.option('expandedClass')
            )
            .addClass(
                me.option('collapsedClass')
            );

    };

    proto._select =
    proto._expand =
    proto._collapse = function (id) {

        var me = this;

        var nodeData = me.grep(id);
        if (nodeData && findNodeElement(me, id)) {
            return {
                node: nodeData
            };
        }
        else {
            return false;
        }

    };

    proto._render = function (id) {
        if (id != null) {

            var me = this;

            var nodeData = me.grep(id);
            if (nodeData && findNodeElement(me, id)) {
                return {
                    node: nodeData
                };
            }
            else {
                return false;
            }
        }
    };

    proto.select_ =
    proto.expand_ =
    proto.collapse_ = function (id) {
        return {
            node: this.grep(id)
        };
    };

    proto.render_ = function (id) {
        if (id != null) {
            return {
                node: this.grep(id)
            };
        }
    };


    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);


    Tree.propertyUpdater = {

        data: function () {
            this.render();
        },

        value: function (newValue, oldValue) {

            var me = this;

            var activeClass = me.option('activeClass');
            if (!activeClass) {
                return;
            }

            var nodeData;
            var nodeElement;

            if (oldValue) {
                nodeData = me.grep(oldValue);
                nodeElement = findNodeElement(me, oldValue);
                if (nodeData && nodeElement) {
                    nodeData.active = false;
                    nodeElement.removeClass(activeClass);
                }
            }

            if (newValue) {
                nodeData = me.grep(newValue);
                nodeElement = findNodeElement(me, newValue);
                if (nodeData && nodeElement) {
                    nodeData.active = true;
                    nodeElement.addClass(activeClass);
                }
            }


        }

    };

    Tree.propertyValidator = {

        data: function (data) {
            return $.isArray(data) ? data : [ ];
        },

        value: toString

    };

    /**
     * 通过节点 id 找节点元素
     *
     * @inner
     * @param {Tree} instance
     * @param {string} id
     * @return {jQuery?}
     */
    function findNodeElement(instance, id) {

        var mainElement = instance.inner('main');

        var nodeSelector = instance.option('nodeSelector');
        var nodeElement = id.jquery
                        ? id
                        : mainElement.find('[data-id="' + id + '"]');

        if (nodeElement.length === 1) {
            nodeElement = nodeElement.closest(nodeSelector);
            if (nodeElement.length === 1) {
                return nodeElement;
            }
        }

    }

    /**
     * 遍历节点
     *
     * @inner
     * @param {Object} node
     * @param {Object} parent
     * @param {Function} enter
     * @param {Function} leave
     */
    function walkTree(node, parent, enter, leave) {

        var status = enter(node, parent)

        if (status !== false) {

            if ($.isArray(node.children)) {
                $.each(
                    node.children,
                    function (index, child) {
                        return status = walkTree(child, node, enter, leave);
                    }
                );
            }

            if (status !== false) {
                status = leave(node, parent);
            }

        }

        return status;

    }


    return Tree;

});