# Track RESTful API

All the requests with body (POST requests) should have a application/json Content-Type header set.

## Authentication

###Background

Most of the methods in the Track API are accessible without logging in. However, logging in provides better results for the user, for example more relevant targets on the top of the target list.

User logs in with her Facebook account. The mobile client is responsible for Facebook login. Client then sends the FB user id and FB AccessToken to the backend. User is identified by the fbUserId. The backend does a query to the Facebook API to make sure the AccessToken is valid.

### Loging

The following parameters have to be sent in the HEADER of each request requiring authentication:

**FB-UserId** Facebook user ID

**FB-AccessToken** Access token received from Facebook after user login

Status (if authenticaion fails): 403 Forbidden

## API endpoints

### GET /targets - Lists all targets

Requires authentication: No

GET params: lat, lon, i.e. GET /targets?lat=60.16981200000001&lon=24.93824

Status: 200 Ok

Response body:

	{
		targets: [
			{_id: “12faggf”, name: “T-Talon ruokajono”, relevancy: 9.1251},
			{_id: “12fa41gf”, name: “Baarin meininki”, relevancy: 5.23521},
			{_id: “12fa113f”, name: “Mikä fiilis?”, relevancy: 1.2427254}
		]
	}

**New design of response body**
*Target details are passed to in order to tackle front end issues. Should be changed.*

{
    "targets":[
        {
            "name":"McDonalds Herttoniemi",
            "_id":"5003bd7e5e76f78e31000002",
            "questions":[
                {"name":"Viihdyitkö?", "_id":"5003bd7e5e76f78e31000003"},
                {"name":"Maistuiko?", "_id":"5003bd7e5e76f78e31000004"},
                {"name":"Oliko kivaa?","_id":"5003bd7e5e76f78e31000005"}
            ],
            "relevance":0,
            "questionType":"twoSmiles",
            "showQuestionComment":true
        },
        {
            "name":"McDonalds Kaisaniemi",
            "_id":"5003c012ca06eaa231000006",
            "questions":[
                {"name":"Viihdyitkö?","_id":"5003c012ca06eaa231000007"},
                {"name":"Maistuiko?","_id":"5003c012ca06eaa231000008"},
                {"name":"Oliko kivaa?","_id":"5003c012ca06eaa231000009"}],
            "relevance":0,
            "questionType":"fourSmiles",
            "showQuestionComment":true
        }
    ]
}


### GET /target/:_id - Returns specific target with detailed info

Requires authentication: No

Status: 200 Ok

Response body:

	{
		target: {
			_id: “12faggf”,
			name: “T-Talon ruokajono”,
			question: “T-Talon ruokajonon jonotusaika”

			results: {
				now: {
					pos: 10, neg: 3, trend: 3, period: 15
				},
				alltime: {
					pos: 300, neg: 100
				}
			}
		}
	}

**New design of response body:** (results are in a separate response)

	{
		target: {
			_id: “12faggf”,
			name: “T-Talon ruokajono”,
			questions: [
			    {_id: "4afdfadfdafeaf", name: "Viihdyitkö?", type: "fourSmiles"},
			    {_id: "4afdfadfdafeag", name: "Maistuiko?", type: "twoSmiles"}
			    {_id: "4afdfadfdafeah", name: "Muuta sanottavaa?", type: "comment"}
            ],
            questionType: fourSmiles,
            showQuestionComment: true
		}
	}



* **trend**: integer [-3, 3], where -3 means getting worse with high speed, 0 not changing, 3 getting better with high speed
* **period**: results from last XX minutes

### POST /target - Create a new target

Requires authentication: No

Request body:

	{
		"name": “Track target name”,
		"question": "Kauanko/paljonko/jne plaa plaa plaa otsikkoa tarkentava kysymys",
		"location": {
		  "lat": 12.345,
		  "lon": 67.890
		}
	}

**New design of request body:**

    {
        "name": "Track target name",
        "questions": [
            {"name": "Viihtyitkö?", type: "fourSmiles"},
            {"name": "Maistuiko?", type: "twoSmiles"},
            {"name": "Oliko kivaa?", type: "comment"}
        ],
        "questionType": "fourSmiles",
        "showQuestionComment": true,
        "location": {
            "lat": 12.345,
            "lon": 67.890
        }
    }

Status: 201 Created

Response body:

	{"_id": "12345678901234567890abcd"}

### DELETE /target/:_id - Delete the specified target

Requires authentication: No

Status: 204 No Content or 404 Not Found

### POST /target/:_id/result - Send tracking result

Requires authentication: No

Request body:

    {
        value: 0 / 1,
        location: {
    		  lat: 12.345,
    		  lon: 67.890
    		}
    }

**New design:**

POST /result/:_id - send tracking result with the specified questionId.

Requires authentication: No.

In case of two smiles values include 1 and -1.
In case of four smiles values include -2, -1, 1 and 2.

    {
        value: -2 / -1 / 1 / 2,
        textComment: "Food was fresh but too salty.",
        location: {
    		  lat: 12.345,
    		  lon: 67.890
        },

    }


Status: 201 No content

Response body:

Id of the added result

	{"_id": "12345678901234567890abcd"}

### GET /leaderboard - Returns leader board

Requires authentication: No

Status: 200 Ok

Response body:

	{
		users: [
			{fbUserId: "566268546", name: "Mikko Koski", picture: "https://graph.facebook.com/566268546/picture", points: 56},
			{fbUserId: "566268547", name: "Pyry Kröger", picture: "https://graph.facebook.com/<fb_id>/picture", points: 44},
			{fbUserId: "566268548", name: "Antti Heikkonen", picture: "https://graph.facebook.com/<fb_id>/picture", points: 39},
			{fbUserId: "566268549", name: "Lauri Orkoneva", picture: "https://graph.facebook.com/<fb_id>/picture", points: 21},
			{fbUserId: "5662685410", name: "Heikki Korhonen", picture: "https://graph.facebook.com/<fb_id>/picture", points: 9},
		]
	}

## To be implemented (customer-target-question-result)

### GET /customers - returns customers

Requires authentication: No

Status: 200 OK

Response body:

    {
        "customers": [
            {"_id": “12faggf”, "name": “Rosso”},
            {"_id": “13faggf”, "name": “McDonald's”}
        ]
    }

### GET /targets/:_customerId - returns targets of the specified customer

E.g. tracktive.net/targets/44215tadfaf434343 brings the targets of McDonald's

GET params: lat, lon, i.e. GET /targets?lat=60.16981200000001&lon=24.93824

Requires authentication: No

Status: 200 OK

Response body:

    {
        "targets": [
            {"_id": “12faggf”, "name": “Kaisaniemi”, "relevancy": 9.1251},
            {"_id": “13faggf”, "name": “Kamppi”, "relevancy": 9.1251}
        ]
    }

### GET /target/:_id/results - results of the specified target

Requires authentication: No

Status: 200 OK

Response body:

    {
        "results": [
            { "4agdfdagdag (questionId)": {
                "now": {
                    "pos": 10, "neg": 3, "trend": 3, "period": 15
                },
                "alltime": {
                    "pos": 300, "neg": 100
                }
            }, "4agdfdagdah (questionId)": {
                "now": {
                   "pos": 10, "neg": 3, "trend": 3, "period": 15
                },
                "alltime": {
                   "pos": 300, "neg": 100
                }
            }
        ]
    }

* **trend**: integer [-3, 3], where -3 means getting worse with high speed, 0 not changing, 3 getting better with high speed
* **period**: results from last XX minutes


