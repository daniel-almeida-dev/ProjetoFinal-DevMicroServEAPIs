const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const auth = require("./middleware/auth_verify")
const FinancialInfo = require("./model/financial_info")

const app = express();
app.use(express.json());
app.use(cors());

const connection = mysql.createConnection({
    host: "190.124.247.232:9998",
    user: "db_finan_application",
    password: "dbfinanapp@123456",
    database: "db_financial",
    port: "3306"
});

connection.connect((error, data) => {
    if (error) {
        console.error(`Conection to db server was failed -> ${error.stack}`);

        return;
    }

    console.log(`Db connection thread information -> ${connection.threadId}`);
});

app.get("/api/financial/accounts", auth, (req, res) => {
    connection.query("SELECT * FROM financialInfo", (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar buscar os dados financeiros!' });
        }

        return res.status(200).send({ results: results, totalResults: results.length });
    });
});

app.post("/api/financial/create", auth, (req, res) => {
    connection.query("SELECT COUNT(*) AS existingAccount FROM financialInfo WHERE accountNumber = ?", [req.body.accountNumber], (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar cadastrar estes dados financeiros!' });
        }

        if (results[0].existingAccount > 0) {
            return res.status(400).send({ message: 'Esta conta já está cadastrada no sistema!' });
        }

        var createDate = new Date();

        var financialInfo = new FinancialInfo(0, req.body.accountNumber, req.body.bankName, req.body.accountType,
            req.body.holderName, req.body.cardLimit, createDate, createDate);

        connection.query("INSERT INTO financialInfo SET?", financialInfo, (error, results) => {
            if (error) {
                console.error(`Myslq insert error -> ${error}`);

                return res
                    .status(400)
                    .send({ message: 'Ocorreu um erro ao tentar cadastrar estes dados financeiros!' });
            }

            connection.query("SELECT * FROM financialInfo WHERE id = ?", [results.insertId], (error, results) => {
                if (error) {
                    console.error(`Myslq select error -> ${error}`);

                    return res
                        .status(400)
                        .send({ id: result.insertId, message: 'Dados financeiros com sucesso. Erro ao recuperar dados!' });
                }

                var result = results[0];

                return res.status(200).send({ id: result.id, message: `Dados financeiros de ${result.holderName} cadastrados com sucesso.` });
            });
        });
    });
});

app.put("/api/financial/update/:id", auth, (req, res) => {
    connection.query("SELECT * FROM financialInfo WHERE id = ?", [req.params.id], (error, results) => {
        if (error) {
            console.error(`Myslq select error -> ${error}`);

            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao tentar atualizar estes dados financeiros!' });
        }

        if (results.length == 0) {
            return res
                .status(400)
                .send({ message: 'Ocorreu um erro ao atualizar as informações financeiras. Dados financeiros não encontrados!' });
        }

        var result = results[0];
        var updateDate = new Date();

        var financialInfo = new FinancialInfo(result.id, result.accountNumber, req.body.bankName, req.body.accountType,
            req.body.holderName, req.body.cardLimit, result.createDate, updateDate);

        connection.query("UPDATE financialInfo SET?", financialInfo, (error) => {
            if (error) {
                console.error(`Myslq update error -> ${error}`);

                return res
                    .status(400)
                    .send({ message: 'Ocorreu um erro ao tentar atualizar estes dados financeiros!' });
            }

            return res.status(200).send({ message: `Dados financeiros de ${result.holderName} atualizados com sucesso.` });
        });
    });
});

app.listen(9002, () => console.log("Server online at port 9002"));