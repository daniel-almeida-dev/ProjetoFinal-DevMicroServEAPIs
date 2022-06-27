class FinancialInfo {
    constructor (id, accountNumber, bankName, accountType, holderName, cardLimit, createDate, updateDate) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.bankName = bankName;
        this.accountType = accountType;
        this.holderName = holderName;
        this.cardLimit = cardLimit;
        this.createDate = createDate;
        this.updateDate = updateDate;
    }
}

module.exports = FinancialInfo;