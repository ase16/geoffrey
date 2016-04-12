/**
 * Created by albrecht on 16.03.16.
 */


var events = require('events');
var eventEmitter = new events.EventEmitter();

var config = require('config');

var Log = require('winston');
Log.level = config.get('log.level');

var MongoClient = require('mongodb').MongoClient;

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

function logStats(db) {
    db.collection('tweets').count({analyzed: true}, function(err, count) {
        if (!err) {
            var now = new Date().getTime();
            tweetspersec = ((count-stats['numberoftweets'])/(now-stats['timestamp'])*1000).toFixed(1);
            stats = {'timestamp': now, 'numberoftweets': count};
            Log.info('%d tweets analyzed, analyzing %s tweets/second.', count, tweetspersec);
        }
    });
}

function doSomeWork(text) {
    var words = text.split(' ').sort();
    words.forEach(function(w) {
        Log.info('\t%s', w);
    });
    return words;
}

function analyzeTweet() {
    mongodb.collection('tweets').findOneAndUpdate(
        {inProgress: false, analyzed: false},
        {$set: {inProgress: true}},
        {projection: {id_str: 1, text: 1}},
        function(err, res) {
            if (!err) {
                if(!res.value) {
                    // got no tweet to analyze - schedule next analysis in a few seconds.
                    Log.info('No more tweets. Schedule nextTweet in a few seconds');
                    setTimeout(nextTweet, 5*1000);
                    // at the moment we exit.
                    process.exit(1);
                } else {
                    Log.info('Got new tweet: %s\t[%s]', res.value['id_str'], res.value['text']);
                    var words = doSomeWork(res.value['text']);

                    mongodb.collection('tweets').updateOne(
                        {_id: res.value['_id']},
                        {$set: {inProgress: false, analyzed: true, words: words}},
                        function(err, res){
                            if (!err) {
                                Log.info('Tweet analyzed.');
                            } else {
                                Log.error('Could not update tweet', err);
                            }
                            nextTweet();
                        });
                }


            } else {
                Log.warn(err);
                nextTweet();
            }
        }
    );
}

function nextTweet() {
    eventEmitter.emit('nextTweet');
}

function onDbConnected() {
    // log number of tweets in the collection
    mongodb.collection('tweets').count({analyzed: true}, function(err, count) {
        stats = {timestamp: new Date().getTime(), numberoftweets: count};
    });
    setInterval(logStats, 10*1000, mongodb);

    eventEmitter.on('nextTweet', analyzeTweet);
    nextTweet();
}

var dbUrl = mongodbUrl();
dbConnect(dbUrl, onDbConnected);
