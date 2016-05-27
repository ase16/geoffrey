'use strict';



// API: https://cloud.google.com/monitoring/api/ref_v3/rest/



const google = require('googleapis');
const googleProjectName = 'projects/' + require('config').get("gcloud").projectId;
const monitoringScopes = ['https://www.googleapis.com/auth/cloud-platform'];

/**
* Get an authentication client for google api calls
* @param {requestCallback} callback - a function to be called when the server
*     responds with the list of monitored resource descriptors
*/
const getMonitoringClient = function (callback) {
  google.auth.getApplicationDefault(function (err, authClient) {
    if (err) {
      return callback(err);
    }
    // Depending on the environment that provides the default credentials
    // (e.g. Compute Engine, App Engine), the credentials retrieved may
    // require you to specify the scopes you need explicitly.
    // Check for this case, and inject the Cloud Storage scope if required.
    if (authClient.createScopedRequired &&
      authClient.createScopedRequired()) {
      authClient = authClient.createScoped(monitoringScopes);
    }

    callback(null, authClient);
  });
}


/**
 * This lists all cpu usage timeseries created between START_TIME and END_TIME
 * for all instances of the project
 * @param {googleAuthClient} authClient - The authenticated Google api client
 * @param {Date} startTime - in RFC33339
 * @param {Date} endTime - in RFC33339
 * @param {String} pageToken - the next page token (can be null)
 * @param {requestCallback} callback - a function to be called when the server
 *     responds with the list of monitored resource descriptors
 */
const listCpuTimeseries = function(authClient, startTime, endTime, pageToken, callback) {

  const METRIC = 'compute.googleapis.com/instance/cpu/usage_time';
  const monitoring = google.monitoring('v3');

  monitoring.projects.timeSeries.list({
    auth: authClient,
    filter: 'metric.type="' + METRIC + '"',
    pageSize: 1000,
    'interval.startTime': startTime,
    'interval.endTime': endTime,
    name: googleProjectName,
    pageToken: pageToken
  }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }

      callback(null, timeSeries);
  })
}



/**
 * turn a regular js date object into RFC33339 format
 * @param {Date} d - a date object
 * @return the date object in RFC33339
 */
const toRFC33339 = (d) => JSON.parse(JSON.stringify(new Date(d)).replace('Z', '000Z'))

var Monitoring = {


   /**
    * get the CPU Usage Time Series for multiple instances of an instance
    * group between a start- and end-time
    * @param {Date} startTime
    * @param {Date} endTime
    * @param {requestCallback} callback - a function to be called when
    *      the server responds to the request
    */
    getCpuUsageTimeseries: function(startTime, endTime, callback) {

      const ptsPerInstance = {}
      const output = {}
      const start = toRFC33339(startTime)
      const end = toRFC33339(endTime)


      // inner function which takes care of (maybe required) subsequent calls
      // to the API
      const callAPIUntilNoNextTokensAvailable = function(authClient, nextToken, callback) {

        listCpuTimeseries(authClient, start, end, nextToken, function(err, res) {

          if (err) return callback(err)

          try {

            res.timeSeries.forEach( (serie) => {

              const instanceName = serie.metric.labels.instance_name
              const points = serie.points

              // console.log("")
              // console.log("")
              // console.log("##########POINTS", instanceName)
              // console.log(points)

              // add all timeseries measure points with the same instance name in the same bucket
              if (ptsPerInstance.hasOwnProperty(instanceName)) {
                ptsPerInstance[instanceName].push(points)
              } else {
                ptsPerInstance[instanceName] = []
                ptsPerInstance[instanceName].push(points)
              }
            })

            // for all instance(-names)
            Object.keys(ptsPerInstance).forEach((k) => {

              if (ptsPerInstance[k].length == 1) {
                output[k] = ptsPerInstance[k][0]
              } else {

                // loop as long as we have chunks/time-series available
                while (ptsPerInstance[k].length > 0) {

                  // find the chunk (timeserie-points) with the smalles startTime
                  let smallestSTchunk = []
                  let index; // index of chunk with smallest start date
                  ptsPerInstance[k].forEach((chunk, i) => {

                    if (smallestSTchunk.length == 0 ||
                      new Date(chunk[0].interval.startTime).getTime()
                      < new Date(smallestSTchunk[0].interval.startTime).getTime()) {

                        smallestSTchunk = chunk;
                        index = i;
                      }
                  })

                  // only in the first loop
                  if ( ! output.hasOwnProperty(k)) output[k] = []

                  // console.log("CHUNK:")
                  // console.log(smallestSTchunk)

                  // add to the output by concatinating all chunks together
                  output[k] = output[k].concat(smallestSTchunk.reverse())

                  // console.log("OUTPUT:")
                  // console.log(output[k])

                  // this will make the while loop stop eventually
                  ptsPerInstance[k].splice(index,1)
                }

                output[k] = output[k].reverse()
              }
            })
          }
          catch (err) {
            return callback(err)
          }

          // are there any nextPageTokens left?
          if (res.nextPageToken) {
            // subsequent call with the next page token
            callAPIUntilNoNextTokensAvailable(authClient, res.nextPageToken, callback)
          }
          else {
            // we're done and all data is in the timeSeries array which is
            // defined in the scope of the outer function
            callback(null)
          }
        })
      }

      // authenticate...
      getMonitoringClient(function(err, authClient) {
        if (err) return callback(err)

        else {
          //.. and now start fetching the data from google
          callAPIUntilNoNextTokensAvailable(authClient, null,  function(err) {
            if (!err) callback(null, output)
            else callback(err)
          })
        }
      })
    },


    /**
     * filter the cb respons-obj of the getCpuUsageTimeseries fn above by instance-name
     * (for this task it checks if the nodeType is part of the instance name)
     * @param {TimeSeries} metrics - received from the google api call
     * @param {String} nodeType - e.g. 'Geoffrey'
     * @return only the timeseries that match the nodeType
     */
     filter: function(metrics, nodeType) {

       // we need to clone the object in order to not mutate the argument "metrics"
       var cloned = JSON.parse(JSON.stringify(metrics));

       Object.keys(cloned).forEach((k) => {
         if (k.toLowerCase().indexOf(nodeType) < 0){
          delete cloned[k]
         }
       })
      return cloned
     },

     /**
      * fill up the full hour with 0-values
      * (e.g. when an instance ran for only 20 minutes during the last hour,
      * fill the remaining minutes with 0's)
      * @param {TimeSeries} metrics - received from the google api call
      * @param {Date} startTime
      * @param {Date} endTime
      * @param {Number} padding - to ignore first and last few minutes
      * @return timeseries with at least ( minutes(endTime-startTime) - 2 * padding ) entries
      */
     fillEmptySlots: function(metrics, startTime, endTime, padding) {

       const startTimeWithPadding = new Date(startTime).setMinutes(new Date(startTime).getMinutes() + 5)
       const endTimeWithPadding = new Date(endTime).setMinutes(new Date(endTime).getMinutes() - 5)

       // we need to clone the object in order to not mutate the argument "metrics"
       var cloned = JSON.parse(JSON.stringify(metrics));

       // go through all instance-name timeseries arrays
       Object.keys(cloned).forEach((k) => {

         const protoEmpty = {
           interval: {
             startTime: null,
             endTime: null,
           },
           value: { doubleValue: 0 }
         }

         // fill up the front of the array with empty objects representing the
         // last few minutes until "endTime - padding" (if needed)
         while (new Date(cloned[k][0].interval.startTime) < endTimeWithPadding) {

           const emptyClone = JSON.parse(JSON.stringify(protoEmpty));
           const oldEndTime = new Date(cloned[k][0].interval.endTime)
           const oneMinuteAfter = new Date(oldEndTime).setMinutes(oldEndTime.getMinutes() + 1)
           emptyClone.interval.endTime = oneMinuteAfter
           emptyClone.interval.startTime = oldEndTime

           cloned[k].unshift(emptyClone)
         }

         // fill up the front of the array with empty objects representing the
         // first few minutes from "startTime + padding" (if neededs)
         while (new Date(cloned[k][cloned[k].length -1].interval.endTime) > startTimeWithPadding) {

           const emptyClone = JSON.parse(JSON.stringify(protoEmpty));
           const oldStartTime = new Date(cloned[k][cloned[k].length - 1].interval.startTime)
           const oneMinuteBefore = new Date(oldStartTime).setMinutes(oldStartTime.getMinutes() - 1)
           emptyClone.interval.endTime = oldStartTime
           emptyClone.interval.startTime = oneMinuteBefore

           cloned[k].push(emptyClone)
         }
       })

      return cloned
    },


    /**
     * get the CPU Usage Average of all provided metrics. The value-arrays
     * need to be sorted by date (earliest at the end)!
     * @param {FilteredMetrics} metrics (properties: node-name, value: array of metrics of this node)
     * @param {Date} startTime - the earliest time of all metrices
     * @param {requestCallback} callback - a function to be called when the server
     *      responds to the request
     */
     addAvg: function(metrics, startTime) {

      /**
       * helper function to compare two dates. precision: minutes
       * @param {Date} d1
       * @param {Date} d2
       * @return 1 if d1 > d2, 0 or -1
       */
       function compareDateByMinute(d1, d2) {

         d1 = new Date(d1)
         d2 = new Date(d2)

         // ignore secs and ms for minute precision
         d1.setSeconds(0)
         d1.setMilliseconds(0)
         d2.setSeconds(0)
         d2.setMilliseconds(0)

         if (d1 > d2) return 1
         if (d1.getTime() == d2.getTime()) return 0

         return -1
       }


       // we need to clone the object in order to not mutate the argument "metrics"
       var result = JSON.parse(JSON.stringify(metrics));
       // this is initially the same as the result object
       // but its value-arrays elements will be spliced later in this function
       var consumed = JSON.parse(JSON.stringify(metrics));


       // the current date is 'bigger/later' than what we will compare to
       let earliestDate = new Date()
       let nodeWithEarliestDate = '';

       // the latest date will be close to the endTime (closer to now),
       // therefore latestDate will be 'later/bigger' than the startTime
       let latestDate = new Date(startTime)

       //  find the earliest and latest date
       Object.keys(result).forEach((k) => {

        //  console.log(result[k])

         const ed = result[k][result[k].length-1].interval.startTime;
         const ld = result[k][0].interval.startTime;

         // find earliest
         if (compareDateByMinute(ed, earliestDate) === -1) {
           earliestDate = ed;
           nodeWithEarliestDate = k;
         }
         // find latest
         if (compareDateByMinute(ld, latestDate) === 1) {
           latestDate = ld;
         }
       })

       // go from the earliest date to the latest date and for all timeseries
       // average the cpu usage per minute
       let currentDate = new Date(earliestDate);
       const averageCpuUsage = [] // intermediary result array

       while (compareDateByMinute(currentDate, latestDate) <= 0) {

         let numMatches = 0;
         let sumMatches = 0;

         Object.keys(consumed).forEach((k)=> {

           //check if array is already empty, if yes return
           if (consumed[k].length == 0 ) return;

           const d = consumed[k][consumed[k].length-1].interval.startTime;
           const v = consumed[k][consumed[k].length-1].value.doubleValue;

           if (compareDateByMinute(currentDate, d) === 0 ){
             numMatches++
             sumMatches += v;
             consumed[k].splice(consumed[k].length-1,1) // remove the earliest
           }
         })

         // make a hard copy of the current Date
         const st = new Date(currentDate)
         let et = new Date(currentDate)
         et = new Date(et.setMinutes(et.getMinutes() + 1))
         const value = numMatches === 0 ? 0 : sumMatches / numMatches
         averageCpuUsage.push({
           interval: {
             startTime: st,
             endTime: et
           },
           value: {
             doubleValue: value
           }
         })

         // increase the current date for the next loop
         currentDate.setMinutes(currentDate.getMinutes() + 1)
       }

       result['avg'] = averageCpuUsage.reverse()
       return result
     }
 }


module.exports = Monitoring;
