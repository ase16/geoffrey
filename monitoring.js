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
    pageSize: 100,
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
    * get the CPU Usage Time Series for multiple instances of an instance group between a start- and end-time
    * @param {Date} startTime
    * @param {Date} endTime
    * @param {requestCallback} callback - a function to be called when the server
    *      responds to the request
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

              if (dataPointsPerInstance.hasOwnProperty(instanceName)) {
                dataPointsPerInstance[instanceName] =
                    dataPointsPerInstance[instanceName].concat(points)

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
    }
 }

module.exports = Monitoring;
