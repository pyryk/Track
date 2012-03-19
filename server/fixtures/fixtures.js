module.exports = {
    targets: [{
        name: 'T-Talon ruokajono',
        _id: '12345678901234567890abce',
        metric: {
            unit: 'min',
            question: 'Kauanko jonotit?'
        },
        results: [10, 5, 6, 7, 20]
    }, {
        name: 'Mikä fiilis?',
        _id: '12345678901234567890abcd',
        metric: {
            unit: '1-5',
            question: 'Millainen fiilis sinulla on tällä hetkellä?'
        }
    }, {
        name: 'Putouksen munamiehen läpän taso',
        _id: '12345678901234567890abcf',
        metric: {
            unit: '4-10',
            question: 'No millasta läpyskää puskee?'
        }
    }]
};