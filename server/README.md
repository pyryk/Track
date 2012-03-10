# Track RESTful API

All the requests with body (POST requests) should have a application/json Content-Type header set.

### GET /targets - Lists all targets

Status: 200 Ok

Response body:

	{
		targets: [
			{_id: “12faggf”, name: “T-Talon ruokajono”},
			{_id: “12fa41gf”, name: “Baarin meininki”},
			{_id: “12fa113f”, name: “Mikä fiilis?”}
		]
	}
  

### GET /target/:_id - Returns specific target with detailed info

Status: 200 Ok

Reponse body:

	{
		target: {
			_id: “12faggf”,
			name: “T-Talon ruokajono”,
			metric: {
				unit: “min”,
				question: “Kauanko jonotit ruokajonossa?”
			},
			results: [
			    {"value": 15, "timestamp": "2012-03-10T15:53:29.015Z"},
			    {"value": 16, "timestamp": "2012-03-10T15:53:33.002Z"},
			    {"value": 17, "timestamp": "2012-03-10T15:53:36.151Z"}
			]
		}
	}

### POST /target - Create a new target

Request body:

	{
		name: “Track target name”
		metric: {
			unit: "min",
			question: "Kauanko sitä ja tätä?"
		}
	}
	
Status: 201 Created

Response body: 

	{_id: "12345678901234567890abcd"}

### POST /target/:_id/result - Send tracking result

Request body:

    {
        value: "12"
    }

Status: 204 No content

Response body:

    { }