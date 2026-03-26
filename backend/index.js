const express = require("express")

const { MongoClient } = require("mongodb");
const valid = require("./validation")
const MQ = require("./yritys_mongo_query")
const mongo_uri = "mongodb://localhost:27017";

// async function MongoDbCollection(uri, database, collection) {
//     console.log("ur", typeof uri)
//     const client = new MongoClient(uri)
//     try {
//         await client.connect();


//         const db = await client.db(database);
//         let colls = await db.collections()
//         let namespace = database + "." + collection
//         var collect_con = false
//         for (let col of colls)
//             if (col.namespace == namespace)
//                 connect = await db.collection(collection)
//         console.log("✅ Mongodb connection is created")
//         return connect

//     } catch (err) {
//         console.error("MongoDB connection error:", err);
//     }

// }

const app = express()
const PORT = 5657;
const monClient = new MongoClient(mongo_uri)
const MDB = monClient.db("yritysrekisteri",)
const MDB_yritys_coll = MDB.collection("tekniset_yritykset")
// var YRITYS = {}
// MongoDbCollection(mongo_uri, "yritysrekisteri", "tekniset_yritykset").then((a) => YRITYS = a)


app.get("/api/yritys",
    valid.QuerySchema(MQ.YRITYS_SCHEMA, "YRITYS_SCHEMA"),
    valid.validQueryValues(MQ.Yritys_value_sanitation, "YRITYS_VALUES"),
    async (req, res, next) => {

        let [q, skip, page_size] = MQ.YRITYS_query(req.valid_query)
        console.log("WITH QUERY", req.valid_query)
        console.log("DATA", skip, page_size)

        result = await MDB_yritys_coll.find(q, { projection: { _id: false, tradeRegisterStatus: 0, status: 0, endDate: 0 } })
            .skip(skip)
            .limit(page_size)
            .toArray()

        res.json(result)

    }
)

app.listen(PORT, () => { console.log(`✅ @ :${PORT}/ Node server started `) })

app.use((err, req, res, next) => {

    if ("reason" in err) {
        res.status(err.status).json({ reason: err.reason, error: true, data: err?.data ? err.data : null })
        res.end()
    }
    else next(err)
})