const obj_tool = require("./obj_tools")
const err = require("./error")

/** Separate valid and invalid schema patterns from object using Schema-object as a template. 
 * zero-length data is considered invalid
 * @param {Object} obj 
 * @param {Object} schema 
 * @returns [valid:bool, valid_obj, list[{p:name, v:data}]]
 */
function SchemaCleaner(schema) {

    return (obj) => {
        var valid_obj = {}
        var invalid_values = []
        var valid = false
        for (let [entr, data] of Object.entries(obj))

            if (entr in schema) {
                if (data.length != 0) {
                    valid = true
                    valid_obj[entr] = data
                }
                else continue
            }
            else { invalid_values.push({ name: entr, reason: "not supported" }) }

        return [valid, valid_obj, invalid_values]
    }
}

/** Express middleware for validating Request Query schema and removing unvanted fields.
 * Adds `req.valid_query` in success
 * @param {object} schema Object that include valid schema as parameters
 * @param {string} name Name of schema for errors
 * @returns function
 */
function QuerySchema(schema, name, allowEmpty = false) {
    const QuerySchemaCleaner = SchemaCleaner(schema)
    const ErrorType = err.InvalidSchema

    return (req, res, next) => {
        var [valid, validQuery, invalid] = QuerySchemaCleaner(req.query)

        if (!valid && !allowEmpty) {
            let msg = (!valid && invalid.length == 0) ? "Empty query" : `All parameters are invalid`
            throw new ErrorType(msg).add_data({ "invalid-params": invalid })
        }

        req.valid_query = validQuery
        console.log(req.valid_query)
        return next()
    }
}


/** Sanitaze object-property values regarding rules stated in schema-object
 * 
 * @param {object} schema_pattern 
 * @param {string} name 
 * @returns 
 */
function ValueSaniation(schema_pattern, name) {
    const schema = Object.assign({}, schema_pattern)
    const ErrorType = err.InvalidValues

    if ("_ALL_" in schema) {
        const FOR_ALL = schema["_ALL_"]
        obj_tool.PopProperty(schema, "_ALL_")

        for (let [entr, value] of Object.entries(schema)) {
            schema[entr] = [].concat(FOR_ALL, value)
        }
    }

    return (obj) => {
        var req = {}
        var invalid_details = []
        for (let [parameter, value] of Object.entries(obj)) {

            for (let [func, errFunc] of schema[parameter]) {
                let [valid, sanitazed, err_reason] = func(value)
                if (!valid) {
                    invalid_details.push({ name: parameter, reason: err_reason })
                    try {
                        let valid = errFunc(sanitazed, invalid_details, ErrorType)
                        if (!valid) {
                            let error = new ErrorType("Could not process input")
                            throw error
                        }
                    }
                    catch (e) {
                        if (e instanceof err.HttpErrInfo) {
                            e.add_invalid_params(invalid_details)
                        }
                        throw e
                    }
                }
                req[parameter] = sanitazed
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
function QueryValues(schema, name) {
    const sanitizer = ValueSaniation(schema, name)

    return (req, res, next) => {
        try {
            req.valid_query = sanitizer(req.valid_query)
            next()
        }
        catch (e) {
            next(e)
        }
    }
}
module.exports = { QuerySchema, QueryValues }