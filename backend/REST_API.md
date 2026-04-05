

## All error responses: [400,422, 500 ]
- body 
    ```json
    {
        "title": string <error type>,
        "detail": string <spesific subtype>,
        "invalid_params": [{
            "name": <name of invalid param>,
            "reason": <description reason>
        }]
    }

## /api/yritys
parameters:
-  Kaupunki: string
-  Osoite: string
- Yhtiomuoto: string
- Y_tunnus: string
- Nimi: string
- Toimiala: string
- Toimialakoodi: int
- Rekisterointi_pvm: ISO-DATE
- Website: string
- page: int

### Responses
- 200
    ```json
    {"data": [<result>],
    "meta": {
        "total": <result total>,
        "pages": <result_page_count>
    }}
    ```

- Partially invalid parameter schema is processed. Invalid data is ignored.
- 400. Empty query, invalid parameter schema
- 422. Unprocessable. Correct schema but invalid values.