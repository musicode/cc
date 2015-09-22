# 开发中，不要用！

## 简介

> cobble 是一套`基于 jQuery`，`细粒度`，`可配置`，`可二次开发`的组件。

## 为什么基于 jQuery

基于 jQuery 可以节省很多代码，类似于自定义事件，使用 jQuery Event 即可，没必要浪费时间开发这种东西。

如果你非常介意 jQuery 的体积，到此打住吧。

## PC 还是 Mobile

问题可以转换为你如何看待 jQuery。

## 解决的痛点

前端需求变化多端的特点，使得组件通常不具有很强的通用性，比如 Bootstrap，业余玩玩尚可，如果想用它做什么复杂应用，尤其是 SPA，那就趁早打住吧。

cobble 期望面向尽可能多的使用场景，用一套组件进行简单二次封装即可。

## 设计思想

为了适应尽可能多的场景，cobble 在设计之初，用户就不是前端小白，而是具有一定前端基础的开发者。

在文档不一定能及时跟上的考虑下，options 的设计尽可能简单直白，为了更好的可读性

options 中的所有函数不保证 this 一定指向实例对象，因此不要依赖 this

## 通用配置

``` javascript
{
    renderTemplate: function (data, tpl) {
        // 参数顺序 [ data, tpl ] 是考虑到拼接字符串不需要 tpl
        // 也可以使用模板引擎
        // 如果需要模板预编译，可以先缓存编译结果，这里直接调用编译结果的 render(data)
    },
    loadData: function (value, callback) {

        // 加载数据，懒加载常用
        // callback 使用 node 风格
        post(function (data) {
            callback(null, data);
        });

    }
}
```

## 通用方法

### render()

渲染整个组件