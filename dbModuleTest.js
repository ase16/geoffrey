

// NOT REALLY A TEST, but sort of ;)

"use strict";


const db = require('./dbModule.js');

db.connect(function(){
  db.insertTerm('clinton', 'roy')
  db.insertTerm('clinton', 'therry')
  db.insertTerm('sanders', 'roy')
  db.insertTerm('shaqiri', 'thom')
  // this insert will be ignored, since 'thom' has already subscribed to 'shaqiri'
  db.insertTerm('shaqiri', 'thom', function(){
    db.removeTerm('clinton', 'roy', function() {
      console.log('roy unsubscribed from clinton, but the term clinton is still in use (for therry)');
      db.getAllTerms(function(err, res) {
        console.log('get all terms result:')
        console.log(res)
        db.test('sdfds');
        db.test('blasd');
      });
    })
  })
});


// TODO do we share one instance or multiple instances?
