// Dependencies for 3rd-Party modules (do not forget to npm install them)
var twit = require('twit');					// https://github.com/ttezel/twit	(Twitter API Client for node. Supports both the REST and Streaming API of Twitter)
var sentiment = require('sentiment');		// https://github.com/thisandagain/sentiment
var moment = require('moment');				// http://momentjs.com/				(used to ease handling with dates and timezones)

// Dependency to make settings of the config files available
var config = require('config');				// https://github.com/lorenwest/node-config

// At the moment the viz module has just one public function
var viz = {
	fetchTweets: function(searchParam, callback) {

		function performSentimentAnalysis(tweets) {
			const sentiments = [];
			tweets.forEach( (tweet) => {
				const text = tweet['text'].replace('#', '');
				const senti = sentiment(text);
				senti.tweet = tweet;
				sentiments.push(senti);
			});

			return sentiments;
		}

		// Establish the twitter config (grab your keys at dev.twitter.com)
		var twitterCredentials = config.get('twitter');
		var twitter = new twit(twitterCredentials);

		var pastDate = moment().subtract(3, 'day').format("YYYY-M-D");
		var searchQuery = '' + searchParam + ' since:' + pastDate;

		twitter.get('search/tweets', {q: searchQuery, count:200}, function(err, data) {
			var sentiments = performSentimentAnalysis(data['statuses']);
			callback(err, sentiments);
		});
	}
};

module.exports = viz;
