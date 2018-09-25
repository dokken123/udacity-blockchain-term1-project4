const util = require('util');
const Block = require("./Block");
const Blockchain = require("./Blockchain");

let blockchain = new Blockchain(function(height) {

    // Get Genesis block
    console.log("1. Get genesis block data");
    blockchain.getBlock(0, function(block) {
      console.log(JSON.stringify(block));
      
      // add new Block
      console.log("2. Add new block");
      blockchain.addBlock(new Block("New test block at " + new Date().toString()), function(result) {
        
        let blockHeight = 0;
        // get block height
        console.log("3. Get current block height");
        blockchain.getBlockHeight(function(height) {
          blockHeight = height;
          console.log("blockchain height: " + blockHeight);
          // validate last block
          console.log("4. Validate block at " + blockHeight);
          blockchain.validateBlock(blockHeight, function(result) {
            console.log(util.format("Block at %s validate status: %s", blockHeight, result));
            // get last block data
            console.log("5. Get block data at " + blockHeight);
            blockchain.getBlock(blockHeight, function(block) {
              console.log("Block at " + blockHeight + ": " + JSON.stringify(block));
              // Validate blockchain
              console.log("6. Validate entire block chain");
              blockchain.validateChain();
            });
          });
        });
      });
    });
  });