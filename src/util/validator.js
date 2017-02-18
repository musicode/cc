/**
 * @file 验证器（DOM 无关）
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var allPromises = require('../function/allPromises');
    var keys = require('../function/keys');

    function isValidValue(value) {
        return value === 0 || value;
    }

    /**
     * 内置常用规则
     *
     * @inner
     * @type {Object}
     */
    var buildInRules = {

        required: function (data, rules) {
            if (isValidValue(data.value)) {
                return true;
            }
            var required = rules.required;
            if (required === true) {
                return false;
            }
        },

        pattern: function (data, rules) {
            var pattern = rules.pattern;
            if ($.type(pattern) === 'string') {
                pattern = exports.buildInPatterns[ pattern ];
            }
            if (pattern instanceof RegExp) {
                return pattern.test(data.value);
            }
        },

        minlength: function (data, rules) {
            var minlength = rules.minlength;
            if ($.isNumeric(minlength)) {
                return data.value.length >= + minlength;
            }
        },

        maxlength: function (data, rules) {
            var maxlength = rules.maxlength;
            if ($.isNumeric(maxlength)) {
                return data.value.length <= + maxlength;
            }
        },

        min: function (data, rules) {
            var min = rules.min;
            if ($.isNumeric(min)) {
                return data.value >= + min;
            }
        },

        max: function (data, rules) {
            var max = rules.max;
            if ($.isNumeric(max)) {
                return data.value <= + max;
            }
        },

        step: function (data, rules) {
            var min = rules.min;
            var step = rules.step;
            if ($.isNumeric(min) && $.isNumeric(step)) {
                return (data.value - min) % step === 0;
            }
        },

        equals: function (data, rules, all) {
            var equals = rules.equals;
            if ($.type(equals) === 'string') {
                return data.value === all[ equals ].value;
            }
        }

    };

    /**
     * 内置常用正则
     *
     * @type {Object}
     */
    exports.buildInPatterns = {

    };

    function list2Map(list) {
        var map = { };
        $.each(list, function (index, item) {
            if (item.name) {
                map[item.name] = item;
            }
        });
        return map;
    }

    /**
     *
     * @param {Object} data 待验证的数据，格式如下：
     *                      {
     *                          key1: {
     *                              value: '', // value 需要经过 trim
     *                              extra      // 扩展数据，比如 DOM 元素
     *                          }
     *                      }
     *
     * @param {Object} rules 验证规则，格式如下：
     *                       {
     *                           key1: {
     *                               before: function () {
     *                                  // 返回 false 可拦截 key1 的后续验证，这取决于字段的验证顺序
     *                               },
     *                               after: function () {
     *                                  // 验证完做一些处理
     *                               },
     *                               // 如果对顺序有要求，可配置 sequence
     *                               // 否则取决于遍历 rules 对象的顺序
     *                               sequence: [ 'required', 'pattern', 'customRule' ],
     *                               rules: {
     *                                   required: true,
     *                                   pattern: 'buildIn' or /xx/,
     *                                   customRule: function () {
     *                                      // 返回值：
     *                                      // true -> 同步验证通过
     *                                      // false -> 同步验证失败
     *                                      // promise -> 异步校验，异步值和同步返回值作用相同
     *                                      // 其他 -> 跳过
     *                                   }
     *                               },
     *                               errors: {
     *                                   required: 'required error',
     *                                   pattern: 'pattern error',
     *                                   customRule: 'customRule error'
     *                               }
     *                           }
     *                       }
     *
     * @param {Array.<string>=} sequence 验证字段的顺序，可选
     */
    exports.validate = function (data, rules, sequence) {

        var list = [ ];
        var promises = [ ];

        if (!$.isArray(sequence)) {
            sequence = keys(data);
        }

        $.each(
            sequence,
            function (index, key) {

                var fieldData = data[ key ];
                var fieldConfig = rules[ key ];

                if (!fieldConfig) {
                    return;
                }

                var result = $.extend({ name: key }, fieldData);

                if ($.isFunction(fieldConfig.before)
                    && fieldConfig.before(data, list2Map(list)) === false
                ) {
                    list.push(result);
                    return;
                }

                // 如果 rule 定义的是函数，需要惰性求值，然后用值覆盖函数
                var fieldRules = $.extend({ }, fieldConfig.rules);
                var validateRule = function (name) {
                    var value = fieldRules[ name ];
                    if (!$.isFunction(value)
                        && value === fieldConfig.rules[ name ]
                        && $.type(name) === 'string'
                        && name in buildInRules
                    ) {
                        value = buildInRules[ name ];
                    }
                    if ($.isFunction(value)) {
                        value = fieldRules[ name ] = value(fieldData, fieldConfig.rules, data);
                    }
                    return value;
                };

                var fieldFailedRule;

                var promiseNames = [ ];
                var promiseValues = [ ];

                var required = validateRule('required');
                if (required === true) {

                    var sequence = $.isArray(fieldConfig.sequence)
                        ? fieldConfig.sequence
                        : keys(fieldRules);

                    $.each(
                        sequence,
                        function (index, name) {
                            var value = validateRule(name);
                            if (value === false) {
                                fieldFailedRule = name;
                            }
                            else if (value && $.isFunction(value.then)) {
                                promiseNames.push(name);
                                promiseValues.push(value);
                            }
                            else if ($.type(value) !== 'boolean') {
                                value = false;
                            }
                            return value;
                        }
                    );

                }
                else if (required === false) {
                    fieldFailedRule = 'required';
                }

                var extend = function () {

                    if (fieldFailedRule) {
                        result.rule = fieldFailedRule;
                        var error = fieldConfig.errors[ fieldFailedRule ];
                        if ($.isFunction(error)) {
                            error = error(fieldData, fieldRules, data);
                        }
                        result.error = error;
                    }

                    if ($.isFunction(fieldConfig.after)) {
                        fieldConfig.after(result, list2Map(list));
                    }

                };

                var index;

                if (promiseValues.length) {

                    var promise =

                    allPromises(promiseValues)
                        .then(function (values) {

                            $.each(
                                values,
                                function (index, value) {
                                    if (value === false) {
                                        fieldFailedRule = promiseNames[ index ];
                                        return false;
                                    }
                                }
                            );

                            extend();
                            list[ index - 1 ] = result;

                        });

                    index = list.push(promise);

                    promises.push(promise);

                }
                else {
                    extend();
                    list.push(result);
                }

            }
        );

        if (promises.length) {
            return allPromises(promises)
                .then(function () {
                    return list;
                });
        }

        return list;


    };

});