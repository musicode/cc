/**
 * @file 表单验证器
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');

    /**
     * 表单验证通常包括 required, min, max 等
     * 为方便记忆，属性名称遵循 HTML5 标准，具体可参考 html5 input 元素属性
     *
     *  required: 是否必填
     *       max: 数字最大值
     *       min: 数字最小值
     *      step: 数字步进值
     * maxlength: 字符串最大长度
     * minlength: 字符串最小长度
     *   pattern: 正则
     *
     * {
     *     fields: {
     *         username: {
     *
     *             // rules 可写在 DOM 属性或是配置对象
     *             // 这个暂时不开放使用，先直接写在 DOM 属性上
     *             rules: {
     *                 required: true,
     *                 min: 3,
     *                 max: 10,
     *                 minlength: 3,
     *                 maxlength: 10,
     *                 pattern: /\d/
     *             },
     *
     *             // 与 rules 一一对应的错误信息
     *             errors: {
     *                 required: '请输入用户名',
     *                 min: '最小为 3'，
     *                 ...
     *             },
     *
     *             // 自定义校验规则，可同步也可异步
     *             // 同步返回 错误信息，如果正确，返回 '' 或 true
     *             // 异步返回 undefined（即不 return，总得有个标识是异步吧...）
     *
     *             // 异步通过回调函数第一个参数表示是否验证通过，如果是长度大于 1 的字符串，表示错误，其他情况都算成功
     *             custom: function (field, callback) {
     *
     *                 $
     *                 .post(
     *                     'xxx',
     *                     {
     *                         value: ''
     *                     }
     *                 )
     *                 .done(function (response) {
     *
     *                     if (response.code === 0) {
     *                         callback();
     *                     }
     *                     else {
     *                         callback('校验错误');
     *                     }
     *                 });
     *
     *
     *             }
     *         }
     *     }
     * }
     */

    /**
     * 表单验证器
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 表单元素
     * @property {boolean=} options.realtime 是否实时验证（元素失焦验证），默认为 false
     *
     * @property {number=} options.scrollGap 开启 autoScroll 时，为了避免顶部贴边，最好加上一些间距
     *
     * @property {string=} options.successClass 验证通过的 className
     * @property {string=} options.errorClass 验证失败的 className
     *
     * @property {boolean} options.groupSelector 上面三个 className 作用于哪个元素，不传表示当前字段元素，
     *                                           传了则用 field.closest(selector) 进行向上查找
     *
     * @property {string=} options.errorSelector 显示错误文本的元素选择器，如 .error
     *
     * @property {Object=} options.fields 配置字段
     *
     * @property {Function=} options.onBeforeValidate 校验开始前调用
     * @property {Function=} options.onAfterValidate 校验结束后调用，触发方式可以是表单产生 submit 事件 或 点击按钮
     *                                               当使用 <form> 元素时，此接口比较有用
     */
    function Validator(options) {
        return lifeCycle.init(this, options);
    }

    Validator.prototype = {

        constructor: Validator,

        type: 'Validator',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var element = me.element;

            // 禁用原生表单验证
            var form = element.prop('tagName') === 'FORM'
                     ? element
                     : element.find('form');

            if (form.length > 0) {
                form
                .attr('novalidate', 'novalidate')
                .on(
                    'submit' + namespace,
                    $.proxy(me.validate, me)
                );
            }

            var groupSelector = me.groupSelector;

            element.on(
                'focusin' + namespace,
                function (e) {

                    var group = $(e.target).closest(groupSelector);
                    var className = [ me.successClass, me.errorClass, me.requiredClass ].join(' ');

                    group.removeClass(
                        $.trim(className)
                    );

                }
            );

            if (me.realtime) {
                element.on(
                    'focusout' + namespace,
                    function (e) {

                        var target = $(e.target);
                        var name = target.prop('name');

                        if (!name) {
                            target = target.find('[name]');
                            name = target.prop('name');
                        }

                        if (name) {
                            me.validate(name);
                        }
                    }
                );
            }

        },

        /**
         * 验证表单的所有字段
         *
         * @param {(Array.<string>|string)=} fields 可选，验证一个或多个字段
         *                                          如 ['username', 'password']
         *                                          默认验证所有字段
         *
         * @param {boolean=} autoScroll 验证失败时，是否自动滚动到第一个错误项，当表单很长时，开启有利于提升体验
         *
         * @return {boolean} 是否验证成功
         */
        validate: function (fields, autoScroll) {

            var me = this;

            var event = me.emit('beforeValidate');
            if (event.isDefaultPrevented()) {
                return;
            }

            var element = me.element;
            var groupSelector = me.groupSelector;

            // 收集错误信息
            var errors = [ ];

            var groups;

            if ($.type(fields) === 'string') {
                fields = [ fields ];
            }

            if ($.isArray(fields)) {
                groups = $.map(
                            fields,
                            function (name) {
                                return element
                                .find('[name="' + name + '"]')
                                .closest(groupSelector);
                            }
                        );
            }
            else {

                groups = element.find(groupSelector);

                if ($.type(fields) === 'boolean') {
                    autoScroll = fields;
                }

                fields = [ ];
            }

            // 按组验证，每组里面只要有一个错了就算整组错了
            var groupPromises = [ ];

            $.each(
                groups,
                function (index, group) {

                    group = $(group);

                    // 隐藏状态不需要验证
                    if (group.is(':visible')) {

                        // 理论上说，一个 group 最好只有一个 field
                        // 否则不好显示 error
                        // 如果真的有多个，优先显示第一个
                        group
                        .find('[name]')
                        .each(function () {

                            var field = $(this);

                            fields.push(field.prop('name'));

                            var error = validateField(me, field);
                            // 统一成字符串
                            if (error === true) {
                                error = '';
                            }

                            if (error) {
                                if (error.promise) {

                                    groupPromises.push(
                                        resolvePromises([ error ])
                                        .done(function (error) {
                                            if (error) {
                                                updateGroup(me, group, field, error);
                                                errors.push({
                                                    element: field,
                                                    error: error
                                                });
                                            }
                                        })
                                    );

                                    return false;

                                }
                                else if ($.type(error) === 'string') {

                                    updateGroup(me, group, field, error);

                                    errors.push({
                                        element: field,
                                        error: error
                                    });

                                    return false;
                                }
                            }

                            updateGroup(me, group, field, error);

                        });

                    }
                }
            );

            var afterValidate = function () {

                if (autoScroll) {
                    scrollToFirstError(errors, me.scrollGap);
                }

                me.emit(
                    'afterValidate',
                    // 转成对象的形式，才能用 jquery 的 trigger 传递数据
                    {
                        fields: fields,
                        errors: errors
                    }
                );
            };

            if (groupPromises.length > 0) {

                return resolvePromises(groupPromises)
                .done(afterValidate);

            }
            else {

                afterValidate();

                return errors.length === 0;

            }

        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;
        }

    };

    jquerify(Validator.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Validator.defaultOptions = {
        realtime: false,
        scrollGap: 100,
        groupSelector: '.form-group',
        successClass: 'has-success',

        errorClass: 'has-error',
        errorSelector: '.error',
        errorTemplate: '<i class="icon icon-times-circle"></i>&nbsp;${text}',

        requiredClass: 'has-required',
        requiredSelector: '.required',
        requiredTemplate: '${text}',

        renderTemplate: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] || '';
            });
        },
        errorPlacement: function (field, error) {

            if (field.prop('type') === 'hidden') {
                field = field.parent();
            }

            // 把 position 清空才能取到正确的宽度
            error.css({
                position: 'static',
                width: 'auto'
            });

            // 先取宽度，取完宽度要再绝对定位，避免影响原来的布局
            // 产生位置偏差
            var width = error.outerWidth(true) + 5;

            error.css({
                position: 'absolute',
                width: width
            });

            var parent = field.parent();

            if (parent.is('.placeholder-wrapper')) {
                field = parent;
            }

            var position = field.position();

            error.css({
                left: position.left + field.outerWidth() - 37,
                top: position.top - error.outerHeight() + 8,
            });

        }
    };

    /**
     * 配置验证类型
     *
     * key 是 <input type="" /> 中的 type
     *
     * 可扩展，比如想设计用户名规则，可添加
     *
     * Validator.type.username = [ ]
     *
     * @static
     * @type {Object}
     */
    Validator.type = {

        text: [ 'required', 'pattern', 'min', 'max', 'minlength', 'maxlength' ],

        hidden: [ 'required' ],

        password: [ 'required', 'pattern', 'minlength', 'maxlength', 'equals' ],

        number: [ 'required', 'pattern', 'min', 'max', 'step' ],

        range: [ 'required', 'pattern', 'min', 'max', 'step' ],

        tel: [ 'required', 'pattern' ],

        url: [ 'required', 'pattern' ],

        email: [ 'required', 'pattern' ],

        // 下面是扩展

        mobile: [ 'required', 'pattern' ],

        money: [ 'required', 'pattern', 'min', 'max' ],

        idcard: [ 'required', 'pattern' ],

        int: [ 'required', 'pattern', 'min', 'max' ]

    };

    /**
     * 配置属性验证
     *
     * @static
     * @type {Object}
     */
    Validator.attr = {

        required: function (field) {
            if ($.trim(field.val()).length > 0) {
                return true;
            }
            else if (field.attr('required') === 'required') {
                return false;
            }
        },

        pattern: function (field) {

            var pattern = field.attr('pattern')
                        || Validator.pattern[field.attr('type')];

            if ($.type(pattern) === 'string') {
                pattern = new RegExp(pattern);
            }

            if (pattern) {
                return pattern.test($.trim(field.val()));
            }
        },

        minlength: function (field) {
            var len = field.attr('minlength');
            if ($.isNumeric(len)) {
                return $.trim(field.val()).length >= + len;
            }
        },

        maxlength: function (field) {
            var len = field.attr('maxlength');
            if ($.isNumeric(len)) {
                return $.trim(field.val()).length <= + len;
            }
        },

        min: function (field) {
            var min = field.attr('min');
            if ($.isNumeric(min)) {
                // min 转成数字进行比较
                return $.trim(field.val()) >= + min;
            }
        },

        max: function (field) {
            var max = field.attr('max');
            if ($.isNumeric(max)) {
                // max 转成数字进行比较
                return $.trim(field.val()) <= + max;
            }
        },

        step: function (field) {
            var min = field.attr('min') || 1;
            var step = field.attr('step');
            if ($.isNumeric(step)) {
                return ($.trim(field.val()) - min) % step === 0;
            }
        },

        /**
         * 是否和另一个字段相同，确认密码常用，如
         * <input type="password" name="password" required />
         * <input type="password" name="password_confirm" equals="password" />
         *
         * @param {jQuery} field 字段元素
         * @param {jQuery} form 表单元素
         * @return {?boolean}
         */
        equals: function (field, form) {
            var equals = field.attr('equals');
            if (equals) {
                var target = form.find('[name="' + equals + '"]');
                return $.trim(field.val()) === $.trim(target.val());
            }
        }

    };

    /**
     * 配置 type 对应的正则
     *
     * @static
     * @type {Object}
     */
    Validator.pattern = {
        number: /^[\d.]*$/,
        int: /^\d+$/,
        url: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        tel: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        mobile: /^1[3-9]\d{9}$/,
        email: /^(?:[a-z0-9]+[_\-+.]+)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i,
        money: /^[\d.]*$/,
        idcard: /(^\d{15}$)|(^\d{17}([0-9]|X)$)/i
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_form_validator';

    function scrollToFirstError(errors, scrollGap) {

        if (errors.length > 0) {

            var element = errors[0].element;

            if (element.is(':hidden')) {
                element = element.parent();
            }

            var top = element.offset().top;

            if (scrollGap > 0) {
                top -= scrollGap;
            }

            window.scrollTo(
                window.scrollX,
                top
            );
        }

    }

    /**
     * 解析一堆 promise
     *
     * @inner
     * @param {Array.<Promise>} promises
     * @return {Promise}
     */
    function resolvePromises(promises) {

        var promise = $.Deferred();

        $.when
        .apply($, promises)
        .done(function () {

            var error;

            $.each(
                arguments,
                function (index, result) {
                    if (result && $.type(result) === 'string') {
                        error = result;
                        return false;
                    }
                }
            );

            promise.resolve(error);

        });

        return promise;
    }

    function updateGroup(validator, group, field, error) {

        var successClass = validator.successClass;
        var errorClass = validator.errorClass;

        if (error) {

            group
            .removeClass(successClass)
            .addClass(errorClass);

            var errorSelector = validator.errorSelector;
            if (errorSelector) {

                var errorElement = group.find(errorSelector);

                var errorTemplate = validator.errorTemplate;
                if (errorTemplate) {
                    error = validator.renderTemplate(
                                {
                                    text: error
                                },
                                errorTemplate
                            );
                }
                errorElement.html(error);

                var errorPlacement = validator.errorPlacement;
                if ($.isFunction(errorPlacement)) {
                    errorPlacement(
                        field,
                        errorElement
                    );
                }
            }
        }
        else {
            group
            .removeClass(errorClass)
            .addClass(successClass);
        }
    }

    /**
     * 验证表单字段
     *
     * @inner
     * @param {Validator} validator 验证器实例
     * @param {jQuery} field 表单字段元素
     * @return {Function|string} 正确时返回空，错误时返回错误信息
     *                           如果涉及远程校验，返回回调函数
     */
    function validateField(validator, field) {

        if (field.prop('disabled')) {
            return;
        }

        var form = validator.element;

        // 这里不要用 field.prop，因为不合法的 type，浏览器会纠正为 text
        var type = field.attr('type');
        var name = field.prop('name');
        var value = field.prop('value');

        // 验证失败的属性名称，如 required
        var errorAttr;

        $.each(
            Validator.type[type] || [ ],
            function (index, name) {

                var result = Validator.attr[name](field, form);

                if ($.type(result) === 'boolean') {
                    if (!result) {
                        errorAttr = name;
                        return false;
                    }
                }
                // 如果不是强制字段，为空时避免后续属性的检测
                else if (value === '' && name === 'required') {
                    return false;
                }

            }
        );

        var conf = validator.fields[name];

        if (conf) {

            if (errorAttr) {

                var error = conf.errors[errorAttr];

                if (error) {
                    return error;
                }
                else {
                    throw new Error(name + ' 字段 ' + errorAttr + ' 类型错误信息未定义');
                }

            }
            else {

                var custom = conf.custom;

                if ($.isFunction(custom)) {

                    var promise = $.Deferred();

                    var result = custom(
                        field,
                        function (error) {
                            promise.resolve(error);
                        }
                    );

                    return result == null ? promise : result;

                }
            }
        }

    }


    return Validator;

});
