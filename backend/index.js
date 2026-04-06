const express = require("express")
const { MongoClient } = require("mongodb")

const valid = require("./validation")
const MQ = require("./yritys_mongo_query")
const mongo_uri = "mongodb://localhost:27017"
const error = require("./error")

const app = express()
const PORT = 5657;
const monClient = new MongoClient(mongo_uri)
const MDB = monClient.db("yritysrekisteri",)
const MDB_yritys_coll = MDB.collection("tekniset_yritykset")


const YRITYS_API = new MQ.YRITYS(MDB_yritys_coll)

app.get("/api/yritys",
    valid.QuerySchema(YRITYS_API.query_valueTransfer, "YRITYS_SCHEMA", false),
    valid.QueryValues(MQ.Yritys_value_sanitation, "YRITYS_VALUES"),

    async (req, res, next) => {
        try {
            let result = await YRITYS_API.get_query(req.valid_query, MDB_yritys_coll)
            res.json(result)
        }
        catch (e) { next(new Error("Database connection failure", { cause: e })) }
    }
)

app.listen(PORT, () => { console.log(`✅ @ :${PORT}/ Node server started `) })

app.use((err, req, res, next) => {
    res.set("Content-Type", "application/problem+json")
    if (err instanceof error.HttpErrInfo) {

        let error_data = { title: err.title, detail: err.message }
        Object.assign(error_data, err.data)
        res.status(err.status).json(error_data)
        res.end()
    }
    else if (err != undefined) {
        console.log(err)
        let error_data = { title: "Unexpected internal error", detail: err.message, cause: err.cause.message }
        res.status(500).json(error_data)
    }
    else next(err)
})