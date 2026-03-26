
const RM_REG_EX_CODE = /[^a-zA-Z0-9\s.\(\)\[\]-]/g

const IS_INT = /^[1-9][0-9]*/
const SAN_INT_STR = /^[0]|[^0-9]*/g


/** Remove Reqular Expression executional patterns from string
 * 
 * @param {*} value 
 * @returns 
 */
function sanitizeReqEx(value) {
    let new_value = value.replace(RM_REG_EX_CODE, "")
    if (new_value.length == value.length)
        return [true, new_value]
    else
        return [false, new_value, "Has REG_EX charachters"]
}

function isInt(value) {
    if (value.match(IS_INT)) {
        return [true, value]
    }
    else return [false, value.replace(SAN_INT_STR, ""), "Not an integer"]
}

module.exports = { sanitizeReqEx, isInt }