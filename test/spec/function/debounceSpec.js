define(function (require, exports, module) {

    var debounce = require('cobble/function/debounce');

    describe('function/debounce', function (done) {

        it('debounce', function (done) {

            var win = $(window);
            var counter = 0;
            var wait = 50;
            var start;
            var end;

            win.resize(
                debounce(
                    function () {
                        counter++;
                        end = +(new Date());

                        // 允许误差小于 5
                        console.log(end - start - wait)
                        expect(Math.abs(end - start - wait) < 5).toBe(true);
                        expect(counter).toBe(1);
                        done();
                    },
                    wait
                )
            );

            start = +(new Date());
            for (var i = 0; i < 100; i++) {
                win.trigger('resize');
            }

        });

    });
});