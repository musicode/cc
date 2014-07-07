define(function (require, exports, module) {

    var Popup = require('cobble/helper/Popup');

    describe('helper/Popup', function () {

        var doc = $(document);
        var instance;
        var source;
        var element;

        beforeEach(function () {

            document.body.innerHTML = ''
            + '<input type="text" />'
            + '<div><span>xxxx</span></div>';

            source = $('input');
            element = $('div');
        });

        afterEach(function () {
            instance.dispose();
        });

        it('showByClick, hideByClick', function () {

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'click',
                    hide: 'click'
                }
            });

            expect(instance.hidden).toBe(false);

            doc.click();
            expect(instance.hidden).toBe(true);

            source.click();
            expect(instance.hidden).toBe(false);

        });

        it('showByOver, hideByOut', function () {

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'over',
                    hide: 'out'
                }
            });

            expect(instance.hidden).toBe(false);

            source.mouseleave();
            expect(instance.hidden).toBe(true);

            source.mouseenter();
            expect(instance.hidden).toBe(false);
        });

        it('showByFocus, hideByBlur', function () {

            element.hide();

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'focus',
                    hide: 'blur'
                }
            });

            source.focus();
            expect(instance.hidden).toBe(false);

            source.blur();
            expect(instance.hidden).toBe(true);

        });

        it('multi trigger', function () {

            element.hide();

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'click,over',
                    hide: 'click,out'
                }
            });

            source.mouseenter();
            expect(instance.hidden).toBe(false);

            doc.click();
            expect(instance.hidden).toBe(true);

            source.click();
            expect(instance.hidden).toBe(false);

            element.mouseleave();
            expect(instance.hidden).toBe(true);

        });

        it('delay - over/out', function (done) {

            var showDelay = 50;
            var hideDelay = 100;

            element.hide();

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'over',
                    hide: 'out'
                },
                delay: {
                    show: showDelay,
                    hide: hideDelay
                }
            });

            source.mouseenter();
            expect(instance.hidden).toBe(true);

            source.mouseleave();
            setTimeout(
                function () {

                    expect(instance.hidden).toBe(true);
                    source.mouseenter();

                    setTimeout(
                        function () {


                            expect(instance.hidden).toBe(false);

                            source.mouseleave();
                            expect(instance.hidden).toBe(false);

                            source.mouseenter();
                            setTimeout(
                                function () {
                                    expect(instance.hidden).toBe(false);

                                    source.mouseleave();

                                    setTimeout(
                                        function () {
                                            expect(instance.hidden).toBe(true);
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

            element.hide();

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'click',
                    hide: 'click'
                },
                delay: {
                    show: showDelay,
                    hide: hideDelay
                }
            });

            source.click();
            expect(instance.hidden).toBe(true);

            setTimeout(
                function () {
                    expect(instance.hidden).toBe(false);

                    doc.click();
                    expect(instance.hidden).toBe(false);

                    setTimeout(
                        function () {
                            expect(instance.hidden).toBe(true);
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

            element.hide();

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'over',
                    hide: 'out'
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

            source.mouseenter();
            source.mouseleave();

            expect(i).toBe(2);
        });

        it('prevent', function () {

            element.hide();

            instance = new Popup({
                element: element,
                source: source,
                trigger: {
                    show: 'over',
                    hide: 'out'
                },
                onBeforeShow: function () {
                    return false;
                }
            });

            source.mouseenter();
            expect(instance.hidden).toBe(true);

            instance.onBeforeShow = null;

            source.mouseleave();
            expect(instance.hidden).toBe(true);

            source.mouseenter();
            expect(instance.hidden).toBe(false);

            instance.onBeforeHide = function () {
                return false;
            };

            source.mouseleave();
            expect(instance.hidden).toBe(false);

            instance.onBeforeHide = null;

            source.mouseenter();
            source.mouseleave();
            expect(instance.hidden).toBe(true);
        });

        it('scope', function () {

            element.hide();

            var scope = { };

            instance = new Popup({
                element: element,
                source: source,
                scope: scope,
                trigger: {
                    show: 'over',
                    hide: 'out'
                },
                animation: {
                    show: function () {
                        expect(this).toBe(scope);
                    },
                    hide: function () {
                        expect(this).toBe(scope);
                    }
                },
                onBeforeShow: function () {
                    expect(this).toBe(scope);
                },
                onAfterShow: function () {
                    expect(this).toBe(scope);
                },
                onBeforeHide: function () {
                    expect(this).toBe(scope);
                },
                onAfterHide: function () {
                    expect(this).toBe(scope);
                }
            });

            source.mouseenter();
            source.mouseleave();

        });

    });

});