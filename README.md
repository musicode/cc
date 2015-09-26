# 开发中，不要用！

## 简介

**cc** 是一套`基于 jQuery`，`细粒度`，`可配置`，`可二次开发`的组件。

**cc** 是 `combo` `component` 首字母的结合，意为组合式的组件。

## 为什么基于 jQuery

基于 jQuery 可以节省很多代码，比如 Event、Deferred，直接拿来使用即可，而且非常好用。

如果你非常介意 jQuery 的体积也没关系，可以了解一下我的思路。

## pc 还是 mobile

问题可以转换为 jQuery 适合 pc 还是 mobile。

## 解决的痛点

前端需求的特点是多细快，组件通常不具有很强的通用性，比如 Bootstrap，业余玩玩尚可，如果想用它做什么复杂应用，尤其是 SPA，那就趁早打住吧。

**cc** 期望面向尽可能多的使用场景，用一套组件进行简单`二次开发`即可。

如果你觉得二次开发比较麻烦也没关系，**cc** 只是我为了提高日常开发效率而量身设计的，自己用的爽就是成功的第一步。

## 设计思想

大多数的组件会把模板拼接放在实现内部，最多让你改改 className，这种做法非常令人不爽，尤其是处女座（鄙人就是...）。

我认为优秀的组件只需要抽象交互细节，比如点击按钮后，弹出一个菜单，不需要细节到这个按钮应该是什么结构，菜单又是什么结构。如果你关心到这种细节，这个弹出式组件就不够内聚。

为了适应尽可能多的使用场景，**cc** 在设计之初，定位的用户不是前端小白，而是具有一定前端基础的开发者。

介于我非常不喜欢写文档，因此不论在代码组织，或是 options 字段设计上，都尽可能地简单直白，一目了然。

## 通用 options 配置

``` javascript
{
    // 主元素，即组件最外层容器元素
    mainElement: {jQuery},
    // 主元素模板
    mainTemplate: {string},
    // true 表示 mainTemplate 创建的元素替换 mainElement
    // false 表示 mainTemplate 赋值给 mainElement.innerHTML
    replace: {boolean},
    // 是否共享主元素，比如 Tooltip 应该设为 true，这样可以节省很多 DOM
    share: {boolean},
    // 主元素是否是 body 的第一级子元素，比如 Dialog 应该设为 true，定位才不会错
    underBody: {boolean},
    // 配置模板引擎
    renderTemplate: function (data, tpl) {
        // 参数顺序 [ data, tpl ] 是考虑到拼接字符串不需要 tpl
        // 也可以使用模板引擎
        // 如果需要模板预编译，可以先缓存编译结果，这里直接调用编译结果的 render(data)
    },
    // 加载数据，不关心是远程或是本地数据
    loadData: function (value, callback) {
        // callback 使用 node 风格
        // 第一个参数是 error
        post(function (data) {
            callback(null, data);
        });
    }
}
```

