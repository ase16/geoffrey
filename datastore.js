'use strict';

const gcloud = require('gcloud');
const config = require('config');
const log = require('winston');
//log.level = config.get('log.level');

// Authenticating on a per-API-basis.
let db;

// this is a pseudo-check to see if we have a connection
// if the object is not undefined, we assume it has been initialized/set
const isConnected = () => typeof db !== "undefined";


var datastore = {

  connect: function(conf, callback) {
      // do we already have a connection?
      if (isConnected()) return;
      db = gcloud.datastore(conf);
      callback();
  },

  /**
   * get aggregation entities from the datastore that were
   * previoulsy created by the will-nodes
   * @param {String} term - a term used to filter the datastore
   * @param {Date} startTime - finest granularity is hour
   * @param {Date} endTime - end of the lookup-period
   * @param {requestCallback} callback - returning an array of entities or an error message
   */
  getEntities: function(term, from, to, callback) {

    var data = {
      created: 1463099107000,
      totalTweets: 32,
      date: 1463058107000,
      term: 'batman',
      hourBuckets : {
        '0': {
          numTweets: 14,
          aggrSentiment: -0.214,
          positive: {
            'share': 2,
            'favorite': 5
          },
          negative: {
            'gray': 1,
            'bad': 3,
            'nice': 4
          }
        },
        '1': {
          numTweets: 18,
          aggrSentiment: 0.414,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '2': {
          numTweets: 18,
          aggrSentiment: 0.214,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '3': {
          numTweets: 18,
          aggrSentiment: 0.214,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '9': {
          numTweets: 18,
          aggrSentiment: -0.214,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '5': {
          numTweets: 20,
          aggrSentiment: 0.54,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3,
            'bad': 4
          }
        }
      }
    }

    var data2 = {
      created: 1463099100007,
      totalTweets: 32,
      date: 1463058000107,
      term: 'batman',
      hourBuckets : {
        '0': {
          numTweets: 14,
          aggrSentiment: -0.214,
          positive: {
            'share': 2,
            'favorite': 5
          },
          negative: {
            'gray': 1,
            'bad': 3,
            'nice': 4
          }
        },
        '1': {
          numTweets: 18,
          aggrSentiment: 0.014,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 4,
            'cold': 3
          }
        },
        '2': {
          numTweets: 18,
          aggrSentiment: 0.214,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '3': {
          numTweets: 18,
          aggrSentiment: 0.214,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '7': {
          numTweets: 18,
          aggrSentiment: -0.1214,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3
          }
        },
        '5': {
          numTweets: 20,
          aggrSentiment: 0.46,
          positive: {
            'bright': 2,
            'puppy': 5
          },
          negative: {
            'death': 1,
            'cold': 3,
            'bad': 5
          }
        }
      }
    }

    callback(null, [data, data2])
  }
}

// Add a new tweet.
// @param tweet JSON as received from the Twitter API
// @param callback fn(err, res)
// getTweets: function(nodeId, callback) {
//     if (!isConnected()) {
//         callback("Not connected", null);
//         return;
//     }
//     var query = datastore
//         .createQuery('Tweet')
//         .autoPaginate(false)
//         .filter('vm', '=', nodeId)
//         .limit(500);
//     datastore.runQuery(query, callback);
// },
//
// updateTweets: function(tweets, callback) {
//     datastore.update(tweets, callback);
// }
//

datastore.connect(config.get('gcloud'), () => {
  console.log("DATABASE IS CONNECTED", isConnected())
})

module.exports = datastore;
