# 开发中，不要用！

## 简介

**cc** 是一套`基于 jQuery`，`细粒度`，`可配置`，`可二次开发`的组件。

**cc** 是 `combo` `component` 首字母的结合，意为组合式组件。

## 为什么基于 jQuery

基于 jQuery 可以节省很多代码，比如 **Event**、**Deferred**，jQuery 的事件模块做的很好用，比如模拟事件冒泡、自定义事件、命名空间等，如果自己实现一套，代码量会增加很多。

如果你非常介意 jQuery 的体积也没关系，可以了解一下我的思路。

## pc 还是 mobile

问题可以转换为 jQuery 适合 pc 还是 mobile。

## 解决的痛点

前端需求的特点是多细快，组件通常不具有很强的通用性，比如 Bootstrap，业余玩玩尚可，如果想用它做什么复杂应用，尤其是 SPA，那就趁早打住吧。

**cc** 期望面向尽可能多的使用场景，用一套组件进行简单`二次开发`即可。

如果你觉得二次开发比较麻烦也没关系，**cc** 只是我为了提高日常开发效率而量身设计的，自己用的爽就是成功的第一步。

## 设计思路

大多数的组件会把模板拼接放在实现内部，最多可以改 className，这种做法非常令人不爽，尤其是处女座（鄙人就是...）。

我认为优秀的组件只需要抽象交互细节，比如点击按钮后，弹出一个菜单，不需要细节到这个按钮应该是什么结构，菜单又是什么结构。如果你关心到这种细节，这个弹出式组件就不够内聚。

为了适应尽可能多的使用场景，**cc** 在设计之初，定位的用户不是前端小白，而是具有一定前端基础的开发者。

介于我非常不喜欢写文档，因此不论在代码组织，或是 options 字段设计上，都尽可能地简单直白，一目了然（如果你觉得哪里不够简单，或有更好的实现方式，提 issue 我改啊！）。

## 超细粒度

简单说就是`能拆就拆`，基于 AMD，模块几乎细到函数级，真正做到按需加载。

## 支持双向绑定

**cc** 的早期版本不支持双向绑定，在我接手一个管理系统之后，意识到通过适当的改造，让 **cc** 支持双向绑定，便可以覆盖前端绝大部分的使用场景。

比如 **Vue** 在 <input> 元素上使用 `v-model` 指令可以创建双向绑定，因此在 `cc/form/*` ，所有表单组件必须包含如下元素中的一种：

- `<input type="*" />`
- `<textrea></textarea>`

在用户交互中产生的 value 变化，组件会自动同步到表单元素的 value 属性，从而支持 mvvm 框架的指令。

看一个下拉菜单的例子：

``` 
<div class="dropdown">
    <div class="btn btn-default dropdown-toggle">
        <span></span>
        <i class="caret"></i>
    </div>
    <ul class="dropdown-menu"></ul>
    <input type="hidden" name="fieldName" v-model="fieldName" value="{{fieldName}}" />
</div>
```



## 异步更新

抄袭自 Vue，修改组件的 property 和 state 不会立即更新视图，而是等下一个时间片，批量更新。

``` javascript
component.set({
    value: '1'
});
component.set({
    value: '2'
});
// 只会更新一次视图，value 是 2
```

### 立即更新

某些特殊场景，可能不希望异步更新。另一个场景是组件销毁时，如果有异步更新未执行，会立即更新，保证视图的正确。

``` javascript
component.sync();
```





## 通用 options 配置

``` javascript
{
    // 主元素，即组件最外层容器元素，或者说根元素
    mainElement: {jQuery},
    // 主元素模板，如果是后端渲染出来的模板，即组件结构已完整，则不用这个选项
    mainTemplate: {string},
    // 当传入 mainTemplate 选项时，可以配置 replace，默认是 false
    // true 表示 mainTemplate 创建的元素替换 mainElement
    // false 表示 mainTemplate 赋值给 mainElement.innerHTML
    replace: {boolean},
    
    // 对于有局部刷新功能的组件，需要提供刷新区域
    // 比如 Calendar，可以刷新主元素(mainElement.innerHTML = '')
    // 也可以刷新某个子元素，保持其他元素不变(比如左右切换按钮)
    // cc 提供 renderSelector renderTemplate 选项，如果未传入，取 mainElement 和 mainTemplate
    // 但要注意的是，如果刷新主元素，replace 必须设置为 false，否则组件无法处理
    renderSelector: {string},
    renderTemplate: {string},
        
    // 主元素是否是 body 的第一级子元素，比如 Dialog 应该设为 true，定位才不会错
    underBody: {boolean},
    // 销毁时是否移除主元素
    removeOnDispose: {boolean},
      
    // 是否共享主元素
    // 共享主元素是为了减少 DOM 数量，提升性能
    // 比如 Tooltip 应该设为 true，这样可以节省很多 DOM
    // 因为多个实例共享一个主元素，那么就必须提供根据不同的组件实例动态更新主元素的方法
    share: {boolean},
    // 更新主元素
    update: function (options) {
        // options.mainElement 必定存在
        // 其他数据项则取决于组件的特点，比如 Tooltip 会传入 triggerElement
        options.mainElement.html(
            options.triggerElement.attr('data-title')
        );
    },
    
    // 配置模板引擎
    render: function (data, tpl) {
        // 参数顺序 [ data, tpl ] 是考虑到拼接字符串不需要 tpl
        // 也可以使用模板引擎
        // 如果需要模板预编译，可以先缓存编译结果，这里直接调用编译结果的 render(data)
    },
    // 加载数据，不关心是远程或是本地数据
    // 组件内部不做数据缓存，需要数据的时候都会调用 load
    // 如果对性能要求比较高，可以自行在 load 中实现缓存
    load: function (value, callback) {
        // callback 使用 node 风格
        // 第一个参数是 error
        post(function (data) {
            callback(null, data);
        });
    },

    // 交互方式配置通常由三项组成
    // 比如点击一个按钮弹出一个浮层，对应配置如下：
    // {
    //     showTrigger: 'click',
    //     showDelay: 100,  // delay 只有当 trigger 为 enter、leave 时可用
    //     showAnimation: function (options) {
    //
    //     }
    // }
    xxTrigger: 'click,enter,leave,focus,blur,context',
    xxDelay: {number},
    xxAnimation: function (options) {

    }
}
```