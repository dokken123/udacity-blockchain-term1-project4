const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);


/* ===== BlockLevelDB Class =======================
|  LevelDB operation for block chain       			 |
|  ===============================================*/
class BlockLevelDB {
  // Add data to levelDB with key/value pair
  addLevelDBData(key,value, callback, errCallback){
    db.put(key, JSON.stringify(value), function(err) {
      if (err) {
        console.log('Block ' + key + ' submission failed', err);
        if (errCallback) {
          callback(err);
        }
      };
      if (callback) {
        callback(value);
      }
    })
  }
  
  // Get data from levelDB with key and callback value
  getLevelDBData(key, callback, errCallback) {
    db.get(key, function(err, value) {
      if (!err) {
        callback(JSON.parse(value));
      } else {
        console.log('err got when getting data: ', err)
        if (errCallback) {
          errCallback(err);
        }
      }
    });
  }

  // Traverse data of entire blockchain
  // Code Review 2017-07-29: Traverse tuning, do not store entire blockchain data
  traversData(finishCallback, iterCallback, errCallback) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
          if (iterCallback) {
            iterCallback(JSON.parse(data.value));
          }
        }).on('error', function(err) {
          console.log('Unable to read data stream!', err)
          if (errCallback) {
            errCallback(err);
          }
        }).on('close', function() {
          if (finishCallback) {
            finishCallback(i);
          }
        });
  }
}

module.exports = BlockLevelDB;