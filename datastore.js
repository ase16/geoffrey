'use strict';

const gcloud = require('gcloud');
const config = require('config');

// let stats = config.get("stats");
// let JAZZ_STATS_PER_REQUEST = stats.jazzStatsPerRequest;
// let WILL_STATS_PER_REQUEST = stats.willStatsPerRequest;

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

    var query = db
        .createQuery('sentiment_' + term)
        //.autoPaginate(false)
      //  .filter('term', '=', term)
        .filter('date', '>=', new Date(start))
        .filter('date', '<=', new Date(end))
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
  },

	// @param callback fn(err, res)
	// --> res is an array containing jazz-stat objects (created, tweetsPerSec)
	getJazzStats: function(callback) {
		if (!isConnected()) {
			return callback("Datastore is not connected", []);
		}

    let oneHourAgo = new Date()
    oneHourAgo.setMinutes( oneHourAgo.getMinutes() - 60)

		var query = db
			.createQuery('JazzStat')
			.autoPaginate(false)
      .filter('created', '>', oneHourAgo.getTime())
			.order('created')
			// .limit(JAZZ_STATS_PER_REQUEST);				// --> https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.32.0/datastore?method=createQuery
		db.runQuery(query, function(err, res) {
			if (err) {
				callback(err);
				console.log(JSON.stringify(err, null, 2));
			}
			else {
				callback(null, res.map((r) => r.data));
			}
		});												// --> https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.32.0/datastore?method=runQuery
	},

	// @param callback fn(err, res)
	// --> res is an array containing will-stat objects (batchSize, created)
	getWillStats: function(callback) {
		if (!isConnected()) {
			return callback("Datastore is not connected", []);
		}

    let oneHourAgo = new Date()
    oneHourAgo.setMinutes( oneHourAgo.getMinutes() - 60)

		var query = db
			.createQuery('WillStat')
			.autoPaginate(false)
      .filter('created', '>', oneHourAgo.getTime())
			.order('created')
			//.limit(WILL_STATS_PER_REQUEST);				// --> https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.32.0/datastore?method=createQuery
		db.runQuery(query, function(err, res) {
			if (err) {
				callback(err);
				console.log(JSON.stringify(err, null, 2));
			}
			else {
				callback(null, res.map((r) => r.data));
			}
		});												// --> https://googlecloudplatform.github.io/gcloud-node/#/docs/v0.32.0/datastore?method=runQuery
	}
};

module.exports = datastore;
