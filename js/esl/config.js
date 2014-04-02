require.config({
    baseUrl: '/',
    paths: {
        text: './js/esl/text'
    },
    packages: [
        {
            name: 'cobble',
            location: './src',
            main: 'main'
        }
    ]
});
