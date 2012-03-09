# Track RESTful API

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
  

### GET /target/:id - Returns specific target with detailed info

Status: 200 Ok

Reponse body:

	{
		target: {
			_id: “12faggf”,
			name: “T-Talon ruokajono”,
			metric: {
				unit: “min”,
				question: “Kauanko jonotit ruokajonossa?”
			}
		}
	}

### POST /target - Create a new target

Header: Content-Type (application/json)

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

	{}