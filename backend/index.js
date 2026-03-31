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



app.get("/api/yritys",
    valid.QuerySchema(MQ.YRITYS_SCHEMA, "YRITYS_SCHEMA", false),
    valid.QueryValues(MQ.Yritys_value_sanitation, "YRITYS_VALUES"),

    async (req, res, next) => {

        let [q, skip, page_size] = MQ.YRITYS_query(req.valid_query)

        try {
            result = await MDB_yritys_coll.find(q, { projection: { _id: false, tradeRegisterStatus: 0, status: 0, endDate: 0 } })
                .skip(skip)
                .limit(page_size)
                .toArray()

            res.json(result)
        }
        catch (e) { next(new Error("Database error", { cause: e })) }
    }
)

app.listen(PORT, () => { console.log(`✅ @ :${PORT}/ Node server started `) })

app.use((err, req, res, next) => {

    if (err instanceof error.HttpErrInfo) {
        res.set("Content-Type", "application/problem+json")
        let error_data = { title: err.title, detail: err.message }
        Object.assign(error_data, err.data)
        res.status(err.status).json(error_data)
        res.end()
    }
    else next(err)
})