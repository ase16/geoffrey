'use strict';






//!!!!!!!!!!!!! UNDER CONSTRUCTION !!!!!!!!!!!!!!




// that being said:
// if you try "node monitoring.js" you will already see the cpu usage of the last hour (of the master node "geoffrey")
// I will continue working on this stuff this weekend. Andreas, if you want to work on it in the mean time - feel free to do so.


// original code from: https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/master/monitoring/list_resources.js
// API: https://cloud.google.com/monitoring/api/ref_v3/rest/

const google = require('googleapis');
const async = require('async'); // not used atm
const config = require('config');
const gceConfig = config.get("gcloud");
const projectName = 'projects/' + gceConfig.projectId;

// this is stolen from app.js, will be removed once i stop testing this file
require('dotenv').config({path: '.env.gce'});							// Automatically reads in .env files and sets environment variables --> https://github.com/motdotla/dotenv#usage


var monitoringScopes = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/monitoring',
  'https://www.googleapis.com/auth/monitoring.read',
  'https://www.googleapis.com/auth/monitoring.write'
];

var METRIC = 'compute.googleapis.com/instance/cpu/usage_time';

/**
 * Returns an hour ago in RFC33339 format.
 */
function getStartTime() {
  var d = new Date();
  d.setHours(d.getHours() - 1);
  // d.setMinutes(d.getMinutes() - 5);
  return JSON.parse(JSON.stringify(d).replace('Z', '000Z'));
}

/**
 * Returns now in RFC33339 format.
 */
function getEndTime() {
  var d = new Date();
  // d.setHours(d.getHours() - 1);
  return JSON.parse(JSON.stringify(d).replace('Z', '000Z'));
}

var ListResources = {

  /**
   * This Lists all the resources available to be monitored in the API.
   *
   * @param {googleAuthClient} authClient - The authenticated Google api client
   * @param {String} projectId - the project id
   * @param {requestCallback} callback - a function to be called when the server
   *     responds with the list of monitored resource descriptors
   */
/*  listMonitoredResourceDescriptors: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    monitoring.projects.monitoredResourceDescriptors.list({
      auth: authClient,
      name: projectId,
      pageSize: 3
    }, function (err, monitoredResources) {
      if (err) {
        return callback(err);
      }

      //console.log('Monitored resources', monitoredResources);
      callback(null, monitoredResources);
    });
  },
*/
  /**
   * This Lists the metric descriptors that start with our METRIC name, in this
   * case the CPU usage time.
   * @param {googleAuthClient} authClient - The authenticated Google api client
   * @param {String} projectId - the project id
   * @param {requestCallback} callback - a function to be called when the server
   *     responds with the list of monitored resource descriptors
   */

   /*
  listMetricDescriptors: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    monitoring.projects.metricDescriptors.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC + '"',
      pageSize: 3,
      name: projectId
    }, function (err, metricDescriptors) {
      if (err) {
        return callback(err);
      }

      //console.log('Metric descriptors', metricDescriptors);
      callback(null, metricDescriptors);
    });
  },
*/
  /**
   * This Lists all the timeseries created between START_TIME and END_TIME
   * for our METRIC.
   * @param {googleAuthClient} authClient - The authenticated Google api client
   * @param {String} projectId - the project id
   * @param {requestCallback} callback - a function to be called when the server
   *     responds with the list of monitored resource descriptors
   */
  listTimeseries: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC + '" AND metric.label.instance_name="geoffrey"',
      pageSize: 70,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }

      //console.log('Time series', timeSeries);
      callback(null, timeSeries);
    });
  },

  getMonitoringClient: function (callback) {
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
};


// getting the metrics of the cpu usage

ListResources.getMonitoringClient(function (err, authClient) {
  if (err) {
    console.log(err)
  }

  ListResources.listTimeseries(authClient,projectName, function(err, ts) {
    console.log(JSON.stringify(ts, null, 2))
  })
});
