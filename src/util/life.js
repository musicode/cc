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

    var body = require('./instance').body;

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

            // 批量更新
            var record = { };
            extend(record, options);

            record.newValue = me[ getter ](name);
            record.oldValue = oldValue;

            var changes = me.inner(singular + 'Changes');
            if (!changes) {
                changes = { };
                me.inner(singular + 'Changes', changes);
            }

            var oldRecord = changes[ name ];
            if (oldRecord) {
                if (oldRecord.oldValue === record.newValue) {
                    delete changes[ name ];
                    return;
                }
            }

            changes[ name ] = record;

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

            if (me.option('underBody')
                && !offsetParent(mainElement).is('body')
            ) {
                body.append(mainElement);
            }

            // 只能执行一次
            me.initStruct = function () {
                me.error('initStruct() can just call one time.');
            };

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
         * 绑定事件
         */
        on: function (event, data, handler) {
            this.$.on(event, data, handler);
            return this;
        },

        /**
         * 绑定一次事件
         */
        once: function (event, data, handler) {
            this.$.one(event, data, handler);
            return this;
        },

        /**
         * 解绑事件
         */
        off: function (event, handler) {
            this.$.off(event, handler);
            return this;
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
         * @param {boolean=} dispatch 组合使用时，是否需要被转发
         * @return {Event}
         */
        emit: function (event, data, dispatch) {

            var me = this;
            var context = me.option('context') || me;

            event = createEvent(event);
            event.cc = context;

            var args = [ event ];
            if ($.isPlainObject(data)) {
                args.push(data);
            }
            else if (data === true && arguments.length === 2) {
                dispatch = true;
            }

            event.type = event.type.toLowerCase();

            /**
             * event handler 执行顺序如下：
             * 1. 通过 instance.on 注册的优先使用
             * 2. 执行 options.ontype
             * 3. 执行 options.ontype_ 内部使用，确保有机会在最后执行一些逻辑
             */

            context.$.trigger.apply(context.$, args);

            var ontype = 'on' + event.type;

if (event.type !== 'dispatch') {
    context.execute('ondebug', args);
}

            if (!event.isPropagationStopped()
                && context.execute(ontype, args) === false
            ) {
                event.preventDefault();
                event.stopPropagation();
            }

            context.execute(ontype + '_', args);

            if (dispatch && !event.isPropagationStopped()) {
                var dispatchEvent = me.emit(
                    'dispatch',
                    {
                        event: event,
                        data: data
                    }
                );
                if (dispatchEvent.isPropagationStopped()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }

            return event;

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

            if (!template) {
                template = me.option('mainTemplate');
            }
            if (!element) {
                element = me.option('mainElement');
            }

            var renderSelector = me.option('renderSelector');
            var renderTemplate = me.option('renderTemplate');

            var renderElement;

            if (!renderSelector || !renderTemplate) {
                if (me.option('replace')) {
                    me.error('replace must be false if not configure renderSelector and renderTemplate.');
                }
                renderElement = element;
                renderTemplate = template;
            }
            else {
                renderElement = element.find(renderSelector);
            }

            var html;

            if ($.isPlainObject(data) || $.isArray(data)) {
                html = me.execute('render', [ data, renderTemplate ]);
            }
            else if ($.type(data) === 'string') {
                html = data;
            }

            renderElement.html(html);

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

            var createUpdater = function (updater, changes) {
                return function (name, change) {
                    var fn = updater[ name ];
                    if ($.isFunction(fn)) {
                        return fn.call(
                            me,
                            change.newValue,
                            change.oldValue,
                            changes
                        );
                    }
                };
            };

            $.each(
                [ 'property', 'state' ],
                function (index, key) {
                    var changes = me.inner(key + 'Changes');
                    if (changes) {

                        var staticUpdater = me.constructor[ key + 'Updater' ];
                        if (staticUpdater) {
                            $.each(
                                changes,
                                createUpdater(staticUpdater, changes)
                            );
                        }

                        var instanceUpdater = me.option(key + 'Change');
                        if (instanceUpdater) {
                            $.each(
                                changes,
                                createUpdater(instanceUpdater, changes)
                            );
                        }

                        me.inner(key + 'Changes', null);
                        me.emit(key + 'change', changes);

                    }
                }
            );

            // 手动调的
            if (arguments[0] !== UPDATE_ASYNC) {
                me.inner(UPDATE_ASYNC)();
            }

            me.inner(UPDATE_ASYNC, false);

        },

        _sync: function () {
            if (!this.inner(UPDATE_ASYNC)) {
                return false;
            }
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

        if (event && event[ $.expando ]) {
            if (!result) {
                result = { };
            }
            result.event = event;
        }


        event = instance.emit(
            createEvent(type + name),
            result,
            result && result.dispatch
        );

        if (event.isDefaultPrevented()) {
            return false;
        }

    }

    /**
     * 扩展原型
     *
     * @param {Object} proto
     */
    exports.extend = function (proto) {

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

        extend(options, instance.constructor.defaultOptions);

        options.onafterinit_ = function () {
            instance.state('inited', true);
        };
        options.onafterdispose_ = function () {

            instance.state('disposed', true);

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
                instance.guid =
                instance.$ = null;
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

        // 用 jQuery 实现事件系统
        instance.$ = $({ });

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
        instance.$.off();

        var mainElement = instance.inner('main');
        if (mainElement) {
            mainElement.off();
        }

    };

});