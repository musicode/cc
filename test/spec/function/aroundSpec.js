define(function (require, exports, module) {

    var around = require('cobble/function/around');

    describe('function/around', function () {

        it('beforeFunction', function () {

            var i = 0;

            around(
                function () {
                    i++;
                },
                function () {
                    i = 1;
                }
            )();

            expect(i).toBe(2);
        });

        it('afterFunction', function () {

            var i = 0;

            around(
                function () {
                    i++;
                },
                null,
                function () {
                    i = -1;
                }
            )();

            expect(i).toBe(-1);
        });

        it('beforeMethod', function () {

            var i = 0;

            var foo = {
                add: function () {
                    i++;
                }
            }

            around(
                foo,
                'add',
                function () {
                    i = -1;
                }
            );

            foo.add();

            expect(i).toBe(0);
        });

        it('afterMethod', function () {

            var i = 0;

            var foo = {
                add: function () {
                    i++;
                }
            }

            around(
                foo,
                'add',
                null,
                function () {
                    i = -1;
                }
            );

            foo.add();

            expect(i).toBe(-1);
        });

        it('return false', function () {

            var i = 0;

            around(
                function () {
                    i++;
                },
                function () {
                    i = -1;
                    return false;
                }
            )();

            expect(i).toBe(-1);
        });

        it('override result', function () {

            var i = around(
                function () {
                    return 1;
                },
                null,
                function () {
                    return 2;
                }
            )();

            expect(i).toBe(2);
        });

        it('scope', function () {

            var i = 0;

            var foo = {
                add: function () {
                    i++;
                }
            };

            var beforeScope;
            var afterScope;

            around(
                foo,
                'add',
                function () {
                    beforeScope = this;
                },
                function () {
                    afterScope = this;
                }
            );

            foo.add();

            expect(beforeScope).toBe(foo);
            expect(afterScope).toBe(foo);
        });
    });
});