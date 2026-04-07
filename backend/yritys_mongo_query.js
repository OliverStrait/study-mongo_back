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
const RAISE_ERROR = (valid_ver, invalid_data, ErrorType) => { throw new ErrorType("Could not process input") }

const Yritys_value_sanitation = {
    _ALL_: [[valid.sanitizeReqEx, RAISE_ERROR]],
    Kaupunki: [],
    Osoite: [],
    Yhtiomuoto: [],
    Y_tunnus: [],
    Nimi: [],
    Toimiala: [],
    Toimialakoodi: [[valid.isInt, RAISE_ERROR]],
    Rekisterointi_pvm: [],
    Website: [],
    page: [[valid.isInt, RAISE_ERROR]],
}

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
    gen_key(...args) { return JSON.stringify(args) }
    push(key, value) {
        this.cache[key] = value
        setTimeout(() => { delete this.cache[key]; }, this.max_time)
    }

    /** Return value from cache using unique key-object
     * @param {object} key_obj Json.stringify object, using only string and number values
     * @param {*} callback Callback function where cached value can get if not found in cache.
     * @returns any
     */
    async get(key_obj, callback) {
        let key = this.gen_key(key_obj)
        let res = this.cache[key]
        if (res) {
            return [key, res]
        }
        else {
            let new_res = await callback()
            this.push(key, new_res)
            return [key, new_res]
        }
    }
}

const DEFAULT_TIMEOUT = 1 * 60 * 60 * 1000
class YRITYS {
    PAGE_LENGTH = 20
    projection = { projection: { _id: false, tradeRegisterStatus: 0, status: 0, endDate: 0 } }
    query_valueTransfer = new Yritys_Schema_model()

    constructor(cursor, cache_timeout = DEFAULT_TIMEOUT) {
        this.cursor = cursor
        this.total_cache = new Cache(cache_timeout)
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

    aggregate_count(req) {
        return async () => {
            let res = await this.cursor.aggregate([{ $match: req }, { $group: { _id: null, n: { $sum: 1 } } }]).toArray()
            return res[0]?.n || 0
        }
    }
    async total_count_cache(name, callback) {
        let res = await this.total_cache.get(name, callback)
        return res
    }

    async get_query(params) {
        const param_copy = obj_tool.CopyObject(params)
        const paging = this.paging(Number(obj_tool.PopProperty(param_copy, "page")))

        var req = TransformValues(params, this.query_valueTransfer)
        var [key, total_count] = await this.total_count_cache(param_copy, this.aggregate_count(req))

        let result = await this.cursor.find(req, this.projection).skip(paging.skip)
            .limit(paging.len)
            .toArray()
        return {
            data: result,
            meta: { total: total_count, pages: Math.ceil(total_count / paging.len) }
        }

    }
}


module.exports = { YRITYS, Yritys_value_sanitation }