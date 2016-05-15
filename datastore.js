'use strict';

const gcloud = require('gcloud');

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
   * @param {Date} startDay - day-precision is applied
   * @param {Date} endDay - day-precision is applied
   * @param {requestCallback} callback - returning an array of entities or an error message
   */
  getEntities: function(term, startDay, endDay, callback) {

    // var data = {
    //   created: 1463099107000,
    //   totalTweets: 32,
    //   date: 1463058107000,
    //   term: 'batman',
    //   hourBuckets : {
    //     '0': {
    //       numTweets: 14,
    //       aggrSentiment: -0.214,
    //       positive: {
    //         'share': 2,
    //         'favorite': 5
    //       },
    //       negative: {
    //         'gray': 1,
    //         'bad': 3,
    //         'nice': 4
    //       }
    //     },
    //     '1': {
    //       numTweets: 18,
    //       aggrSentiment: 0.414,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '2': {
    //       numTweets: 18,
    //       aggrSentiment: 0.214,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '3': {
    //       numTweets: 18,
    //       aggrSentiment: 0.214,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '9': {
    //       numTweets: 18,
    //       aggrSentiment: -0.214,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '5': {
    //       numTweets: 20,
    //       aggrSentiment: 0.54,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3,
    //         'bad': 4
    //       }
    //     }
    //   }
    // }
    //
    // var data2 = {
    //   created: 1463099100007,
    //   totalTweets: 32,
    //   date: 1463058000107,
    //   term: 'batman',
    //   hourBuckets : {
    //     '0': {
    //       numTweets: 14,
    //       aggrSentiment: -0.214,
    //       positive: {
    //         'share': 2,
    //         'favorite': 5
    //       },
    //       negative: {
    //         'gray': 1,
    //         'bad': 3,
    //         'nice': 4
    //       }
    //     },
    //     '1': {
    //       numTweets: 18,
    //       aggrSentiment: 0.014,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 4,
    //         'cold': 3
    //       }
    //     },
    //     '2': {
    //       numTweets: 18,
    //       aggrSentiment: 0.214,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '3': {
    //       numTweets: 18,
    //       aggrSentiment: 0.214,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '7': {
    //       numTweets: 18,
    //       aggrSentiment: -0.1214,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3
    //       }
    //     },
    //     '5': {
    //       numTweets: 20,
    //       aggrSentiment: 0.46,
    //       positive: {
    //         'bright': 2,
    //         'puppy': 5
    //       },
    //       negative: {
    //         'death': 1,
    //         'cold': 3,
    //         'bad': 5
    //       }
    //     }
    //   }
    // }

    if (!isConnected()) {
        callback("data store is not connected", null);
        return;
    }

    const start = new Date(startDay)
    start.setHours(0)
    start.setMinutes(0)
    start.setSeconds(0)
    start.setMilliseconds(0)

    const end = new Date(endDay)
    end.setHours(23)
    end.setMinutes(59)
    end.setSeconds(59)
    end.setMilliseconds(999)


    console.log(start)
    console.log(end)
    console.log('sentiment_' + term)

    var query = db
        .createQuery('sentiment_' + term)
        //.autoPaginate(false)
      //  .filter('term', '=', term)
        .filter('date', '>', new Date(start))
        .filter('date', '<', new Date(end))
        .order('date')
        // .limit(500);
    db.runQuery(query, function(err, res) {

      if (err) {
        callback(err)
        console.log(JSON.stringify(err, null, 2))
      }
      else {
        callback(null, res.map((r) => r.data))
      }

    });


  }
}




// datastore.connect(config.get('gcloud'), () => {
//   datastore.getEntities(null, null, null, function(err, res) {
//       console.log(err)
//       console.log(res)
//   })
// })

module.exports = datastore;
