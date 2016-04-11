var config = require('config');
var assert = require('assert');

var Log = require('winston');
Log.level = config.get('log.level');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var twit = require('twit');


// Useful links:
// Tweet JSON: https://dev.twitter.com/overview/api/tweets
// Stream API: https://dev.twitter.com/streaming/overview

var mongodb;

var stats = {timestamp: 0, numberoftweets: 0};

// returns the mongodb connection string
var mongodbUrl = function() {
    return 'mongodb://' +
        config.get('mongodb.host') +
        ':' + config.get('mongodb.port') +
        '/' + config.get('mongodb.dbname');
};

// connects to the mongodb
var dbConnect = function(url, connected) {
    MongoClient.connect(url, function(err, database) {
        if (err) {
            Log.error('DB: Could not connect to mongodb server: %s', url, err);
            process.exit(1);
        } else {
            Log.info('DB: Connected correctly to mongodb server: %s', url);
            mongodb = database;
            connected();
        }
    });
};

// closes the mongodb connection
var dbClose = function(db) {
    db.close();
    Log.info('DB: closed connection.')
};

// returns a list of keywords
function getKeywords() {
    // TODO: fetch list of keywords from the database.
    // TODO: allow adding new keywords on the fly, (e.g. onNewKeywordAdded -> need to set up stream again for that)

    var fs = require('fs');
    var keywords = fs.readFileSync('keywords.txt').toString().split('\n');
    keywords = keywords.filter(function(k){return k.length>1});
    return keywords;
};

// adds a tweet to the mongodb collection
function insertTweet(db, tweet, callback) {
    tweet['analyzed'] = false;      // set to true if this tweet was analyzed successfully.
    tweet['inProgress'] = false;    // set to true if this tweet is being processed right now.
    //console.log(tweet);
    db.collection('tweets').insertOne(tweet, callback);
};

// processes incoming tweet
function onNewTweet(tweet) {
    Log.debug('New Tweet:\t[id: %s, text: %s]', tweet['id_str'], tweet['text']);
    //console.log(tweet);

    insertTweet(mongodb, tweet, function (err, result) {
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

function logStats(db) {
    db.collection('tweets').count(function(err, count) {
        if (!err) {
            var now = new Date().getTime();
            tweetspersec = ((count-stats['numberoftweets'])/(now-stats['timestamp'])*1000).toFixed(1);
            stats = {'timestamp': now, 'numberoftweets': count};
            Log.info('%d tweets in database, currently fetching %s tweets/second.', count, tweetspersec);
        }
    });
};

function onDbConnected() {
    // create collection for tweets and some indexes
    mongodb.createCollection('tweets', function(err, tweets) {
        var indexCreated = function(err, indexName) {
            if (!err) {
                Log.info('Index created: %s', indexName)
            } else {
                Log.error('Could not create index: %s', err);
            }
        };

        // id_str is the unique key of twitter.
        tweets.createIndex({'id_str': 1}, {unique:true, sparse: true}, indexCreated);

        // add indexes for finding tweets not yet analyzed/processed
        tweets.createIndex({'inProgress': 1, 'analyzed': 1}, {'sparse': true}, indexCreated);
        tweets.createIndex({'analyzed': 1}, {sparse: true}, indexCreated);
        tweets.createIndex({'inProgress': 1}, {sparse: true}, indexCreated);

        // text index on the tweets
        tweets.createIndex({'text': 'text'}, {}, indexCreated);

    });

    // log number of tweets in the collection
    mongodb.collection('tweets').count(function(err, count) {
        stats = {timestamp: new Date().getTime(), numberoftweets: count};
    });
    setInterval(logStats, 10*1000, mongodb);

};

var dbUrl = mongodbUrl();
dbConnect(dbUrl, onDbConnected);


var twitterCredentials = config.get('credentials.twitter');
var twitter = new twit(twitterCredentials);
var stream = subscribeToTweets(onNewTweet);


