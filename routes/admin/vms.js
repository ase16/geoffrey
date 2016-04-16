"use strict";

const config = require('config');

// VMs module will be designed like a mini CRUD application (similar to terms module)
var vms = {
	read: function(req, callback) {

		// ToDo: Make sure all necessary params exist and are what they should be
		console.log("GET /admin/vms ==> READ");

		var cgeConfig = config.get("gcloud");
		var cloud = require('./../../cloud.js')(cgeConfig, function(err) {
			if (!err) {
				cloud.listInstances(function(err, res) {
					if (!err) {
						return callback(null, res.items);
					}
					else {
						return callback(err);
					}
				});
			}
			else {
				return callback(err);
			}
		});
	}
};

module.exports = vms;
