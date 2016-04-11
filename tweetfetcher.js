const config = require('config');

const Log = require('winston');
Log.level = config.get('log.level');

const db = require('./dbModule.js');

// Twitter API module
// https://github.com/ttezel/twit
const twit = require('twit');


// Useful links for the Twitter API:
// Tweet JSON: https://dev.twitter.com/overview/api/tweets
// Stream API: https://dev.twitter.com/streaming/overview

// tweets in db and ts when queried.
var stats = {
    timestamp: 0,
    numberOfTweets: 0
};

// @parma callback fn(arr) - get array of keywords
function getKeywords(callback) {
    // TODO: allow adding new keywords on the fly, (e.g. onNewKeywordAdded -> need to set up stream again for that)

    db.getAllTerms(function(err, words) {
        var keywords = [];
        if (!err) {
            keywords = words;
        } else {
            Log.error("Could not retrieve terms from database.", err);
        }

        // fetching tweets given keywords in a file
        /*
        var fs = require('fs');
        var keywordsFile = 'keywords.txt';
        try {
            fs.accessSync(keywordsFile, fs.R_OK);
            keywords = fs.readFileSync(keywordsFile).toString().split('\n');
        } catch (e) {
            Log.error("Cannot access keywords file: " + keywordsFile);
            keywords = [];
        }
        */

        keywords = keywords.filter(function(k){return k.length>1});
        keywords = keywords.map(function(k){return k.toLowerCase()});
        callback(keywords);

    });

};

// processes incoming tweet. The tweet is inserted without
// additional processing into the tweets collection.
function onNewTweet(tweet) {
    Log.debug('New Tweet:\t[id: %s, text: %s]', tweet['id_str'], tweet['text']);
    //console.log(tweet);

    db.insertTweet(tweet, function (err, result) {
        if (err) {
            Log.error('Could not insert tweet:', err);
        } else {
            Log.debug('Inserted tweet into the database.');
        }
    });
};

// set up twitter stream and subscribe to keywords
// @param onNewTweet function to call when new tweet is received
// @param callback fn(stream)
function subscribeToTweets(callback) {
    getKeywords(function(keywords) {
        var stream = twitter.stream('statuses/filter', {
            track: keywords,
            language: 'en'
        });
        stream.on('tweet', onNewTweet);

        // set up some logging
        // the messages are described here:
        // https://dev.twitter.com/streaming/overview/messages-types
        stream.on('connect', function (request) {
            Log.info('Twitter - Connect.');
        });
        stream.on('connected', function (response) {
            Log.info('Twitter - Connected');
        });
        stream.on('disconnect', function (disconnectMessage) {
            Log.warn('Twitter - Disconnect');
        });
        stream.on('reconnect', function (request, response, connectInterval) {
            Log.info('Twitter - Reconnect in %s ms', connectInterval);
        });
        stream.on('limit', function (limitMessage) {
            Log.warn('Twitter - Limit: ', limitMessage);
        });
        stream.on('warning', function (warning) {
            Log.warn('Twitter - Warning: ', warning);
        });

        Log.info('Set up connection to twitter stream API.');
        Log.info('Stream keywords (%s): %s', keywords.length, keywords);

        callback(stream);
    });
};

// prints some statistics about the tweets in the DB and the received tweets.
function logStats(db) {
    db.countTweets(function(err, count) {
        if (!err) {
            var now = new Date().getTime();
            var newTweets = count-stats['numberOfTweets'];
            var timeSpan = now-stats['timestamp'];
            var tweetspersec = (newTweets/timeSpan*1000).toFixed(1);
            if (isNaN(tweetspersec)) { tweetspersec=0 };
            stats = {
                'timestamp': now,
                'numberOfTweets': count
            };
            Log.info('%d tweets in database, currently fetching %s tweets/second.', count, tweetspersec);
        }
    });
};

// sets up the tweets collection and logging stats
function setupTweetsCollection() {
    db.createTweetsCollection(function(err) {
        // log number of tweets in the db from time to time.
        db.countTweets(function(err, count) {
            stats = {
                timestamp: new Date().getTime(),
                numberOfTweets: count
            };
            logStats(db);
        });
        setInterval(logStats, 10*1000, db);
    });
};


var twitterCredentials = config.get('twitter');
var twitter = new twit(twitterCredentials);
var twitterStream;

db.connect(function() {
    setupTweetsCollection();
    subscribeToTweets(function(stream) {
        twitterStream = stream;
    });
});


