'use strict'

const datastore = require('./../../datastore.js')



// simple helper function to count the number of days between a start and an end date
// eg. (16.5.2015,16.5.2015) => 1, (14.5.2015,16.5.2015) => 3
const getNumDays = (d1, d2) => new Date(d2).getDay() - new Date(d1).getDay() + 1

// At the moment the viz module has just one public function
var viz = {

	/**
	* load the requested data from the data store and aggregate on hour-precision
	* @param {String} term - a term a user previously set
	* @param {Date} startDate - starting point of the aggregation period (day-precision)
	* @param {Date} endDate - ending point of the aggregation period (day-precision)
	* @param {requestCallback} callback - arguments: error or an array of hourly-aggregated data
	*/
	loadAndAggregate: function(term, startDate, endDate, callback) {

		term = term.trim().toLowerCase()

		// get entities from the google data store
		// an entity is an object created from a single will-node (worker) that
		// stores a subset of all tweets+sentiments for a specific term at a specified day
		datastore.getEntities(term, startDate, endDate, (err, entities) => {

			if (err) {
				callback(err)
				return
			}

			// if there are no entities found in the data store, return an empty array
			if (entities.length == 0) {
				callback(null, [])
				return
			}

			// create an array element for each hour that is between start and end date
			// and fill it with an empty object-prototype
			const hours = new Array(24 * getNumDays(startDate, endDate))

			for (let i = 0; i < hours.length; i++) {
				hours[i] = { numTweets: 0, aggrSentiment: 0, positive: {}, negative: {}, date: {} }
			}


			// remember, an entity represents a day
			entities.forEach((entity, i) => {

				// console.log("ENTITY", i)
				// console.log(entity)

				// combine multiple entities that happend at the same day and
				// save everything in the array at the associated place
				const hrsOffset = (getNumDays(startDate, entity.date) - 1) * 24
				for (let hour of Object.keys(entity.hourBuckets)) {
					// console.log("HOUR", hour)
					hours[hrsOffset + Number.parseInt(hour)] =
							combineEntityHour(hours[hrsOffset + Number.parseInt(hour)],
							entity.hourBuckets[hour])
				}
			})


			// final step: for every hour in the hours array
			// add the date exact date (hour-precision)
			hours.forEach((h, i) => {
				const date = new Date(startDate).setHours(i)
				h.date = new Date(date);
			})

			callback(null, hours)
		})
	}
};

// combine two data objects of the same hours
// (requires specific format, see code above)
const combineEntityHour = function(obj1, obj2) {

	// this function aggregates obj1 and obj2 word-tokens
	// e.g. ({'bad': 5}, {'bad': 2}) -> {'bad': 7}
	const combineTokens = function(prop) {

		const out = {}

		// the proberty is either 'negative' or 'positive'
		if (obj1.hasOwnProperty(prop) && obj1[prop] != null && obj2[prop] != null) {

			for (let key of Object.keys(obj1[prop])) {

				if (obj2[prop].hasOwnProperty(key)) {
					// same property key in obj1 and obj2 found, sum its values
					out[key] = obj1[prop][key] + obj2[prop][key]
					delete obj2[prop][key]
				} else {
					out[key] = obj1[prop][key]
				}
			}
		}

		// this loop adds the leftofter-property keys of obj2
		// to the output object (matched property keys got deleted before (see above))
		if (obj2.hasOwnProperty(prop) && obj2[prop] != null) {
			for (let key of Object.keys(obj2[prop])) {
				out[key] = obj2[prop][key]
			}
		}

		return out
	}



	const numTweets = obj1.numTweets + obj2.numTweets
	let aggrSentiment = 0
	if (numTweets != 0)
		aggrSentiment = obj1.aggrSentiment + obj2.aggrSentiment / numTweets

	// console.log("obj1.numTweets", obj1.numTweets)
	// console.log("obj2.numTweets", obj2.numTweets)
	// console.log("obj1.aggr", obj1.aggrSentiment)
	// console.log("obj2.aggr", obj2.aggrSentiment)
	// console.log("numTweets", numTweets)
	// console.log("aggrSentiment", aggrSentiment)

	const positive = combineTokens('positive')
	const negative = combineTokens('negative')

	return {
		numTweets: numTweets,
		aggrSentiment: aggrSentiment,
		positive: positive,
		negative: negative
	}
}


module.exports = viz;
