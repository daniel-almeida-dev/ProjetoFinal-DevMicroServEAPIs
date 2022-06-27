const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const User = require("./model/user");
const auth = require("./middleware/auth")
const create_token = require("./utils/token");

const app = express();
app.use(express.json());
app.use(cors());

const connection = mysql.createConnection({
    host: "localhost",
    user: "db_user_application",
    password: "dbuserapp@123456",
    database: "db_users",
    port: "3306"
});

connection.connect((error, data) => {
    if (error) {
        console.error(`Conection to db server was failed -> ${error.stack}`);

        return;
    }

    console.log(`Db connection thread information -> ${connection.threadId}`);
});

app.get("/api/users", (req, res) => {
    connection.query("SELECT * FROM users", (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar buscar os usuários!' });
        }

        return res.status(200).send({ results: results, totalResults: results.length });
    });
});

app.post("/api/users/create", (req, res) => {
    connection.query("SELECT COUNT(*) AS existingUser FROM users WHERE login = ?", [req.body.login], (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar cadastrar o usuário!' });
        }

        if (results[0].existingUser > 0) {
            return res.status(400).send({ message: 'Usuário já cadastrado no sistema!' });
        }

        var createDate = new Date();

        var user = new User(0, req.body.login, req.body.password, req.body.name,
            req.body.email, req.body.phone, createDate, createDate);

        bcrypt.hash(user.password, 10, (error, hashpass) => {
            if (error) {
                console.error(`Bcrypt error -> ${error}`);

                return res.status(500).send({ message: 'Ocorreu um erro ao tentar criptografar a senha do usuário!' });
            }

            user.password = hashpass;

            connection.query("INSERT INTO users SET?", user, (error, results) => {
                if (error) {
                    console.error(`Myslq insert error -> ${error}`);

                    return res
                        .status(400)
                        .send({ message: 'Ocorreu um erro ao tentar cadastrar este usuário!' });
                }

                connection.query("SELECT * FROM users WHERE id = ?", [results.insertId], (error, results) => {
                    if (error) {
                        console.error(`Myslq select error -> ${error}`);

                        return res
                            .status(400)
                            .send({ id: result.insertId, message: 'Usuário cadastrado com sucesso. Erro ao recuperar usuário!' });
                    }

                    var result = results[0];

                    return res.status(200).send({ id: result.id, message: `Usuário ${result.login} cadastrado com sucesso.` });
                });
            });
        });
    });
});

app.put("/api/users/update/:id", (req, res) => {
    connection.query("SELECT * FROM users WHERE id = ?", [req.params.id], (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar atualizar o usuário!' });
        }

        if (results.length == 0) {
            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar atualizar este usuário. Usuário não encontrado!' });
        }

        var result = results[0];
        var updateDate = new Date();

        var user = new User(result.id, result.login, result.password, req.body.name,
            req.body.email, req.body.phone, result.createDate, updateDate);

        connection.query("UPDATE users SET?", user, (error) => {
            if (error) {
                console.error(`Myslq update error -> ${error}`);

                return res
                    .status(400)
                    .send({ message: 'Ocorreu um erro ao tentar atualizar este usuário!' });
            }

            return res.status(200).send({ message: `Usuário ${result.login} atualizado com sucesso.` });
        });
    });
});

app.put("/api/users/updatepassword/:id", auth, (req, res) => {
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var passwordConfirmation = req.body.passwordConfirmation;

    connection.query("SELECT * FROM users WHERE id = ?", [req.params.id], (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar atualizar a senha do usuário!' });
        }

        if (results.length == 0) {
            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar atualizar este usuário. Usuário não encontrado!' });
        }

        if (newPassword != passwordConfirmation) {
            return res
                .status(400)
                .send({ message: 'Não foi possível atualizar a senha. Confirmação de senha incorreta!' });
        }

        var result = results[0];

        bcrypt.compare(oldPassword, result.password, (error, data) => {
            if (!data) return res.status(400).send({ message: `Senha antiga inválida!` });

            bcrypt.hash(newPassword, 10, (error, hashpass) => {
                if (error) {
                    console.error(`Bcrypt error -> ${error}`);

                    return res.status(500).send({ message: 'Ocorreu um erro ao tentar criptografar a senha do usuário!' });
                }

                var updateDate = new Date();

                newPassword = hashpass;

                connection.query("UPDATE users SET password = ?, updateDate = ? WHERE id = ?", [newPassword, updateDate, result.id], (error) => {
                    if (error) {
                        console.error(`Myslq update error -> ${error}`);

                        return res
                            .status(400)
                            .send({ message: 'Ocorreu um erro ao tentar atualizar a senha deste usuário!' });
                    }

                    return res.status(200).send({ message: `Senha do usuário ${result.login} atualizada com sucesso.` });
                });
            });
        });
    });
});

app.post("/api/token", (req, res) => {
    const login = req.body.login;
    const password = req.body.password;

    connection.query("SELECT * FROM users WHERE login = ?", [login], (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar fazer o login!' });
        }

        if (results.length == 0) {

            return res.status(404).send({ message: `Não foi possível realizar o login. Usuário ${login} não encontrado!` });
        }

        var result = results[0];

        bcrypt.compare(password, result.password, (error, data) => {
            if (!data) return res.status(400).send({ message: `Não foi possível realizar o login. Senha incorreta!` });

            const token = create_token(result.id, result.login);

            return res.status(200).send({ message: `Usuário autenticado.`, user_id: result.id, token: token, url: "http://127.0.0.1:9002" })
        });
    });
});

app.listen(9001, () => console.log("Server online at port 9001"));