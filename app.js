"use strict";

// NodeJS core modules
const http = require('http');											// --> https://nodejs.org/api/http.html
var path = require('path');												// This module contains utilities for handling and transforming file paths --> https://nodejs.org/dist/latest-v5.x/docs/api/path.html

// Third-party modules
require('dotenv').config({path: '.env.stormpath'});						// Automatically reads in .env files and sets environment variables --> https://github.com/motdotla/dotenv#usage
require('dotenv').config({path: '.env.gce'});							// Automatically reads in .env files and sets environment variables --> https://github.com/motdotla/dotenv#usage
var express = require('express');
var expressStormpath = require('express-stormpath');					// Our "Tenant" for Stormpath is "majestic-panther" --> https://api.stormpath.com/login
const config = require('config');


// Express modules
var bodyParser = require('body-parser');								// --> https://github.com/expressjs/body-parser

// Custom modules
const socketHandler = require('./sockethandler.js');					// socket handler
const datastore = require('./datastore.js');							// handles google data store stuff

// Routes & Route configurations
var stormpath = require('./routes/stormpath');
var authentication = require('./routes/authentication');
var admin = require('./routes/admin');
var company = require('./routes/company');
var carlton = require('./routes/carlton');
var dev = require('./routes/dev');

// Create express application
const app = express();													// --> http://expressjs.com/en/4x/api.html#app
const server = http.createServer(app);									// store the server in a variable to pass it later on to socket.io

// Before any middleware, we define the proxy routes to carlton, so body-parser etc. do not mess up the proxy --> // https://cloudant.com/blog/cors-and-reverse-proxies-in-node-js-express/
app.use('/carlton', carlton);

// Set up view/template engine and make static files accessible
app.set('view engine', 'jade');											// Specify which template-engine to use (we do not need to "require" it since it is handled via ExpressJS)
app.set('views', path.join(__dirname, 'views/material_design'));		// Specify where the templates can be found ("__dirname" returns absolute path of current file)
app.use(bodyParser.json());												// --> https://github.com/expressjs/body-parser#bodyparserjsonoptions
app.use(bodyParser.urlencoded({ extended: false }));					// --> https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
app.use(express.static(path.join(__dirname, 'public')));				// --> http://expressjs.com/en/starter/static-files.html
app.use(express.static(path.join(__dirname, 'node_modules')));

// Must be defined as the last middleware, but before our routes
app.use(expressStormpath.init(app, stormpath));							// --> http://docs.stormpath.com/nodejs/express/latest/configuration.html#initialize-express-stormpath

// Routes
app.use('/', authentication);
app.use('/admin', admin);
app.use('/company', company);
app.use('/dev', dev);




// Our server can start listening as soon as the Stormpath SDK has been initialized
app.on('stormpath.ready', function() {
	server.listen(3000, function () {
		console.log('Geoffrey is listening on port 3000');
		datastore.connect(config.get('gcloud'), () => { console.log("datastore is connected"); });

		// start listening for socket connection attempts 
		socketHandler.init(server);
		// start fetching cpu metrics from the google api
		socketHandler.startFetchingCpuMetrics();
		// start fetching jazz stats ( tweets/sec ) from the datastore
		socketHandler.startFetchingJazzStats();
		// start fetching will stats ( batch size ) from the datastore
		socketHandler.startFetchingWillStats();
		// this starts updating the clients via open sockets
		socketHandler.startUpdatingClients();

		console.log('Geoffrey is ready, including socket handler')
	});
});
