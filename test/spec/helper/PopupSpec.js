define(function (require, exports, module) {

    var Popup = require('cobble/helper/Popup');

    describe('helper/Popup', function () {

        var doc = $(document);
        var instance;
        var element;
        var layer;

        beforeEach(function () {

            document.body.innerHTML = ''
            + '<input type="text" />'
            + '<div><span>xxxx</span></div>';

            element = $('input');
            layer = $('div');
        });

        it('showByClick, hideByClick', function () {

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'click'
                },
                hide: {
                    trigger: 'click'
                }
            });

            expect(instance.hidden).toBe(false);

            doc.click();
            expect(instance.hidden).toBe(true);

            element.click();
            expect(instance.hidden).toBe(false);

            instance.dispose();

        });

        it('showByOver, hideByOut', function () {

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'over'
                },
                hide: {
                    trigger: 'out'
                }
            });

            expect(instance.hidden).toBe(false);

            element.mouseleave();
            expect(instance.hidden).toBe(true);

            element.mouseenter();
            expect(instance.hidden).toBe(false);

            instance.dispose();
        });

        it('showByFocus, hideByBlur', function () {

            layer.hide();

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'focus'
                },
                hide: {
                    trigger: 'blur'
                }
            });

            element.focus();
            expect(instance.hidden).toBe(false);

            element.blur();
            expect(instance.hidden).toBe(true);

            instance.dispose();

        });

        it('multi trigger', function () {

            layer.hide();

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'click,over'
                },
                hide: {
                    trigger: 'click,out'
                }
            });

            element.mouseenter();
            expect(instance.hidden).toBe(false);

            doc.click();
            expect(instance.hidden).toBe(true);

            element.click();
            expect(instance.hidden).toBe(false);

            layer.mouseleave();
            expect(instance.hidden).toBe(true);

            instance.dispose();
        });

        it('delay - over/out', function (done) {

            var showDelay = 50;
            var hideDelay = 100;

            layer.hide();

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'over',
                    delay: showDelay
                },
                hide: {
                    trigger: 'out',
                    delay: hideDelay
                }
            });

            element.mouseenter();
            expect(instance.hidden).toBe(true);

            element.mouseleave();
            setTimeout(
                function () {

                    expect(instance.hidden).toBe(true);
                    element.mouseenter();

                    setTimeout(
                        function () {


                            expect(instance.hidden).toBe(false);

                            element.mouseleave();
                            expect(instance.hidden).toBe(false);

                            element.mouseenter();
                            setTimeout(
                                function () {
                                    expect(instance.hidden).toBe(false);

                                    element.mouseleave();

                                    setTimeout(
                                        function () {
                                            expect(instance.hidden).toBe(true);
                                            instance.dispose();
                                            done();
                                        },
                                        hideDelay + 10
                                    )

                                },
                                hideDelay + 10
                            )



                        },
                        showDelay + 10
                    );

                },
                showDelay + 10
            );

        });

        it('delay - click/click', function (done) {

            var showDelay = 50;
            var hideDelay = 100;

            layer.hide();

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'click',
                    delay: showDelay
                },
                hide: {
                    trigger: 'click',
                    delay: hideDelay
                }
            });

            element.click();
            expect(instance.hidden).toBe(true);

            setTimeout(
                function () {
                    expect(instance.hidden).toBe(false);

                    doc.click();
                    expect(instance.hidden).toBe(false);

                    setTimeout(
                        function () {
                            expect(instance.hidden).toBe(true);
                            instance.dispose();
                            done();
                        },
                        hideDelay + 10
                    )
                },
                showDelay + 10
            );

        });

        it('before/after', function () {

            var i = 0;

            layer.hide();

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'over'
                },
                hide: {
                    trigger: 'out'
                },
                onBeforeShow: function () {
                    expect(i).toBe(0);
                    expect(this).toBe(instance);
                    i = 1;
                },
                onAfterShow: function () {
                    expect(i).toBe(1);
                    expect(this).toBe(instance);
                    i = 4;
                },
                onBeforeHide: function () {
                    expect(i).toBe(4);
                    expect(this).toBe(instance);
                    i = 3;
                },
                onAfterHide: function () {
                    expect(i).toBe(3);
                    expect(this).toBe(instance);
                    i = 2;
                }
            });

            element.mouseenter();
            element.mouseleave();

            expect(i).toBe(2);

            instance.dispose();
        });

        it('prevent', function () {

            layer.hide();

            instance = new Popup({
                layer: layer,
                element: element,
                show: {
                    trigger: 'over'
                },
                hide: {
                    trigger: 'out'
                },
                onBeforeShow: function () {
                    return false;
                }
            });

            element.mouseenter();
            expect(instance.hidden).toBe(true);

            instance.onBeforeShow = null;

            element.mouseleave();
            expect(instance.hidden).toBe(true);

            element.mouseenter();
            expect(instance.hidden).toBe(false);

            instance.onBeforeHide = function () {
                return false;
            };

            element.mouseleave();
            expect(instance.hidden).toBe(false);

            instance.onBeforeHide = null;

            element.mouseenter();
            element.mouseleave();
            expect(instance.hidden).toBe(true);

            instance.dispose();
        });

    });

});