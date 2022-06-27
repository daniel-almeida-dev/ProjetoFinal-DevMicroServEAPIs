const jwt = require("jsonwebtoken")
const config = require("../config/config")

const auth = (req, res, next) => {
    const token = req.headers.token

    if (!token) {
        return res.status(401).send({ output: 'Token de autenticação inválido.' })
    }

    jwt.verify(token, config.jwt_key, (error, data) => {
        if (error) return res.status(403).send({ output: 'Falha na autenticação. Token inválido.' });

        if (!data) return res.status(401).send({ output: 'Token de autenticação inválido ou expirado. Realize login novamente.' })

        req.content = {
            id: data.id,
            login: data.login
        }

        return next();
    });
}

module.exports = auth;