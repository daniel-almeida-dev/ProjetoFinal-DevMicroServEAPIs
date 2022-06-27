const jwt = require("jsonwebtoken")
const config = require("../config/config")

const create_token = (id, login) => {
    return jwt.sign({id:id, login:login}, config.jwt_key, {expiresIn:config.jwt_expires});
}

module.exports = create_token;