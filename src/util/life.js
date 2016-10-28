/**
 * @file 组件生命周期管理
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var guid = require('../function/guid');
    var around = require('../function/around');
    var extend = require('../function/extend');
    var ucFirst = require('../function/ucFirst');
    var nextTick = require('../function/nextTick');
    var toBoolean = require('../function/toBoolean');
    var createEvent = require('../function/createEvent');
    var replaceWith = require('../function/replaceWith');
    var offsetParent = require('../function/offsetParent');

    var eventUtil = require('./event');

    var instances = { };

    var UPDATE_ASYNC = '__update_async__';

    /**
     * setter 构造器
     *
     * @inner
     * @param {string} singular 单数形式
     * @param {string} complex 复数形式
     * @param {string} setter setter 方法
     * @param {string} getter getter 方法
     */
    function createSettter(singular, complex, setter, getter, validate) {

        return function (name, value, options) {

            var me = this;

            if ($.isPlainObject(name)) {

                options = value;

                $.each(
                    name,
                    function (name, value) {
                        me[ setter ](name, value, options);
                    }
                );

                return;

            }

            options = options || { };

            var oldValue = me[ getter ](name);

            var validator = me.constructor[ singular + 'Validator' ];
            if (validator) {
                if ($.isFunction(validator[ name ])) {
                    value = validator[ name ].call(me, value, options);
                }
            }

            if ($.isFunction(validate)) {
                value = validate(me, value, options);
            }

            if (oldValue === value && !options.force) {
                return;
            }

            me[ complex ][ name ] = value;

            if (options.silent) {
                return;
            }

            var record = { };
            extend(record, options);

            record.newValue = value;
            record.oldValue = oldValue;

            var change = { };
            change[name] = record;

            var watchChangeSync = function (watch) {
                if (watch && watch[ name ]) {
                    me.execute(
                        watch[ name ],
                        [ value, oldValue, record ]
                    );
                }
            };

            watchChangeSync(
                me.inner('watchSync')
            );
            watchChangeSync(
                me.option('watchSync')
            );

            if (options.sync) {
                watchChangeSync(
                    me.constructor[ singular + 'Updater' ]
                );
                watchChangeSync(
                    me.option('watch')
                );
                me.emit(singular + 'change', change);
                return;
            }

            var changes = me.inner(singular + 'Changes');
            if (!changes) {
                changes = { };
                me.inner(singular + 'Changes', changes);
            }

            $.extend(changes, change);

            if (!me.inner(UPDATE_ASYNC)) {
                me.inner(
                    UPDATE_ASYNC,
                    nextTick(function () {
                        me.sync(UPDATE_ASYNC);
                    })
                );
            }

        };

    }

    /**
     * 元素共享池
     *
     * key 是元素模板字符串，value 是 jQuery 对象
     *
     * @inner
     * @type {Object}
     */
    var elementSharePool = {

    };

    function initStructError() {
        this.error('initStruct() can just call one time.');
    }

    var methods = {

        /**
         * 处理模板替换
         */
        initStruct: function () {

            var me = this;

            var mainElement = me.option('mainElement');
            var mainTemplate = me.option('mainTemplate');

            if ($.type(mainTemplate) === 'string') {

                var share = me.option('share');
                var cacheKey = me.type + mainTemplate;
                if (share) {
                    mainElement = elementSharePool[ cacheKey ];
                }

                var tempElement;
                if (!mainElement) {
                    tempElement = $(mainTemplate);
                    if (share) {
                        elementSharePool[ cacheKey ] = tempElement;
                    }
                }
                else {
                    if (me.option('replace')) {
                        replaceWith(
                            mainElement,
                            tempElement = $(mainTemplate)
                        );
                    }
                    else {
                        mainElement.html(mainTemplate);
                    }
                }

                if (tempElement) {
                    mainElement = tempElement;
                    me.option('mainElement', mainElement);
                }

            }


            var parentSelector = me.option('parentSelector');
            if (parentSelector && !mainElement.parent().is(parentSelector)) {
                mainElement.appendTo(parentSelector);
            }

            me.initStruct = initStructError;

        },

        /**
         * 打印警告信息
         *
         * @param {string} msg
         */
        warn: function (msg) {
            if (typeof console !== 'undefined') {
                console.warn([ '[CC warn]', this.type, msg ].join(' '));
            }
        },

        /**
         * 打印错误信息
         *
         * @param {string} msg
         */
        error: function (msg) {
            throw new Error([ '[CC error]', this.type, msg ].join(' '));
        },

        /**
         * DOM 事件代理
         */
        live: function (event, selector, handler) {
            var me = this;
            var mainElement = me.inner('main');
            if (mainElement) {
                mainElement.on(event + me.namespace(), selector, handler);
            }
            return me;
        },

        /**
         * 触发事件
         *
         * @param {Event|string} event 事件对象或事件名称
         * @param {Object=} data 事件数据
         * @return {Event}
         */
        emit: function (event, data) {

            var me = this;
            var context = me.option('context') || me;

            event = createEvent(event);
            event.cc = context;

            var args = [ event ];
            if ($.isPlainObject(data)) {
                args.push(data);
            }

            event.type = event.type.toLowerCase();

            /**
             * event handler 执行顺序如下：
             * 1. 通过 instance.on 注册的优先使用
             * 2. 执行 options.ontype
             * 3. 执行 options.ontype_ 内部使用，确保有机会在最后执行一些逻辑
             */

            var eventCore = context.get$();
            eventCore.trigger.apply(eventCore, args);

            var ontype = 'on' + event.type;

            if (!event.isPropagationStopped()
                && context.execute(ontype, args) === false
            ) {
                event.preventDefault();
                event.stopPropagation();
            }

            context.execute(ontype + '_', args);

            return event;

        },

        dispatch: function (event, data) {

            if (event.isPropagationStopped()) {
                return;
            }

            // event.originalEvent 通常是 DOM 事件
            // 为了避免外部过多的判断，这里来保证
            if (!event.originalEvent) {
                event.originalEvent = {
                    preventDefault: $.noop,
                    stopPropagation: $.noop
                };
            }

            var dispatchEvent = $.Event(event);
            dispatchEvent.type = 'dispatch';

            this.emit(dispatchEvent, data);

            if (dispatchEvent.isPropagationStopped()) {
                event.preventDefault();
                event.stopPropagation();
            }

        },

        /**
         * 监听 before 事件，比如 before('init', function () { });
         *
         * @param {string} event
         * @param {Function} handler
         * @return {Object}
         */
        before: function (event, handler) {
            return this.on(
                'before' + event.toLowerCase(),
                handler
            );
        },

        /**
         * 监听 after 事件，比如 after('init', function () { });
         *
         * @param {string} event
         * @param {Function} handler
         * @return {Object}
         */
        after: function (event, handler) {
            return this.on(
                'after' + event.toLowerCase(),
                handler
            );
        },

        /**
         * 在主元素中查找子元素
         *
         * @param {string} selector
         * @return {jQuery?}
         */
        find: function (selector) {
            var mainElement = this.inner('main');
            if (mainElement) {
                var result = mainElement.find(selector);
                if (result.length) {
                    return result;
                }
            }
        },

        /**
         * 把组件元素加到 target 内部结束位置
         */
        appendTo: function (target) {
            var element = this.inner('main');
            if (element) {
                element.appendTo(target);
            }
        },

        /**
         * 把组件元素加到 target 内部开始位置
         */
        prependTo: function (target) {
            var element = this.inner('main');
            if (element) {
                element.prependTo(target);
            }
        },

        /**
         * 以组件的身份执行一个函数
         *
         * @param {string|Function} name
         * @param {*} args
         * @return {*}
         */
        execute: function (name, args) {

            var me = this;
            var fn = name;

            if ($.type(name) === 'string') {
                fn = me.option(name);
            }

            if ($.isFunction(fn)) {

                var context = me.option('context') || me;

                if ($.isArray(args)) {
                    return fn.apply(context, args);
                }
                else {
                    return fn.call(context, args);
                }

            }

        },

        renderWith: function (data, template, element) {

            var me = this;

            /**
             * mainTemplate 会在 initStruct() 中用于改写主元素
             * 它可以用来设置组件结构，但最好不要用于局部刷新，因为异步更新的关系，会短暂的出现原始模板
             *
             * renderTemplate 用于设置局部刷新的模板
             * renderSelector 是一个可选项，如果布局刷新的是主元素，那么 renderSelector 可省略
             *
             */

            if (!template) {
                template = me.option('renderTemplate');
                if (!template) {
                    template = me.option('mainTemplate');
                }
            }

            if (!element) {
                element = me.option('mainElement');
            }

            var renderSelector = me.option('renderSelector');
            if (renderSelector) {
                element = element.find(renderSelector);
            }

            var html;

            if ($.isPlainObject(data) || $.isArray(data)) {
                html = me.execute('render', [ data, template ]);
            }
            else if ($.type(data) === 'string') {
                html = data;
            }

            element.html(html);

        },

        /**
         * jquery 事件的命名空间
         *
         * @return {string}
         */
        namespace: function () {
            return '.' + this.guid;
        },

        /**
         * option 的 getter/setter
         *
         * @param {string} name
         * @param {*?} value
         * @return {*?}
         */
        option: function (name, value) {

            var me = this;

            if (arguments.length === 1 && $.type(name) === 'string') {
                return me.options[ name ];
            }
            else {

                if ($.isPlainObject(name)) {
                    $.each(name, function (name, value) {
                        me.option(name, value);
                    });
                    return;
                }

                me.options[ name ] = value;

            }

        },

        /**
         * 私有属性的 getter/setter
         *
         * @param {string} name
         * @param {*?} value
         * @return {*?}
         */
        inner: function (name, value) {

            var me = this;

            // 做一个容错，避免销毁后再次调用
            var inners = me.inners || { };

            if (arguments.length === 1 && $.type(name) === 'string') {
                return inners[ name ];
            }
            else {

                if ($.isPlainObject(name)) {
                    $.each(name, function (name, value) {
                        me.inner(name, value);
                    });
                    return;
                }

                inners[ name ] = value;

            }

        },

        /**
         * state getter
         *
         * @param {string} name
         * @return {boolean?}
         */
        is: function (name) {
            return this.states[ name ];
        },

        /**
         * state setter
         */
        state: createSettter('state', 'states', 'state', 'is',
            function (instance, value) {
                return toBoolean(value, false);
            }
        ),

        /**
         * property getter
         */
        get: function (name) {
            return this.properties[ name ];
        },

        /**
         * property setter
         */
        set: createSettter('property', 'properties', 'set', 'get')

    };

    var aspectMethods = {

        /**
         * 为了更好的性能，以及彻底解决初始化触发 change 事件带来的同步问题
         * 新版把 change 事件做成了单独时间片触发
         *
         * 每个组件都有一个异步更新定时器，在 dispose 时，会把异步的更新立即执行掉
         */
        sync: function () {

            var me = this;

            var update = function (changes, updater, complex) {

                $.each(
                    changes,
                    function (name, change) {
                        return me.execute(
                            updater[ name ],
                            [
                                change.newValue,
                                change.oldValue,
                                complex ? changes : change
                            ]
                        );
                    }
                );

            };

            $.each(
                [ 'property', 'state' ],
                function (index, key) {
                    var changes = me.inner(key + 'Changes');
                    if (changes) {

                        me.inner(key + 'Changes', null);

                        var staticUpdater = me.constructor[ key + 'Updater' ];
                        if (staticUpdater) {
                            update(changes, staticUpdater, true);
                        }

                        var watch = me.option('watch');
                        if (watch) {
                            update(changes, watch);
                        }

                        me.emit(key + 'change', changes);

                    }
                }
            );

            // 手动调的
            if (arguments[0] !== UPDATE_ASYNC) {
                me.execute(
                    me.inner(UPDATE_ASYNC)
                );
            }

            me.inner(UPDATE_ASYNC, false);

        },

        _sync: function () {
            if (!this.inner(UPDATE_ASYNC)) {
                return false;
            }
        },

        _init: function () {
            var state = 'initCalled';
            if (this.is(state)) {
                return false;
            }
            this.state(state, true);
        },

        _dispose: function () {
            var state = 'disposeCalled';
            if (this.is(state)) {
                return false;
            }
            this.state(state, true);
        }

    };

    /**
     * 执行实例的拦截方法
     *
     * 返回 false 可以阻止方法执行，返回 Object 可作为 before after 的事件数据
     *
     * @inner
     * @param {Object} instance 组件实例
     * @param {string} name 拦截方法名称
     * @param {Object} args 拦截方法参数
     * @param {Object} type before or false
     * @param {Object} event 事件
     * @return {boolean?}
     */
    function executeAspect(instance, name, args, type, event) {

        var result;

        var aspect = type === 'before'
                   ? ('_' + name)
                   : (name + '_');

        var method = instance[ aspect ];
        if ($.isFunction(method)) {
            result = method.apply(instance, args);
            if (result !== false && !$.isPlainObject(result)) {
                result = null;
            }
        }

        if (result === false) {
            return false;
        }

        var dispatch = false;
        if (result && result.dispatch) {
            dispatch = true;
            delete result.dispatch;
        }

        event = $.Event(event);
        event.type = type + name;

        instance.emit(event, result);
        if (dispatch) {
            instance.dispatch(event, result);
        }

        if (event.isDefaultPrevented()) {
            return false;
        }

    }

    /**
     * 扩展原型
     *
     * @param {Object} proto
     * @param {Array.<string>} exclude 不需要拦截的方法
     */
    exports.extend = function (proto, exclude) {

        // 前置方法返回 false 可拦截方法执行，后置方法返回 false 可阻止广播 after 事件
        //
        // 前置和后置方法都可以返回 Object，作为 before 和 after 事件的数据，即 trigger(type, data);
        //
        // 拦截方法的写法来自某一天的灵光咋现，因为我不喜欢私有属性和方法带上下划线前缀，但是下划线用来标识前后似乎非常优雅
        //
        // 比如 _show 表示显示之前，show_ 表示显示之后，非常直白

        extend(proto, aspectMethods);

        $.each(proto, function (name, method) {

            var index = name.indexOf('_');

            // 前置和后置方法不用拦截
            if (!$.isFunction(method)
                || index === 0
                || index === name.length - 1
            ) {
                return;
            }

            if ($.isArray(exclude)
                && $.inArray(name, exclude) >= 0
            ) {
                return;
            }


            var beforeHandler = function (e) {
                return executeAspect(this, name, arguments, 'before', e);
            };

            var afterHandler = function (e) {

                var me = this;
                var args = arguments;

                var emitAfterEvent = function () {
                    return executeAspect(me, name, args, 'after', e);
                };

                if (method.length + 1 === args.length) {
                    // 最后一个参数是方法执行结果
                    // 如果返回了 promise，等待它完成
                    var executeResult = args[ args.length - 1 ];
                    if (executeResult && $.isFunction(executeResult.then)) {
                        executeResult.then(emitAfterEvent);
                        return;
                    }
                }

                emitAfterEvent();

            };

            around(proto, name, beforeHandler, afterHandler);

        });

        extend(proto, methods);
        eventUtil.extend(proto);

    };

    /**
     * 初始化组件
     *
     * @param {*} instance 组件实例对象
     * @param {Object} options 初始化组件所用的配置
     * @return {*} 组件实例
     */
    exports.init = function (instance, options) {

        // options 不要污染 instance，避免 API 的设计自由因 options 字段名受到影响
        if (!options) {
            options = { };
        }

        extend(options, instance.constructor.defaultOptions);

        options.onafterinit_ = function () {
            instance.state('inited', true);
        };
        options.onafterdispose_ = function () {

            instance.state('disposed', true);
            instance.off();

            var mainElement = instance.inner('main');
            if (instance.option('removeOnDispose') && mainElement) {
                mainElement.remove();
            }

            nextTick(function () {
                delete instances[ instance.guid ];

                instance.properties =
                instance.options =
                instance.changes =
                instance.states =
                instance.inners =
                instance.guid = null;
            });

        };


        instances[ instance.guid = guid() ] = instance;

        // 用 properties 属性管理属性
        instance.properties = { };

        // 用 options 属性管理用户配置
        instance.options = options;

        // 用 options 属性管理状态
        instance.states = { };

        // 用 inners 属性管理内部属性
        instance.inners = { };

        instance.init();

        return instance;

    };

    /**
     * 销毁组件
     *
     * @param {*} instance 组件实例
     */
    exports.dispose = function (instance) {

        instance.sync();

        var mainElement = instance.inner('main') || instance.option('mainElement');
        if (mainElement) {
            mainElement.off(
                instance.namespace()
            );
        }

    };

});