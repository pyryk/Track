// Now: Date('2012-03-23T08:03:48.223Z')

module.exports = {

    customers: [
        { _id: '12345678901234567890cbcd', name: 'Aalto-yliopisto' },
        { _id: '12345678901234567890cbce', name: 'McDonald\'s' },
        { _id: '12345678901234567890cbcf', name: 'Hesburger' }
    ],

    targets: [
        { name: 'Matematiikka C1', _id: '12345678901234567890abce', customerId: '12345678901234567890cbcd' },
        { name: 'Matematiikka C2', _id: '12345678901234567890abcd', customerId: '12345678901234567890cbcd' },
        { name: 'Matematiikka C3', _id: '12345678901234567890abce', customerId: '12345678901234567890cbcd' }
    ],

    questions: [
        { _id: '12345678901234567890bbcd', name: 'Opettaako luennoitsija hyvin?', targetId: '12345678901234567890abcd' },
        { _id: '12345678901234567890bbce', name: 'Toimivatko kurssin järjestelyt?', targetId: '12345678901234567890abcd' },
        { _id: '12345678901234567890bbcf', name: 'Onko kurssi haastava?', targetId: '12345678901234567890abcd' },
        { _id: '12345678901234567890bbcg', name: 'Suosittelisitko kurssia kaverille?', targetId: '12345678901234567890abcd' }
    ],

    results : [
        { _id: '12345678901234567890dbcd', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T08:03:48.223Z'), fbUserId: '123456' },
        { _id: '12345678901234567890dbce', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T08:04:48.223Z') },
        { _id: '12345678901234567890dbcf', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T08:05:48.223Z') },
        { _id: '12345678901234567890dbcg', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T08:10:48.223Z') },
        { _id: '12345678901234567890dbch', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T08:50:48.223Z') },
        { _id: '12345678901234567890dbci', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T08:51:48.223Z') },
        { _id: '12345678901234567890dbcj', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T10:03:48.223Z') },
        { _id: '12345678901234567890dbck', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T10:13:48.223Z') },
        { _id: '12345678901234567890dbcl', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T10:14:48.223Z') },
        { _id: '12345678901234567890dbcm', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T12:01:48.223Z') },
        { _id: '12345678901234567890dbcn', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T12:03:48.223Z') },
        { _id: '12345678901234567890dbco', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T12:05:48.223Z') },
        { _id: '12345678901234567890dbcp', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T13:33:48.223Z') },
        { _id: '12345678901234567890dbcq', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T13:43:48.223Z') },
        { _id: '12345678901234567890dbcr', questionId: '12345678901234567890bbcd', value : 1, timestamp : new Date('2012-03-23T13:50:48.223Z') },
        { _id: '12345678901234567890dbcs', questionId: '12345678901234567890bbcd', value : 0, timestamp : new Date('2012-03-23T13:51:48.223Z') } ]
}, {

    users: [
        {_id: '111111111111111111111100', fbUserId: '111111', fbInformation: {name: 'Pyry Kröger'}}, // No points
        {_id: '111111111111111111111101', fbUserId: '123456', fbInformation: {name: 'Mikko Koski'}}, // No points
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