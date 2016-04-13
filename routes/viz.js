// Dependencies for 3rd-Party modules (do not forget to npm install them)
var express = require('express');
var twit = require('twit');					// https://github.com/ttezel/twit	(Twitter API Client for node. Supports both the REST and Streaming API of Twitter)
var sentiment = require('sentiment');		// https://github.com/thisandagain/sentiment
var async = require('async');				// https://github.com/caolan/async	(powerful functions for working with asynchronous JavaScript)
var moment = require('moment');				// http://momentjs.com/				(used to ease handling with dates and timezones)

// Dependency to make settings of the config files available
var config = require('config');				// https://github.com/lorenwest/node-config

var router = express.Router();				// http://expressjs.com/en/guide/using-middleware.html#middleware.router

// Handle get requests for the main screen
router.get('/*', function(req, res, next) {
	res.render('company/viz', { title: 'Tutorial Twitter Sentiment' });
});

// Handle post requests when user clicked on search-button
router.post('/tweets', function(req, res, next) {

	// Grab the request from the client (use 'console.log("choices = ", choices);' to output the user-input)
	var term = req.body.term

	// Establish the twitter config (grab your keys at dev.twitter.com)
	var twitterCredentials = config.get('twitter');
	var twitter = new twit(twitterCredentials);

	// Create a named function that is inkoved further below by the async.parallel
	var processChoice = function(searchParam, callback) {
		var pastDate = moment().subtract(3, 'day').format("YYYY-M-D");
		var searchQuery = '' + searchParam + ' since:' + pastDate;

		twitter.get('search/tweets', {q: searchQuery, count:200}, function(err, data) {
			var sentiments = performAnalysis(data['statuses']);
			callback(err, sentiments);
		});
	};

	processChoice(term, (err, sentiments) => res.json(sentiments))

});

function performAnalysis(tweets) {

	const sentiments = [];
	tweets.forEach( (tweet) => {
		const text = tweet['text']
				.replace('#', '')

		const senti = sentiment(text)
		senti.tweet = tweet
		sentiments.push(senti)
	})

	return sentiments
}

module.exports = router;
