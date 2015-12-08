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

	if (typeof username !== "string" || typeof password !== "string") {
		throw new Error("Credentials not supplied for AvaTax");
	}

	this.username = username;
	this.password = password;

	options = options || {};
	//Development or Production
	options.development = options.development || false;
	options.version = options.version || latestAPIVersion;
	options.client = options.client !== undefined ? options.client : "node-avatax";
	options.client = options.client === false ? undefined : options.client;

	if (options.version > latestAPIVersion) {
		console.warn("This library does not support an API version greater than `" + latestAPIVersion + "`. Contact this module's author to allow for newer versions.");
	}

	var authenticationHeader = "Basic " + new Buffer([this.username, this.password].join(":"), 'utf8').toString('base64');

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
		//allow overriding of host completely
		requestOptions.host = options.host || requestOptions.host;
		
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

AvaTax.prototype._makeRequest = function(requestOptions, requestBody, next) {

	var responseBody = "";

	var req = https.request(requestOptions, function(res) {

		res.setEncoding('utf-8');
		
		res.on('data', function(chunk) {
			responseBody += chunk;
		});

		res.on('end', function() {

			var errorText = "AvaTax server error";
			var err;

			var json = null;

			try {
				json = JSON.parse(responseBody);
			} catch (e) {}

			if (res.statusCode >= 400) {

				if (
					json &&
					json.Messages &&
					json.Messages.length &&
					json.Messages[0].Summary
				) {
					errorText = json.Messages[0].Summary;
				}

				err = new Error(errorText);
				err.code = res.statusCode;
			}

			next(err, json);
		});
	});

	req.on('error', next);

	req.write(requestBody);
	req.end();
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

	Object.keys(options).filter(function(key) {
		return addressFields.indexOf(key) !== -1;
	}).forEach(function(key) {
		addressObject[key] = options[key];
	});

	if (!(
			addressObject.Line1 !== undefined &&
			addressObject.PostalCode !== undefined
		) &&
		!(
			addressObject.Line1 !== undefined &&
			addressObject.City !== undefined &&
			addressObject.Region !== undefined
		)
	) {
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

		if (json.ResultCode === "Error") {
			return next(new Error(json.Messages[0].Summary));
		}

		if (json.ResultCode === "Success") {
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

	var requestOptions = this.requestOptions();
	
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/tax/' + options.latitude + "," + options.longitude + "/get",
		query: {
			saleamount: options.amount
		}
	});

	this._makeRequest(requestOptions, requestBody, next);
};

AvaTax.prototype.estimateTax = function(latitude, longitude, amount, next) {
	
	if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(amount)) {
		throw new Error("Invalid arguments for `estimateTax`");
	}

	var options = {
		latitude: latitude,
		longitude: longitude,
		amount: amount
	};

	return AvaTax.prototype._estimateTax.call(this, options, next);
};

AvaTax.prototype._getTax = function(options, next) {

	options = options || {};

	var requestBody = JSON.stringify(options, null, '\t');
	var requestOptions = this.requestOptions();
	
	requestOptions.path = url.format({
		pathname: "/" + this.options.version + '/tax/get'
	});
	
	requestOptions.method = "POST";

	this._makeRequest(requestOptions, requestBody, next);
};

AvaTax.prototype.getTax = function(fields, next) {
	
	fields = fields || {};

	var options = {
		CustomerCode: fields.CustomerCode,
		DocDate: fields.DocDate || new Date(),
		CompanyCode: fields.CompanyCode,
		Commit: fields.Commit !== undefined ? fields.Commit : false,
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
		Client: fields.Client !== undefined ? fields.Client : this.options.client,
		TaxOverride: fields.TaxOverride,
		BusinessIdentificationNo: fields.BusinessIdentificationNo
	};
	
	var docDateYear = options.DocDate.getFullYear();
	var docDateMonth = options.DocDate.getMonth() + 1;
	var docDateDate = options.DocDate.getDate();

	options.DocDate = [
		docDateYear,
		docDateMonth < 10 ? "0" + docDateMonth : docDateMonth,
		docDateDate < 10 ? "0" + docDateDate : docDateDate
	].join("-");

	if (
		options.CustomerCode === undefined ||
		options.Lines === undefined ||
		!Array.isArray(options.Lines) ||
		!options.Lines.length ||
		options.Addresses === undefined ||
		!Array.isArray(options.Addresses) ||
		!options.Addresses.length
	) {
		return next(new Error("Missing required fields"));
	}
	
	var err = null;
	
	options.Lines.some(function(line, index) {
		if (
			line.LineNo === undefined ||
			line.DestinationCode === undefined ||
			line.OriginCode === undefined ||
			line.Qty === undefined ||
			line.Amount === undefined
		) {
			err = new Error("Line indexOf#" + index + " is missing required fields");
			return err;
		}
	});
	
	if (err) {
		return next(err);
	}
	
	options.Addresses.some(function(address, index) {
		if (
			address.AddressCode === undefined ||
			(
				(
					(address.Line1 === undefined || address.City === undefined) ||
					(address.Line1 === undefined || address.PostalCode === undefined)
				) &&
				(
					address.Latitude === undefined ||
					address.Longitude === undefined
				)
			)
		) {
			return next(new Error("Address indexOf#" + index + " is missing required fields"));
		}
	});

	return AvaTax.prototype._getTax.call(this, options, next);
};

module.exports = AvaTax;
