"use strict";

var https = require('https');
var url = require('url');

/*
===========
Constructor
===========
*/

function Avalera(username, password, options) {

	if (!username || typeof username !== "string" || !password || typeof password !== "string") {
		throw new Error("Credentials not supplied for Avalera");
	}

	this.username = username;
	this.password = password;

	options = options || {};
	options.development = options.development || false;//Development or Production
	options.version = options.version || "1.0";

	var authenticationHeader = "Basic " + new Buffer([this.username,this.password].join(":"), 'utf8').toString('base64');

	var requestOptions = {
		port: 443,//https
		method: 'GET',
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": authenticationHeader
		}
	};

	requestOptions.host = options.development ? 'development.avalara.net' : 'avatax.avalara.net';
	requestOptions.host = options.host || requestOptions.host;//allow overriding of host completely

	this.requestOptions = function() {
		return requestOptions;
	};
	this.options = options;

	return this;
}


/*
=========
Utilities
=========
*/


function cloneObject(object) {
	var clone = {};
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			clone[key] = object[key];
		}
	}
	return clone;
}

Avalera.prototype._makeRequest = function(requestOptions, requestBody, next) {

	var responseBody = "";

	var req = https.request(requestOptions, function(res) {

		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			responseBody += chunk;
		});

		res.on('end', function() {

			var json = JSON.parse(responseBody);

			if (res.statusCode === 500) {
				var errorText = json.Messages.Summary ? json.Messages.Summary : "Avalera server error";
				var error = new Error(errorText);
				error.message = errorText;
				error.code = 500;
				return next(error);
			}

			next(null, json);
		});
	});

	req.on('error', function(err) {
		console.log('http req error: ' + err.message || err);
		return next(err);
	});

	req.write(requestBody);
	req.end();//end request, proceed to response
};

/*
========
Validate
========
*/

Avalera.prototype._validate = function(options, next) {

	options = options || {};

	//var requestBody = Avalera.prototype._newRequestBody.call(this, requestBodyOptions);


	var addressObject = {
		Line1: options.Line1 || options.line1 || options.street1 || options.street,
		Line2: options.Line2 || options.line2 || options.street2,
		Line3: options.Line3 || options.line3 || options.street3,
		City: options.City || options.city,
		Region: options.Region || options.region || options.province || options.state,
		Country: options.Country || options.country,
		PostalCode: options.PostalCode || options.postalCode || options.zipCode
	};

	if ((typeof options.Line1 != "undefined" && typeof options.PostalCode != "undefined") || (typeof options.Line1 != "undefined" && typeof options.City != "undefined" && typeof options.Region != "undefined")) {
		throw new Error("You must specify at least Line & Postal Code, or Line & City & Region");
	}

	var requestOptions = this.requestOptions();
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/address/validate',
		query: addressObject
	});

	this._makeRequest(requestOptions, "", function(err, json) {
		if (err) {
			return next(err);
		}

		return next(null, json);
	});

};

Avalera.prototype.validate = function(options, next) {
	if (!next) {//if typeof options is a function?
		next = options;
		options = {};
	}

	return Avalera.prototype._validate.call(this, options, next);
};

Avalera.prototype.trackById = function(id, options, next) {

	if (!(id && typeof id === "string" || typeof id === "number")) {//use arguments.length?
		throw new Error("No ID provided.");
	}

	if (!next) {//if typeof options is a function?
		next = options;
		options = {};
	}

	options.id = id;
	options._multiple = false;//return just one;
	return Avalera.prototype._track.call(this, options, next);
};

Avalera.prototype.trackByOrderNumber = function(id, options, next) {

	if (!(id && typeof id === "string" || typeof id === "number")) {
		throw new Error("No ID provided.");
	}

	if (!next) {//if typeof options is a function?
		next = options;
		options = {};
	}

	options.orderNo = id;
	options._multiple = false;//return just one;
	return Avalera.prototype._track.call(this, options, next);
};

module.exports = Avalera;