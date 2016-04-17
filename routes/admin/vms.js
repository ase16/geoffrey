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
				// cloud.listInstances(function(err, res) {
				cloud.listWorkerInstances(function(err, res) {
					if (!err) {
						// return callback(null, res.items);
						return callback(null, res.managedInstances);
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
	},
	
	resize: function(req, callback) {
		var newSizeOfInstanceGroup = req.body.newSizeOfInstanceGroup;
		var cgeConfig = config.get("gcloud");
		var cloud = require('./../../cloud.js')(cgeConfig, function(err) {
			cloud.initInstanceTemplates(function() {
				console.log("Instance templates initialized.");
				cloud.initInstanceGroups(function() {
					console.log("Instance groups initialized.");

					cloud.resizeWorkerGroup(newSizeOfInstanceGroup, function(err, res) {
						if (!err) {
							return callback(null, res);
						}
						else {
							return callback(err);
						}
					});
				});
			});
		});
	}
};

module.exports = vms;
