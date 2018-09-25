const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

class BitcoinValidator {

    constructor() {

    }

    verify(message, address, signature) {
        console.log(bitcoin.opcodes);
        return bitcoinMessage.verify(message, address, signature);
    }   
}

module.exports = new BitcoinValidator();