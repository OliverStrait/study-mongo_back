const obj_tool = require("./obj_tools")

class SaniError extends Error {
    name = "SaniError"
}

/** Separate valid and unvalid values from object using Schema-object as template
 * 
 * @param {Object} obj 
 * @param {Object} schema 
 * @returns [valid:bool, valid_obj, list[{p:name, v:data}]]
 */
function ObjectSchemaCleaner(schema) {

    return (obj) => {
        var valid_obj = {}
        var unvalid_values = {}
        var valid = false
        for (let [entr, data] of Object.entries(obj))

            if (entr in schema) {
                valid = true
                valid_obj[entr] = data
            }
            else { unvalid_values[entr] = data }

        return [valid, valid_obj, unvalid_values]
    }
}

/** Express middleware for validating Request Query schema and removing unvanted fields.
 * Adds `req.valid_query` in success
 * @param {object} schema Object that include valid schema as parameters
 * @param {string} name Name of schema for errors
 * @returns function
 */
function QuerySchema(schema, name, allowEmpty = false) {
    const StructureCleaner = ObjectSchemaCleaner(schema)

    return (req, res, next) => {
        var [valid, validQuery, unvalid] = StructureCleaner(req.query)

        if (!valid && !allowEmpty) {
            return next({ reason: `Unsupported query schema`, data: { unvalid: unvalid, valid: validQuery }, status: 400 })
        }
        if (unvalid.length > 0)
            console.log("Query schema:", name, "Got unexpected parameters: ", unvalid)
        req.valid_query = validQuery
        return next()
    }
}


/** Sanitaze object-property values regarding rules stated in schema-object
 * 
 * @param {object} schema_pattern 
 * @param {string} name 
 * @returns 
 */
function ObjectValueSaniation(schema_pattern, name) {
    const schema = Object.assign({}, schema_pattern)

    if ("_ALL_" in schema) {
        const FOR_ALL = schema["_ALL_"]
        obj_tool.PopProperty(schema, "_ALL_")

        for (let [entr, value] of Object.entries(schema)) {
            schema[entr] = [].concat(FOR_ALL, value)
        }
    }
    return (obj) => {
        var req = {}
        for (let [entr, dat] of Object.entries(obj)) {
            for (let [func, errFunc] of schema[entr]) {
                let [valid, valid_res, err_name] = func(dat)
                if (!valid) {
                    let valid = errFunc(valid_res, err_name)
                    if (!valid) throw new SaniError(`Invalid input: ${entr}=${dat} Failed: ${err_name}`)
                }
                req[entr] = valid_res
            }
        }
        return req
    }
}

/**Query object value sanitizer middleware. Works after `QuerySchema`-middleware
 * 
 * @param {Object} schema with structure `{Param_name: [[sanitizer, err_handler]],
 * _ALL_: [[sanitizer, err_handler]]}` `_ALL_` is optional to run in all parameters
 * @param {String} name 
 * @returns `function(req,res,next)`
 */
function validQueryValues(schema, name) {
    const sanitizer = ObjectValueSaniation(schema, name)

    return (req, res, next) => {
        try {
            req.valid_query = sanitizer(req.valid_query)
            next()
        }
        catch (e) {
            console.log(e.name)
            if (e instanceof SaniError) {
                next({ reason: name + ": " + e.message, status: 400, data: req.query })
            }
            else throw e
        }
    }
}
module.exports = { QuerySchema, validQueryValues }