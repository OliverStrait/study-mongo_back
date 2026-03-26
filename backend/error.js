
class HttpErrInfo extends Error {

    status = 400
    constructor(message, options) {
        super(message, options)
        this.data = {}
        this.data["invalid-params"] = []
        console.log(this.data)
    }

    add_data(obj) {
        Object.assign(this.data, obj)
        return this
    }
    add_invalid_params(list) {
        this.data["invalid-params"] = this.data["invalid-params"].concat(list)
        console.log(this.data)
    }
}

class InvalidSchema extends HttpErrInfo {
    status = 400
    title = "Invalid query schema"
}
class InvalidValues extends HttpErrInfo {
    status = 422
    title = "Invalid values"

}

module.exports = { HttpErrInfo, InvalidSchema, InvalidValues }