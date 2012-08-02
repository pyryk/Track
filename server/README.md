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

### GET /customers - Lists all customers

Requires authentication: No

Status: 200 OK

Response body:

{
    "customers":[
        {"name":"Hesburger","_id":"500cf09dda8f3be960000095"},
        {"name":"McDonald's","_id":"500cf0afda8f3be960000097"},
        {"name":"Aalto-yliopisto","_id":"500cf0a7da8f3be960000096"},
        {"name":"MTV3","_id":"500d3a5fac1b513963000002"}
    ]
}

### GET /customers/:id - Get customer details with target list

Requires authentication: No

Status: 200 OK

Response body:

    {
        "customer": {
            "name":"Hesburger",
            "_id":"500cf09dda8f3be960000095",
            "targets":[
                {"name":"Hesburger Kamppi","_id":"5018de83e6ce5a6e8300067d"},
                {"name":"Hesburger Hakaniemi","_id":"5018de9be6ce5a6e8300068a"},
                {"name":"Hesburger Asematunneli","_id":"5018deade6ce5a6e8300068e"},
            ]
        }
    }


### GET /targets/:id - Get target details with question list

Requires authentication: No

Status: 200 Ok

Response body:

    {
        "target": {
            "name":"Hesburger Kamppi",
            "customerId":"500cf09dda8f3be960000095",
            "_id":"5018de83e6ce5a6e8300067d",
            "questionType":"twoSmiles",
            "showQuestionComment":false,
            "questions":[
                {"name":"Maistuiko ruoka?", "_id":"5018de83e6ce5a6e8300067f"},
                {"name":"Oliko ravintolassa siistiä?","_id":"5018de83e6ce5a6e8300067e"},
                {"name":"Oliko palvelu nopeaa?","_id":"5018de83e6ce5a6e83000680"}
            ]
        }
    }

### POST /targets - Create a new target

Requires authentication: No

Possible questionTypes: fourSmiles, twoSmiles, comment. Others are currently accepted too though.

Request body:


    {
        "name": "Track target name",
        "customerId": "500cf0afda8f3be960000097",
        "questions": [
            {"name": "Viihdyitkö?"},
            {"name": "Maistuiko?"},
            {"name": "Oliko kivaa?"}
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

### POST /question/:_id/result - Send tracking result

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

Currently, if the resultId present only textComment is updated to the existing result.

In case of two smiles values include 1 and -1.
In case of four smiles values include -2, -1, 1 and 2.

    {
        value: -2 / -1 / 1 / 2,
        textComment: "Food was fresh but too salty.",
        location: {
    		  lat: 12.345,
    		  lon: 67.890
        },
        resultId

    }

Response body:

Id of the added result. Should probably be conditional between addResult and updateResult.

201 Created	{"_id": "12345678901234567890abcd"}

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


