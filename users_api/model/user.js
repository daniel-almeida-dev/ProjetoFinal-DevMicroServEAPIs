class User {
    constructor (id, login, password, name, email, phone, createDate, updateDate) {
        this.id = id;
        this.login = login;
        this.password = password;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.createDate = createDate;
        this.updateDate = updateDate;
    }
}

module.exports = User;