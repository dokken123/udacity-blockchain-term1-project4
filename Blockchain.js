const BlockLevelDB = require("./BlockLevelDB");
const Block = require("./Block");

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(callback){
    console.log("initializing");
    this.level = new BlockLevelDB();
    // preserve BlockChain instance for closure
    let blockchain = this;
    // initialize blockchain data and add genesis block if not exists
    this.level.traversData(function(height) {
      if (height == 0) {
        console.log("Adding genesis block");
        blockchain.addBlock(new Block("First Block - Genesis"), function(result) {
          if (callback) {
            callback(1);
          }
        });
      } else {
        if (callback) {
          callback(height);
        }
      }
    });
  }

  // Add new block
  addBlock(newBlock, callback, errCallback){
    console.log("Adding new block");
    let level = this.level;
    this.level.traversData(function(height) {
      // Block height
      newBlock.height = height;
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      // previous block hash
      if(height > 0){
        level.getLevelDBData(height - 1, function(block) {
          newBlock.previousBlockHash = block.hash;
          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
          // Adding block object to chain
          level.addLevelDBData(newBlock.height, newBlock, callback, errCallback);
        })
      } else {
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        // Adding block object to chain
        level.addLevelDBData(newBlock.height, newBlock, callback);
      }
    });

  }

  // Get block height
  getBlockHeight(callback){
    this.level.traversData(function(height) {
      callback(height - 1);
    });
  }

  // get block
  getBlock(blockHeight, callback, errCallback){
    // return object as a single string
    this.level.getLevelDBData(blockHeight, function(block) {
      callback(block);
    }, errCallback);
  }


  // get block by address
  getBlockByAddr(addr, callback, errCallback){
    // return object as a single string
    let found = [];
    this.level.traversData(_ => {
      callback(found);
    }, block => {
      if (block.hasOwnProperty("body")
          && block.body.hasOwnProperty("address")) {
            if (block.body.address === addr) {
              found.push(block);
            }
      }
    }, err => errCallback(err));
  }
  
  // get block by hash
  getBlockByHash(hash, callback, errCallback){
    // return object as a single string
    let found = false;
    this.level.traversData(_ => {
      if(!found) callback(null);
    }, block => {
      if (block.hasOwnProperty("hash")) {
            if (block.hash === hash) {
              found = true;
              callback(block);
            }
      }
    }, err => errCallback(err));
  }

  // validate block by height
  validateBlock(blockHeight, callback){
    // get block object
    let blockchain = this;
    this.getBlock(blockHeight, function(block) {
      callback(blockchain.validateBlockData(block));
    });
  }

  // validate block data
  validateBlockData(block){
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // assign hash back to block
    block.hash = blockHash;
    // Compare
    if (blockHash===validBlockHash) {
      return true;
    } else {
      console.log('Block #'+block.height+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
      return false;
    }
  }

  // Validate blockchain
  // Code review 2018-07-29: Tuning for the chain loop and validation
  validateChain(){
    let blockchain = this;
    let errorLog = [];
    let traverseLength = 0;
    
    this.level.traversData(function(height) {
      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
    }, function(block){
      if (!blockchain.validateBlockData(block))errorLog.push(i);

      if (block.height > 0) {
        // compare blocks hash link
        blockchain.getBlock(block.height - 1, function(lastBlock){
          let blockPrevHash = block.previousBlockHash;
          let previousHash = lastBlock.hash;
          if (blockPrevHash!==previousHash) {
            errorLog.push(block.height);
          }
        });
      }
    });
  }
};

module.exports = Blockchain;