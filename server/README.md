# Track RESTful API

All the requests with body (POST requests) should have a application/json Content-Type header set.

## Authentication

**This is a DRAFT of the authentication functions, waiting for comments. NOT YET IMPLEMENTED**

User has to be logged in to Facebook before accessing Track API. Client software is responsible of Facebook login.

The following parameters have to be sent with each request that requires authentication:

**fbUserId** Facebook user ID

**fbAccessToken** Access token received from Facebook after user login

## API endpoints

### GET /targets - Lists all targets

Requires authentication: Yes

Status: 200 Ok

Response body:

	{
		targets: [
			{_id: “12faggf”, name: “T-Talon ruokajono”, relevancy: 9.1251},
			{_id: “12fa41gf”, name: “Baarin meininki”, relevancy: 5.23521},
			{_id: “12fa113f”, name: “Mikä fiilis?”, relevancy: 1.2427254}
		]
	}
  

### GET /target/:_id - Returns specific target with detailed info

Requires authentication: Yes

Status: 200 Ok

Reponse body:

	{
		target: {
			_id: “12faggf”,
			name: “T-Talon ruokajono”,
			question: “T-Talon ruokajonon jonotusaika”
			
			results: {
				summary: {
					pos: 150, neg: 50
				},
				history: {
					{start: "2012-03-10T15:00:00.000Z", end: "2012-03-10T15:15:00.000Z", pos: 100, neg: 25},
					{start: "2012-03-10T14:45:00.000Z", end: "2012-03-10T15:00:00.000Z", pos: 30, neg: 15}
					{start: "2012-03-10T14:30:00.000Z", end: "2012-03-10T14:45:00.000Z", pos: 20, neg: 10}
				}
			}
		}
	}

### POST /target - Create a new target

Requires authentication: Yes

Request body:

	{
		name: “Track target name”
		question: "Kauanko/paljonko/jne plaa plaa plaa otsikkoa tarkentava kysymys"
	}
	
Status: 201 Created

Response body: 

	{_id: "12345678901234567890abcd"}

### POST /target/:_id/result - Send tracking result

Requires authentication: Yes

Request body:

    {
        value: 0 / 1
    }

Status: 204 No content

Response body:

    { }