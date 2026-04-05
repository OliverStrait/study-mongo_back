# API backend study for MongoDb

## Goals 
- Flexible system which is easily modifiable to append or remove different bussiness requirements.
    - Using different functional-style abstract processors for Data and Schema validation pipelines.
## Subsystems

### Pagination
- Query total result count is cached in server memory. Having limited memory impact, but get atleast 1000 time time-performance.
- Paginated query is fetched from database every time.

## TODO
- [x] Pagination system
- [ ] Geospatial query. (api/yritys/geo/?lat= 12.12121&lon=123.1245&rad=1000)
    - lat, lon, radius in meters.
    - DB-data has geolocations.

## External documents:

- [RFC7808](https://www.rfc-editor.org/rfc/rfc7807.html) Design for error messages in HTTP API.
- (Geospatial MOngoDB](https://www.mongodb.com/docs/manual/geospatial-queries/) MongoDb has geospatial functionality to find results in WGS84-system. 