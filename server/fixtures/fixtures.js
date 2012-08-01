// Now: Date('2012-03-23T08:03:48.223Z')

module.exports = {

    customers: [
        { _id: '12345678901234567890cbcd', name: 'Aalto-yliopisto' },
        { _id: '12345678901234567890cbce', name: 'McDonald\'s' },
        { _id: '12345678901234567890cbcf', name: 'Hesburger' }
    ],

    targets: [
        {
            name: 'Matematiikka C1',
            _id: '12345678901234567890abcd',
            customerId: '12345678901234567890cbcd',
            questionType: 'fourSmiles',
            showQuestionComment: true,
            location: {
                lat: 12.345,
                lon: 67.890
            }
        },
        {
            name: 'Matematiikka C2',
            _id: '12345678901234567890abce',
            customerId: '12345678901234567890cbcd',
            questionType: 'twoSmiles',
            showQuestionComment: false,
            location: {
                lat: 12.345,
                lon: 67.890
            }
        },
        {
            name: 'Matematiikka C3',
            _id: '12345678901234567890abcf',
            customerId: '12345678901234567890cbcd',
            questionType: 'comment',
            showQuestionComment: false,
            location: {
                lat: 12.345,
                lon: 67.890
            }
        }
    ],

    questions: [
        { _id: '12345678901234567890bbcd', name: 'Opettaako luennoitsija hyvin?', targetId: '12345678901234567890abcd' },
        { _id: '12345678901234567890bbce', name: 'Toimivatko kurssin järjestelyt?', targetId: '12345678901234567890abcd' },
        { _id: '12345678901234567890bbcf', name: 'Onko kurssi haastava?', targetId: '12345678901234567890abcd' },
        { _id: '12345678901234567890bbcg', name: 'Suosittelisitko kurssia kaverille?', targetId: '12345678901234567890abcd' }
    ],

    results : [
        {
            _id: '12345678901234567890dbca',
            questionId: '12345678901234567890bbcd',
            value : 1,
            timestamp : new Date('2012-03-23T08:03:48.223Z'),
            fbUserId: '123456',
            location: {
                lat: 12.345,
                lon: 67.890
            }
        },
        {
            _id: '12345678901234567890dbcb',
            questionId: '12345678901234567890bbcd',
            value : 1,
            timestamp : new Date('2012-03-23T08:04:48.223Z'),
            location: {
                lat: 12.345,
                lon: 67.890
            }
        },
        {
            _id: '12345678901234567890dbcc',
            questionId: '12345678901234567890bbcd',
            value : 1,
            timestamp : new Date('2012-03-23T08:05:48.223Z'),
            location: {
                lat: 12.345,
                lon: 67.890
            }
        }
    ],

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