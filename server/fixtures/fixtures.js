// Now: Date('2012-03-23T08:03:48.223Z')

module.exports = {
    targets: [{
        name: 'T-Talon ruokajono',
        _id: '12345678901234567890abce',
        question: 'Oliko paljon jonoa?',
        results : [
        { value : 1, timestamp : new Date('2012-03-23T08:03:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T08:04:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T08:05:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T08:10:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T08:50:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T08:51:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T10:03:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T10:13:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T10:14:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T12:01:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T12:03:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T12:05:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T13:33:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T13:43:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T13:50:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T13:51:48.223Z') } ]
    }, {
        name: 'Mikä fiilis?',
        _id: '12345678901234567890abcd',
        question: 'Millainen fiilis sinulla on tällä hetkellä?',
        results : [
        { value : 1, timestamp : new Date('2012-03-23T08:03:48.223Z'), fbUserId: '123456'},
        { value : 1, timestamp : new Date('2012-03-23T08:02:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T08:02:28.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T08:01:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T08:01:18.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T08:00:08.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T07:59:48.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T07:59:11.223Z') },
        { value : 1, timestamp : new Date('2012-03-23T07:53:48.223Z') },
        { value : 0, timestamp : new Date('2012-03-23T07:43:48.223Z') }]
    }, {
        name: 'Putouksen munamiehen läpän taso',
        _id: '12345678901234567890abcf',
        question: 'No millasta läpyskää puskee?',
        results: [1, 2, 3, 4]
    }],

    users: [
        {_id: '111111111111111111111100', fbUserId: '111111', fbInformation: {name: 'Pyry Kröger'}},
        {_id: '111111111111111111111101', fbUserId: '123456', fbInformation: {name: 'Mikko Koski'}},
        {_id: '111111111111111111111119', fbUserId: '000009', fbInformation: {name: 'James Dean'}, points: 41},
        {_id: '111111111111111111111111', fbUserId: '000001', fbInformation: {name: 'John Doe'}, points: 102},
        {_id: '111111111111111111111112', fbUserId: '000002', fbInformation: {name: 'Joe Doe'}, points: 100},
        {_id: '111111111111111111111113', fbUserId: '000003', fbInformation: {name: 'Matt Doe'}, points: 99},
        {_id: '111111111111111111111117', fbUserId: '000007', fbInformation: {name: 'Matt Duncan'}, points: 71},
        {_id: '111111111111111111111114', fbUserId: '000004', fbInformation: {name: 'John McDonald'}, points: 89},
        {_id: '111111111111111111111115', fbUserId: '000005', fbInformation: {name: 'John Warren'}, points: 78},
        {_id: '111111111111111111111116', fbUserId: '000006', fbInformation: {name: 'Jamie Oliver'}, points: 76},
        {_id: '111111111111111111111118', fbUserId: '000008', fbInformation: {name: 'Dean Martin'}, points: 66},
        {_id: '111111111111111111111120', fbUserId: '000010', fbInformation: {name: 'James Bond'}, points: 3},
        {_id: '111111111111111111111121', fbUserId: '000011', fbInformation: {name: 'Jack Black'}, points: 2},
        {_id: '111111111111111111111122', fbUserId: '000012', fbInformation: {name: 'Jane Doe'}, points: 1}
    ]
};