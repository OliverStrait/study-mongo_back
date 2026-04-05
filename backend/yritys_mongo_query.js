const valid = require("./validation/string")
const obj_tool = require("./obj_tools")
const err = require("./error")

function inAnyString(data) {
    return new RegExp(`.*${data}.*`, "i")
}

/** Data schema-pattern that form MongoDb query in flexible matter
 * 
 */
class Yritys_Schema_model {
    Kaupunki = inAnyString
    Osoite = inAnyString
    Yhtiomuoto = inAnyString
    Y_tunnus = inAnyString
    Nimi = inAnyString
    Toimiala = inAnyString
    Toimialakoodi = inAnyString
    Rekisterointi_pvm = inAnyString
    Website = a => { if (a == "true") { return { $ne: null } } else { return false } }
    page = (a) => { return false }
}

/** Ignore sanitazed versions and cause error
 * 
 * @param {*} a 
 * @returns 
 */
const IGNORE_SAN = (valid_ver, invalid_data, ErrorType) => { throw new ErrorType("Could not process input") }

const Yritys_value_sanitation = {
    _ALL_: [[valid.sanitizeReqEx, IGNORE_SAN]],
    Kaupunki: [],
    Osoite: [],
    Yhtiomuoto: [],
    Y_tunnus: [],
    Nimi: [],
    Toimiala: [],
    Toimialakoodi: [[valid.isInt, IGNORE_SAN]],
    Rekisterointi_pvm: [],
    Website: [],
    page: [[valid.isInt, IGNORE_SAN]],
}
const YRITYS_SCHEMA = new Yritys_Schema_model()

/** Form a new object with correct queries for mongoDb
 * 
 * @param {*} obj 
 * @param {*} schema 
 * @returns 
 */
function TransformValues(obj, schema) {
    var req = {}
    for (let [entr, dat] of Object.entries(obj)) {
        if (dat != " " && dat != null && dat != "") {
            let value = schema[entr](dat)
            if (value)
                req[entr] = value
        }
    }
    return req
}



class Cache {
    constructor(time) {
        this.cache = {}
        this.max_time = time
    }

    gen_key(...args) {
        return JSON.stringify(args)
    }
    push(key, value) {
        this.cache[key] = value
        setTimeout(() => { delete this.cache[key]; console.log("deleted cached key", key) }, this.max_time)
    }
    async get(name, func) {
        let key = this.gen_key(name)
        let res = this.cache[key]
        if (res) { return [key, res] }
        else {
            let new_res = await func()
            this.push(key, new_res)
            return [key, new_res]
        }
    }
}
class YRITYS {
    PAGE_LENGTH = 20
    projection = { projection: { _id: false, tradeRegisterStatus: 0, status: 0, endDate: 0 } }
    constructor() {
        this.result_count = new Cache(1 * 60 * 60 * 1000)
    }
    validate_schema() {

    }
    cleanUpSchemaValues() {

    }

    paging(page) {
        const len = this.PAGE_LENGTH
        var skip = 0
        if (page && Number.isInteger(page)) {
            skip = page * len
        }
        return { page, skip, len }
    }

    async get_query(params, cursor) {
        const paging = this.paging(Number(params?.page))
        var req = TransformValues(params, YRITYS_SCHEMA)

        var [key, total_result] = await this.result_count.get(req,
            async () => { let res = await cursor.find(req, this.projection).toArray(); return res.length })
        let result = await cursor.find(req, this.projection).skip(paging.skip)
            .limit(paging.len)
            .toArray()
        return {
            data: result,
            meta: { total: total_result, pages: Math.ceil(total_result / paging.len) }
        }

    }
}


module.exports = { YRITYS, YRITYS_SCHEMA, Yritys_value_sanitation }