/** Pop property from object and return value.
 * 
 * @param {Object} obj
 * @param {String} property 
 * @returns Object, undefined
 */
function PopProperty(obj, property) {
    let prop = obj[property]
    delete obj[property]
    return prop
}

/** Copy object 
 * 
 * @param {Object} obj 
 * @returns Object
 */
function CopyObject(obj) {
    return Object.assign({}, obj)
}
module.exports = { PopProperty, CopyObject }