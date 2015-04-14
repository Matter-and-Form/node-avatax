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
	options.client = typeof options.client != "undefined"? options.client : "node-avatax";
	options.client = options.client === false ? undefined : options.client;

	if (options.version > latestAPIVersion) {
		throw new Error("This library does not support an API version greater than `" + latestAPIVersion + "`. Contact this module's author to allow for newer versions.");
	}

	var authenticationHeader = "Basic " + new Buffer([this.username,this.password].join(":"), 'utf8').toString('base64');

	this.requestOptions = function() {
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

			var errorText = "AvaTax server error";
			var error;
			if (/^4\d\d/.test(res.statusCode)) {
				error = new Error(errorText);
				error.message = errorText;
				error.code = res.statusCode;
				return next(error);
			}

			var json = JSON.parse(responseBody);

			if (res.statusCode === 500) {
				if (json.Messages && json.Messages.length && json.Messages[0].Summary) {
					errorText = json.Messages[0].Summary;
				}
				error = new Error(errorText);
				error.message = errorText;
				error.code = 500;
				return next(error);
			}

			next(null, json);
		});
	});

	req.on('error', function(err) {
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

	var addressObject = {};
	var addressFields = ["Line1", "Line2", "Line3", "City", "Region", "Country", "PostalCode"];

	for (var key in options) {
		if (addressFields.indexOf(key) !== -1) {
			addressObject[key] = options[key];
		}
	}

	if (!(typeof addressObject.Line1 !== "undefined" && typeof addressObject.PostalCode !== "undefined") && !(typeof addressObject.Line1 !== "undefined" && typeof addressObject.City !== "undefined" && typeof addressObject.Region !== "undefined")) {
		//return an error if both Line+Postal OR Line+City+Region aren't satisfied
		return next(new Error("You must specify at least Line & Postal Code, or Line & City & Region"));
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

		if (json.ResultCode == "Error") {
			var error = new Error(json.Messages[0].Summary);
			return next(error);
		}

		if (json.ResultCode == "Success") {
			return next(null, json.Address);
		}

		return next(null, json);
	});

};

AvaTax.prototype.validateAddress = function(address, next) {
	if (!next) {
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

	return AvaTax.prototype._estimateTax.call(this, options, function(err, json) {
		if (err) {
			return next(err);
		}

		next(null, json.Tax);
	});
};

AvaTax.prototype.estimateTaxDetails = function(coordinates, amount, next) {

	var options = {
		latitude: coordinates[0],
		longitude: coordinates[1],
		amount: amount
	};

	return AvaTax.prototype._estimateTax.call(this, options, function(err, json) {
		if (err) {
			return next(err);
		}

		next(null, json.TaxDetails);
	});
};


AvaTax.prototype._getTax = function(options, next) {

	options = options || {};

	var requestBody = JSON.stringify(options, null, '\t');
	//requestBody = AvaTax.prototype._newRequestBody.call(this, requestBodyOptions);

	var requestOptions = this.requestOptions();
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/tax/get'
	});
	requestOptions.method = "POST";

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
		Client: typeof fields.Client != "undefined"? fields.Client : this.options.client,
		TaxOverride: fields.TaxOverride,
		BusinessIdentificationNo: fields.BusinessIdentificationNo
	};

	options.DocDate = [
		options.DocDate.getFullYear(),
		options.DocDate.getMonth()+1 < 10? "0" + (options.DocDate.getMonth()+1) : (options.DocDate.getMonth()+1),
		options.DocDate.getDate() < 10? "0" + options.DocDate.getDate() : options.DocDate.getDate()
	].join("-");

	if (typeof options.CustomerCode == "undefined" || typeof options.Lines == "undefined" || !Array.isArray(options.Lines) || !options.Lines.length || typeof options.Addresses == "undefined" || !Array.isArray(options.Addresses) || !options.Addresses.length) {
		return next(new Error("Missing required fields"));
	}

	var i = 0;
	for (i = 0; i < options.Lines.length; i++) {
		var line = options.Lines[i];
		if (typeof line.LineNo == "undefined" || typeof line.DestinationCode == "undefined" || typeof line.OriginCode == "undefined" || typeof line.Qty == "undefined" || typeof line.Amount == "undefined") {
			return next(new Error("Line indexOf#" + i + " is missing required fields"));
		}
	}

	for (i = 0; i < options.Addresses.length; i++) {
		var address = options.Addresses[i];
		if (typeof address.AddressCode == "undefined" || (((typeof address.Line1 == "undefined" || typeof address.City == "undefined") || (typeof address.Line1 == "undefined" || typeof address.PostalCode == "undefined")) && (typeof address.Latitude == "undefined" || typeof address.Longitude == "undefined"))) {
			return next(new Error("Address indexOf#" + i + " is missing required fields"));
		}
	}

	return AvaTax.prototype._getTax.call(this, options, next);
};

module.exports = AvaTax;