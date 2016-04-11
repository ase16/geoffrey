var config = require('config');

var Log = require('winston');
Log.level = config.get('log.level');

//var MongoClient = require('mongodb').MongoClient;
//var ObjectId = require('mongodb').ObjectID;
const db = require('./dbModule.js');

var twit = require('twit');


// Useful links for the Twitter API:
// Tweet JSON: https://dev.twitter.com/overview/api/tweets
// Stream API: https://dev.twitter.com/streaming/overview

// tweets in db
var stats = {
    timestamp: 0,
    numberOfTweets: 0
};

// returns a list of keywords
function getKeywords() {
    // TODO: fetch list of keywords from the database.
    // TODO: allow adding new keywords on the fly, (e.g. onNewKeywordAdded -> need to set up stream again for that)

    var fs = require('fs');
    var keywords = fs.readFileSync('keywords.txt').toString().split('\n');
    keywords = keywords.filter(function(k){return k.length>1});
    keywords = keywords.map(function(k){return k.toLowerCase()});
    return keywords;
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
function subscribeToTweets(onNewTweet) {
    var keywords = getKeywords();
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
    return stream;
};

// prints some statistics about the tweets in the DB and the received tweets.
function logStats(db) {
    db.countTweets(function(err, count) {
        if (!err) {
            var now = new Date().getTime();
            var newTweets = count-stats['numberOfTweets'];
            var timeSpan = now-stats['timestamp'];
            var tweetspersec = (newTweets/timeSpan*1000).toFixed(1);
            stats = {
                'timestamp': now,
                'numberOfTweets': count
            };
            Log.info('%d tweets in database, currently fetching %s tweets/second.', count, tweetspersec);
        }
    });
};

// sets up the tweets collection and logging stats
function onDbConnected() {
    db.createTweetsCollection(function(err) {
        // log number of tweets in the db from time to time.
        db.countTweets(function(err, count) {
            stats = {
                timestamp: new Date().getTime(),
                numberOfTweets: count
            };
        });
        setInterval(logStats, 10*1000, db);
    });
};


db.connect(onDbConnected);

var twitterCredentials = config.get('twitter');
var twitter = new twit(twitterCredentials);
var stream = subscribeToTweets(onNewTweet);
