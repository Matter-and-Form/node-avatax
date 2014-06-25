"use strict";

var https = require('https');
var url = require('url');

var latestAPIVersion = "1.0";

/*
===========
Constructor
===========
*/

function AvaTax(username, password, options) {

	if (!username || typeof username !== "string" || !password || typeof password !== "string") {
		throw new Error("Credentials not supplied for AvaTax");
	}

	this.username = username;
	this.password = password;

	options = options || {};
	options.development = options.development || false;//Development or Production
	options.version = options.version || latestAPIVersion;
	
	if (options.version > latestAPIVersion) {
		throw new Error("This library does not support an API version greater than `" + latestAPIVersion + "`. Contact this module's author to allow for newer versions.");
	}

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

AvaTax.prototype._makeRequest = function(requestOptions, requestBody, next) {

	var responseBody = "";

	var req = https.request(requestOptions, function(res) {

		res.setEncoding('utf-8');
		res.on('data', function(chunk) {
			responseBody += chunk;
		});

		res.on('end', function() {

			var json = JSON.parse(responseBody);

			if (res.statusCode === 500) {
				var errorText = json.Messages.Summary ? json.Messages.Summary : "AvaTax server error";
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
Validate Address
========
*/

AvaTax.prototype._validateAddress = function(options, next) {

	options = options || {};
	var requestBody = "";

	//var requestBody = AvaTax.prototype._newRequestBody.call(this, requestBodyOptions);

	var addressObject = {
		Line1: options.Line1,
		Line2: options.Line2,
		Line3: options.Line3,
		City: options.City,
		Region: options.Region,
		Country: options.Country,
		PostalCode: options.PostalCode
	};

	if (!(typeof addressObject.Line1 != "undefined" && typeof addressObject.PostalCode != "undefined") || !(typeof addressObject.Line1 != "undefined" && typeof addressObject.City != "undefined" && typeof addressObject.Region != "undefined")) {
		throw new Error("You must specify at least Line & Postal Code, or Line & City & Region");
	}

	var requestOptions = this.requestOptions();
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/address/validate',
		query: addressObject
	});

	this._makeRequest(requestOptions, requestBody, function(err, json) {
		if (err) {
			return next(err);
		}

		return next(null, json);
	});

};

AvaTax.prototype.validateAddress = function(address, next) {
	if (!next) {//if typeof options is a function?
		next = address;
		address = {};
	}

	return AvaTax.prototype._validateAddress.call(this, address, next);
};


/*
========
Tax
========
*/

AvaTax.prototype._estimateTax = function(options, next) {

	options = options || {};

	var requestBody = "";
	//requestBody = AvaTax.prototype._newRequestBody.call(this, requestBodyOptions);

	var requestOptions = this.requestOptions();
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/tax/' + options.latitude + "," + options.longitude + 
		"/get",
		query: {
			saleamount: options.amount
		}
	});
	
	//requestOptions.method = "POST";

	this._makeRequest(requestOptions, requestBody, function(err, json) {
		if (err) {
			return next(err);
		}

		return next(null, json);
	});

};

AvaTax.prototype.estimateTax = function(coordinates, amount, next) {
	
	var options = {
		latitude: coordinates[0],
		longitude: coordinates[1],
		amount: amount
	};

	return AvaTax.prototype._estimateTax.call(this, options, next);
};

AvaTax.prototype._getTax = function(options, next) {

	options = options || {};

	var requestBody = "";
	//requestBody = AvaTax.prototype._newRequestBody.call(this, requestBodyOptions);

	var requestOptions = this.requestOptions();
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/tax/' + options.latitude + "," + options.longitude + 
		"/get",
		query: {
			saleamount: options.amount
		}
	});
	
	//requestOptions.method = "POST";

	this._makeRequest(requestOptions, requestBody, function(err, json) {
		if (err) {
			return next(err);
		}

		return next(null, json);
	});

};

AvaTax.prototype.getTax = function(fields, next) {
	
	var options = {
		CustomerCode: fields.CustomerCode,
		DocDate: fields.DocDate || new Date(),
		CompanyCode: fields.CompanyCode,
		Commit: typeof fields.Commit != "undefined"? fields.Commit : false,
		CurrencyCode: fields.CurrencyCode || "USD",
		CustomerUsageType: fields.CustomerUsageType,
		Discount: fields.Discount,
		DocCode: fields.DocCode,
		PurchaseOrderNo: fields.PurchaseOrderNo,
		ExemptionNo: fields.ExemptionNo,
		DetailLevel: fields.DetailLevel,
		DocType: fields.DocType,
		Lines: fields.Lines,
		Addresses: fields.Addresses,
		ReferenceCode: fields.ReferenceCode,
		PosLaneCode: fields.PosLaneCode,
		Client: fields.Client || "node-avatax",
		TaxOverride: fields.TaxOverride,
		BusinessIdentificationNo: fields.BusinessIdentificationNo
	};

	return AvaTax.prototype._estimateTax.call(this, options, next);
};

module.exports = AvaTax;