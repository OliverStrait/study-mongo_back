const valid = require("./validation/string")
const obj_tool = require("./obj_tools")


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
const IGNORE_SAN = (valid_ver, name) => { console.log("Failed value for :" + name); return false }

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
function ProcessSchema(obj, schema) {
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


const PAGE_LENGTH = 20
function YRITYS_query(params) {
    let page = params?.page
    var req = ProcessSchema(params, YRITYS_SCHEMA)

    var skip = 0
    if (page && Number.isInteger(page)) {
        skip = page * PAGE_LENGTH
    }
    return [req, skip, PAGE_LENGTH]
}

module.exports = { YRITYS_query, YRITYS_SCHEMA, Yritys_value_sanitation }