/**
 * @file 表单验证器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var isHidden = require('../function/isHidden');
    var lifeCycle = require('../util/lifeCycle');

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
     *             // 配置字段类型，可用统一的正则进行校验
     *             // 也可直接写在 DOM 元素的 type 属性上
     *             type: 'email',
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
     * @property {jQuery} options.mainElement 表单元素
     * @property {boolean=} options.validateOnBlur 是否实时验证（元素失焦验证），默认为 false
     *
     * @property {number=} options.scrollOffset 使用 autoScroll 时，为了避免顶部贴边，最好加上一些间距
     *
     * @property {string=} options.successClass 验证通过的 className
     *
     * @property {string=} options.errorClass 验证失败的 className
     * @property {string=} options.errorSelector 显示错误文本的元素选择器，如 .error
     * @property {string=} options.errorTemplate 错误模板
     *
     * @property {boolean} options.groupSelector 上面三个 className 作用于哪个元素，不传表示当前字段元素，
     *                                           传了则用 field.closest(selector) 进行向上查找
     *
     * @property {string} options.fieldSelector 有些表单组件是封装过的，比如 div > input:hidden
     *                                          当我们取到 input 时，需要通过 componentSelector 往上找组件元素
     *                                          默认是 '[name]'
     *
     * @property {Object=} options.fields 配置字段
     *
     * @property {Function} options.renderTemplate
     *
     */
    function Validator(options) {
        lifeCycle.init(this, options);
    }

    var proto = Validator.prototype;

    proto.type = 'Validator';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        var namespace = me.namespace();



        var formElement = mainElement.prop('tagName') === 'FORM'
                        ? mainElement
                        : mainElement.find('form');

        if (formElement.length > 0) {
            formElement
                // 禁用原生表单验证
                .attr('novalidate', 'novalidate')
                // 拦截 submit
                .on('submit' + namespace, $.proxy(me.validate, me));
        }



        mainElement.on(
            'focusin' + namespace,
            function (e) {

                var target = $(e.target);

                var groupSelector = me.option('groupSelector');
                var groupElement = target.closest(groupSelector);

                if (groupElement.length === 1) {

                    var className = [
                        me.option('successClass'),
                        me.option('errorClass')
                    ].join(' ');

                    className = $.trim(className);
                    if (className) {
                        groupElement.removeClass(className);
                    }

                }

            }
        );

        if (me.option('validateOnBlur')) {
            mainElement.on(
                'focusout' + namespace,
                function (e) {

                    var target = $(e.target);

                    var name = target.attr('name');
                    if (!name) {
                        // 便于封装组件
                        target = target.find('[name]');
                        if (target.length === 1) {
                            name = target.attr('name');
                        }
                    }

                    if (name) {
                        me.validate(name);
                    }

                }
            );
        }




        me.inner({
            main: mainElement
        });

    };

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
    proto.validate = function (fields, autoScroll) {

        var me = this;

        var mainElement = me.option('mainElement');
        var groupSelector = me.option('groupSelector');


        // 找出需要验证的分组元素列表
        var groupElements;

        if ($.type(fields) === 'string') {
            fields = [ fields ];
        }

        if ($.isArray(fields)) {

            var elementArray = [ ];

            $.each(
                fields,
                function (index, name) {

                    var fieldElement = mainElement.find('[name="' + name + '"]');
                    if (fieldElement.length === 1) {
                        var groupElement = fieldElement.closest(groupSelector);
                        if (groupElement.length === 1) {
                            elementArray.push(groupElement[0]);
                        }
                    }
                }
            );

            groupElements = $(
                $.unique(elementArray)
            );

        }
        else {

            groupElements = mainElement.find(groupSelector);

            if ($.type(fields) === 'boolean') {
                autoScroll = fields;
            }
        }

        // 按组验证，每组里面只要有一个错了就算整组错了
        var validateResult = [ ];
        var syncResult = [ ];

        for (var i = 0, len = groupElements.length; i < len; i++) {

            var groupResult = me.validateGroup(
                groupElements.eq(i)
            );
            if (groupResult.then) {
                syncResult.push(groupResult);
                groupResult = groupResult.result;
            }

            $.merge(validateResult, groupResult);

        }

        var fields = [ ];
        var errors = [ ];

        var validateComplete = function () {

            $.each(
                validateResult,
                function (index, item) {
                    if (item.error) {
                        errors.push(item);
                    }
                    fields.push(item.name);
                }
            );

            if (autoScroll && errors.length > 0) {
                scrollToFirstError(
                    errors,
                    me.option('scrollOffset')
                );
            }

            setTimeout(
                function () {
                    me.emit(
                        'validatecomplete',
                        {
                            fields: fields,
                            errors: errors
                        }
                    );
                }
            );

        };

        if (syncResult.length > 0) {

            return resolvePromises(syncResult).then(validateComplete);

        }
        else {

            validateComplete();

            return errors.length === 0;

        }

    };

    /**
     * 验证分组
     *
     * @param {jQuery} groupElement
     * @returns {Promise|Array}
     */
    proto.validateGroup = function (groupElement) {

        // 隐藏状态不需要验证
        if (isHidden(groupElement)) {
            return;
        }

        var me = this;

        var validateResult = [ ];

        var syncResult = [ ];
        var syncIndex = [ ];

        // 一个 groupElement 最好只有一个 fieldElement，否则不好显示 error
        // 如果真的需要多个 field，依次匹配 error 元素
        groupElement
            .find('[name]')
            .each(function (index) {

                var target = this;
                var fieldElement = $(target);



                var disabled = $.type(target.disabled) === 'boolean'
                             ? target.disabled
                             : fieldElement.attr('disabled') === 'disabled';

                if (disabled) {
                    return;
                }



                var name = $.type(target.name) === 'string'
                         ? target.name
                         : fieldElement.attr('name');

                var fieldConfig = me.option('fields')[ name ];

                if (!fieldConfig) {
                    return;
                }



                var rules = me.inner(name + 'Rules');

                if (rules == null) {
                    rules = compileRules(fieldElement, fieldConfig);
                    me.inner(
                        name + 'Rules',
                        rules || false
                    );
                }



                // 验证失败的属性名称，如 max
                var failRule;
                var failError;

                if (rules) {

                    var ruleMap = { };

                    $.each(
                        rules,
                        function (index, rule) {
                            ruleMap[ rule.name ] = rule.value;
                        }
                    );

                    var value = $.type(target.value) === 'string'
                              ? target.value
                              : fieldElement.attr('value');

                    value = $.trim(value);


                    var validateData = {
                        rules: ruleMap,
                        value: value
                    };





                    $.each(
                        rules,
                        function (index, rule) {

                            var result = me.execute(
                                Validator.rule[ rule.name ],
                                validateData
                            );

                            if (result === false) {
                                failRule = rule;
                                return false;
                            }
                            // 如果不是强制字段，为空时避免后续属性的检测
                            else if (value === '' && rule.name === 'required') {
                                return false;
                            }

                        }
                    );

                }

                if (failRule) {

                    var errors = fieldConfig.errors;
                    if (errors) {
                        failError = errors[ failRule.name ];
                    }

                }
                else if ($.isFunction(fieldConfig.custom)) {

                    var deferred = $.Deferred();

                    var customResult = fieldConfig.custom(
                        fieldElement,
                        function (error) {
                            deferred.resolve(error);
                        }
                    );

                    failError = (customResult == null || customResult.then)
                              ? deferred
                              : customResult;

                }

                var validateItem = {
                    name: name,
                    element: fieldElement,
                    error: failError
                };

                if (failRule) {
                    validateItem.rule = failRule.name;
                }

                var index = validateResult.push(validateItem);

                if (failError && failError.then) {
                    syncResult.push(failError);
                    syncIndex.push(index - 1);
                }

            });

        if (syncResult.length > 0) {

            var promise = resolvePromises(syncResult).then(
                function (errors) {

                    $.each(
                        errors,
                        function (index, error) {
                            validateResult[ syncIndex[ index ] ].error = error;
                        }
                    );

                    refreshGroup(me, groupElement, validateResult);

                }
            );

            promise.result = validateResult;

            return promise;

        }
        else {

            refreshGroup(me, groupElement, validateResult);

            return validateResult;
        }

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    Validator.defaultOptions = {
        validateOnBlur: false,
        scrollOffset: -100,
        groupSelector: '.form-group',
        fieldSelector: '[name]',
        successClass: 'has-success',
        errorClass: 'has-error',
        errorSelector: '.error',
        renderTemplate: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] || '';
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

        int: [ 'required', 'pattern', 'min', 'max' ],

        internationalMobile: [ 'required', 'pattern' ]

    };

    /**
     * 配置验证规则
     *
     * @static
     * @type {Object}
     */
    Validator.rule = {

        required: function (data) {
            if (data.value) {
                return true;
            }
            else if (data.rules.required) {
                return false;
            }
        },

        pattern: function (data) {
            var pattern = data.rules.pattern;
            if (pattern instanceof RegExp) {
                return pattern.test(data.value);
            }
        },

        minlength: function (data) {
            var minlength = data.rules.minlength;
            if ($.isNumeric(minlength)) {
                return data.value.length >= + minlength;
            }
        },

        maxlength: function (data) {
            var maxlength = data.rules.maxlength;
            if ($.isNumeric(maxlength)) {
                return data.value.length <= + maxlength;
            }
        },

        min: function (data) {
            var min = data.rules.min;
            if ($.isNumeric(min)) {
                return data.value >= + min;
            }
        },

        max: function (data) {
            var max = data.rules.max;
            if ($.isNumeric(max)) {
                return data.value <= + max;
            }
        },

        step: function (data) {
            var min = data.rules.min;
            var step = data.rules.step;
            if ($.isNumeric(min) && $.isNumeric(step)) {
                return (data.value - min) % step === 0;
            }
        },

        /**
         * 是否和另一个字段相同，确认密码常用，如
         * <input type="password" name="password" required />
         * <input type="password" name="password_confirm" equals="password" />
         *
         * @param {Object} data
         * @return {?boolean}
         */
        equals: function (data) {
            var equals = data.rules.equals;
            if (equals) {
                var target = this.inner('main').find('[name="' + equals + '"]');
                return data.value === $.trim(target.val());
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
        idcard: /(^\d{15}$)|(^\d{17}([0-9]|X)$)/i,
        internationalMobile: /^\d{7,20}$/
    };

    var ruleParser = {
        required: function (element) {
            return element.attr('required') === 'required';
        },
        pattern: function (element, type) {
            var pattern = element.attr('pattern') || Validator.pattern[ type ];
            if ($.type(pattern) === 'string') {
                pattern = new RegExp(pattern);
            }
            return pattern;
        },
        minlength: function (element) {
            return element.attr('minlength');
        },
        maxlength: function (element) {
            return element.attr('maxlength');
        },
        min: function (element) {
            return element.attr('min');
        },
        max: function (element) {
            return element.attr('max');
        },
        step: function (element) {
            return element.attr('step');
        },
        equals: function (element) {
            return element.attr('equals');
        }
    };

    /**
     * 编译验证规则
     *
     * @inner
     * @param {jQuery} fieldElement
     * @param {Object} fieldConfig
     * @return {Array?}
     */
    function compileRules(fieldElement, fieldConfig) {

        // 获取 type
        var type = fieldConfig.type;
        if (!type) {
            // 不用 prop(name) 是因为不合法的 type 浏览器会纠正为 text
            type = fieldElement.attr('type') || 'text';
        }

        var ruleOrders = Validator.type[ type ];
        if (!$.isArray(ruleOrders)) {
            return;
        }



        var result = [ ];

        // 获取 rules
        var rules = fieldConfig.rules || { };

        $.each(
            ruleOrders,
            function (index, ruleName) {

                var ruleValue = rules[ ruleName ];
                if (ruleValue == null) {
                    var parse = ruleParser[ ruleName ];
                    if ($.isFunction(parse)) {
                        ruleValue = parse(fieldElement, type);
                    }
                }

                if (ruleValue != null) {
                    result.push({
                        name: ruleName,
                        value: ruleValue
                    });
                }

            }
        );

        return result;

    }

    /**
     * 刷新分组的验证状态
     *
     * @inner
     * @param {Validator} validator
     * @param {jQuery} groupElement
     * @param {Array} validateResult
     */
    function refreshGroup(validator, groupElement, validateResult) {

        var successClass = validator.option('successClass');
        var errorClass = validator.option('errorClass');

        var errorTemplate = validator.option('errorTemplate');
        var errorPlacement = validator.option('errorPlacement');

        var errorSelector = validator.option('errorSelector');
        var errorElement;

        if (errorSelector) {
            errorElement = groupElement.find(errorSelector);
        }


        $.each(
            validateResult,
            function (index, item) {

                var error = item.error;

                // 错误只能是字符串类型
                if ($.type(error) !== 'string') {
                    error = item.error = '';
                }

                if (error) {

                    if (successClass) {
                        groupElement.removeClass(successClass);
                    }
                    if (errorClass) {
                        groupElement.addClass(errorClass);
                    }

                    if (errorElement
                        && errorElement.length > index
                    ) {

                        var html = validator.execute(
                            'renderTemplate',
                            [
                                {
                                    error: error
                                },
                                errorTemplate
                            ]
                        );

                        errorElement.eq(index).html(html);

                        if ($.isFunction(errorPlacement)) {
                            errorPlacement(
                                item.element,
                                errorElement.eq(index)
                            );
                        }

                    }
                }
                else {
                    if (successClass) {
                        groupElement.addClass(successClass);
                    }
                    if (errorClass) {
                        groupElement.removeClass(errorClass);
                    }
                }

            }
        );

    }

    /**
     * 跳转到第一个错误的位置，用于提升用户体验
     *
     * @inner
     * @param {Array} errors
     * @param {number} scrollOffset
     */
    function scrollToFirstError(errors, scrollOffset) {

        if (errors.length > 0) {

            var element = errors[ 0 ].element;

            if (element.is(':hidden')) {
                element = element.parent();
            }

            var top = element.offset().top;

            if ($.type(scrollOffset) === 'number') {
                top += scrollOffset;
            }

            window.scrollTo(
                window.scrollX,
                top
            );

        }

    }

    /**
     * 解析 promise 数组
     *
     * @inner
     * @param {Array.<Promise>} promises
     * @return {Promise}
     */
    function resolvePromises(promises) {

        var deferred = $.Deferred();

        $.when
        .apply($, promises)
        .done(function () {
            deferred.resolve(arguments);
        });

        return deferred;

    }


    return Validator;

});
