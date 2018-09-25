const express = require('express');

const Blockchain = require("./Blockchain");

const validator = require("./Bitcoin.cypher");

const bodyParser = require('body-parser');

const util = require("util");

var userIdentityMap = {};

const app = express();

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

var blockchain = new Blockchain((height) => {
    console.log("Blockchain initiated with height: " + height);
});

app.get("/", (req, res) => {
    blockchain = new Blockchain((height) => {
        console.log("Blockchain initiated with height: " + height);
        res.send({'Application': 'Blockchain local API', 'ver': 1.0, 'BlockHeight': height});
    });
});

app.post("/block", (req,res) => {
    if (req.body == null || req.body == undefined) {
        res.send({});
    }
    var block = req.body;
    if (block.address == null || block.address == undefined) {
        res.send({"err":"NO Address"});
    } else if (block.star == null || block.star == undefined) {
        res.send({"err":"NO Address"});
    } else {
        blockchain.addBlock({"body": block}, (retBlock) => {
            res.send(retBlock);
        }, (err) => {
            res.send(err);
        });
    }
});

app.get("/block/:height", (req,res) => {
    var height = req.params.height;
    blockchain.getBlock(height, (block) => {
        res.send(block);
    }, (err) => {
        res.send(err);
    });
});

app.get("/stars/address:addr", (req, res) => {
    var addr = req.params.addr.slice(1);
    blockchain.getBlockByAddr(addr, block => {
        res.send(block)
    }, err => res.send(err))
});

app.get("/stars/hash:hash", (req, res) => {
    var hash = req.params.hash.slice(1);
    blockchain.getBlockByHash(hash, block => {
        res.send(block)
    }, err => res.send(err))
});

app.post("/requestValidation", (req, res) => {
    if (req.body == null || req.body == undefined) {
        res.send({});
    } else {
        var body = req.body;
        if (body.address == null || body.address == undefined) {
            res.send({"err":"address not valid"});
        } else {
            var addr = body.address;        
            var timestamp = new Date().getTime().toString().slice(0,-3);
            var blocktime = null;
            var expires = 0;
            if (userIdentityMap.hasOwnProperty(addr)) {
                blocktime = userIdentityMap[addr];
                expires = timestamp - blocktime;
                if (expires >= 300) {
                    blocktime = null;
                }
            }
            if (blocktime == null) {
                var msg = util.format("%s:%s:starRegistry", addr, timestamp);

                userIdentityMap[addr] = timestamp;
                res.send({
                    "address": addr,
                    "requestTimeStamp": timestamp,
                    "message": msg,
                    "validationWindow": 300
                });
            } else {
                var msg = util.format("%s:%s:starRegistry", addr, blocktime);
                res.send({
                    "address": addr,
                    "requestTimeStamp": blocktime,
                    "message": msg,
                    "validationWindow": 300 - expires
                });
            }
        }
    }
});

app.post("/message-signature/validate", (req, res) => {
    if (req.body == null || req.body == undefined) {
        res.send({});
    } else {
        var body = req.body;
        if (body.address == null || body.address == undefined) {
            res.send({"err":"address not valid"});
        } else if(body.signature == null || body.signature == undefined) {
            res.send({"err":"signature not valid"});
        } else {
            var addr = body.address;
            var sign = body.signature;
            var timestamp = new Date().getTime().toString().slice(0, -3);
            var blocktime = null;
            var expires = 0;
            if (userIdentityMap.hasOwnProperty(addr)) {
                blocktime = userIdentityMap[addr];
                expires = timestamp - blocktime;
                if (expires >= 300) {
                    blocktime = null;
                }
            }
            if (blocktime == null) {
                var msg = util.format("%s:%s:starRegistry", addr, timestamp);
                res.send({
                    "registerStar": false,
                    "status": {
                        "address": addr,
                        "requestTimeStamp": timestamp,
                        "message": msg,
                        "validationWindow": 0,
                        "messageSignature": "invalid"
                    }
                });
            } else {
                var msg = util.format("%s:%s:starRegistry", addr, blocktime);
                var validated = validator.verify(msg, addr, sign);
                res.send({
                    "registerStar": validated,
                    "status": {
                        "address": addr,
                        "requestTimeStamp": blocktime,
                        "message": msg,
                        "validationWindow": 300 - expires,
                        "messageSignature": validated ? "valid" : "invalid"
                    }
                });
            }
        }
    }
});

module.exports = app;