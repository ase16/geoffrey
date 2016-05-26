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

      let dataPointsPerInstance = {}
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

              // check if a series for a specific instance has already been added to the output object
              if (dataPointsPerInstance.hasOwnProperty(instanceName)) {

                // if yes, check if it belongs to the front or the back of the array depending on its startTime
                if (new Date(points[0].interval.startTime) >
                    new Date(dataPointsPerInstance[instanceName][0].interval.startTime)) {

                  dataPointsPerInstance[instanceName] =
                      points.concat(dataPointsPerInstance[instanceName])
                } else {
                  dataPointsPerInstance[instanceName] =
                      dataPointsPerInstance[instanceName].concat(points)
                }

              } else {
                dataPointsPerInstance[instanceName] = points

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
            if (!err) callback(null, dataPointsPerInstance)
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
