/* global describe, it */

"use strict";

var assert = require("assert");
var uuid = require('node-uuid');

var authentication = require("./authentication.json");

var AvaTax = require("../");//avatax;

var avatax = new AvaTax(authentication.username, authentication.password, {
	development: authentication.development
});

var maxTimeout = 1e4;//10 seconds
var slowTime = 1e3;//1 second

var address = {
	AddressCode: "destination",
	Line1: "118 N Clark St",
	Line2: "Suite 100",
	Line3: "ATTN Accounts Payable",
	City: "Chicago",
	Region: "IL",
	PostalCode: "60602",
	Country: "US",
	TaxRegionId: 2062953
};

var address2 = {
	AddressCode: "origin",
	Line1: "151 Sterling Rd.",
	Line2: "Studio 2",
	City: "Toronto",
	Region: "Ontario",
	Country: "Canada",
	PostalCode: "M6R 2B2"
};

var address3 = {
	AddressCode: "destination",
	Line1: "1 Infinite Loop",
	Line2: "ATTN Tim Cook",
	City: "Cupertino",
	Region: "CA",
	PostalCode: "95014",
	Country: "US"
};

var address4 = {
	AddressCode: "destination",
	Line1: "1 Churchill Place",
	Line2: "Barclays Bank PLC",
	City: "London",
	PostalCode: "E145HP",
	Country: "GB"
};

var coordinates = [37.331686, -122.030656];

function newGetTaxObject() {

	var id = uuid.v4();

	var object = {
		CustomerCode: "101",
		DocDate: new Date(),
		CompanyCode: "M+F_TEST",
		Commit: false,
		CurrencyCode: "USD",
		DocCode: id,
		PurchaseOrderNo: id,
		DetailLevel: "Tax",
		DocType: "SalesOrder",
		Lines: [
			{
				LineNo: "1",
				DestinationCode: "destination",
				OriginCode: "origin",
				ItemCode: "MFS1V1",
				Qty: 2,
				Amount: 1158.99,
				Discounted: false
			},
			{
				LineNo: "02",
				ItemCode: "SHIPPING",
				Qty: 1,
				Amount: 15,
				OriginCode: "origin",
				DestinationCode: "destination",
				Description: "Shipping Charge",
				TaxCode: "FR"
			}
		],
		Addresses: [address4, address2],
		Client: "node-avatax"
	};

	return object;
}

describe('AvaTax', function() {

	describe("New AvaTax instance", function() {
		it('should throw an error when username and/or passwords are missing', function() {
			assert.throws(function() {
				new AvaTax();
			}, Error);

			assert.throws(function() {
				new AvaTax({
					development: false
				});
			}, Error);

			assert.throws(function() {
				new AvaTax("username");
			}, Error);

			assert.throws(function() {
				new AvaTax("username", {
					development: true
				});
			}, Error);
		});
	});

	describe('#validateAddress()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return a json response', function(done) {
			avatax.validateAddress(address3, function(err, address) {
				assert.equal(err, null);
				assert.ok(address);
				done();
			});
		});

		it('should return a json response when only providing street and postal code', function(done) {
			avatax.validateAddress({
				Line1: address.Line1,
				Line2: address.Line2,
				PostalCode: address.PostalCode
			}, function(err, address) {
				assert.equal(err, null);
				assert.ok(address);
				done();
			});
		});

		it('should return a json response when only providing street, city, province', function(done) {
			avatax.validateAddress({
				Line1: address.Line1,
				Line2: address.Line2,
				City: address.City,
				Region: address.Region
			}, function(err, address) {
				assert.equal(err, null);
				assert.ok(address);
				done();
			});
		});
		
		it('should return an error when an empty address is passed in', function(done) {
			avatax.validateAddress({}, function(err, address) {
				assert.ok(err);
				console.log(err);
				assert.equal(address, null);
				done();
			});
		});
		
		it('should return an error when only Line1 is specified', function(done) {
			avatax.validateAddress({
				Line1: address.Line1
			}, function(err, address) {
				assert.ok(err);
				assert.equal(address, null);
				done();
			});
		});
		
		it('should return an error when only Line1 and City are specified', function(done) {
			avatax.validateAddress({
				Line1: address.Line1,
				City: address.City
			}, function(err, address) {
				assert.ok(err);
				assert.equal(address, null);
				done();
			});
		});
		
		it('should return an error when only Line1 and Region are specified', function(done) {
			avatax.validateAddress({
				Line1: address.Line1,
				Region: address.Region
			}, function(err, address) {
				assert.ok(err);
				assert.equal(address, null);
				done();
			});
		});

	});

	describe('#estimateTax()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return an object for coordinates and an amount', function(done) {
			avatax.estimateTax(coordinates[0], coordinates[1], 310.12, function(err, estimate) {
				assert.equal(err, null);
				assert.ok(estimate);
				assert.equal(typeof estimate.Rate, "number");
				assert.equal(typeof estimate.Tax, "number");
				assert.ok(estimate.TaxDetails);
				done();
			});
		});

		it('should return an object for coordinates and an amount when passed in as strings', function(done) {
			avatax.estimateTax(coordinates[0].toString(), coordinates[1].toString(), (310.12).toFixed(2), function(err, estimate) {
				assert.equal(err, null);
				assert.ok(estimate);
				assert.equal(typeof estimate.Rate, "number");
				assert.equal(typeof estimate.Tax, "number");
				assert.ok(estimate.TaxDetails);
				done();
			});
		});
		
		it('should throw an error when amount is omitted', function() {
			assert.throws(function() {
				avatax.estimateTax(coordinates[0], coordinates[1], function() {});
			}, Error);
		});
	});

	describe('#getTax()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		var consistentID = uuid.v4();

		it('should return an object', function(done) {
			var getTaxObject = newGetTaxObject();
			getTaxObject.Addresses = [address2, address4];
			getTaxObject.DocCode = consistentID;
			getTaxObject.PurchaseOrderNo = consistentID;

			avatax.getTax(getTaxObject, function(err, returnDoc) {
				assert.equal(err, null);
				assert.ok(returnDoc);
				done();
			});
		});

		it('should return an object when committed', function(done) {
			var getTaxObject = newGetTaxObject();
			getTaxObject.Commit = true;
			getTaxObject.DocType = "SalesInvoice";
			getTaxObject.DocCode = consistentID;
			getTaxObject.PurchaseOrderNo = consistentID;

			avatax.getTax(getTaxObject, function(err, returnDoc) {
				assert.equal(err, null);
				assert.ok(returnDoc);
				done();
			});
		});
		
		it('should return an object when referencing an address via `TaxRegionId`', function(done) {
			var id = uuid.v4();
			var getTaxObject = newGetTaxObject();
			getTaxObject.Addresses = [address2, {
				TaxRegionId: address.TaxRegionId,
				AddressCode: address.AddressCode
			}];
			getTaxObject.DocCode = id;
			getTaxObject.PurchaseOrderNo = id;

			avatax.getTax(getTaxObject, function(err, returnDoc) {
				assert.equal(err, null);
				assert.ok(returnDoc);
				done();
			});
		});
		
		it('should return an object when referencing an address via `Latitude` and `Longitude`', function(done) {
			var id = uuid.v4();
			var getTaxObject = newGetTaxObject();
			getTaxObject.Addresses = [address2, {
				Latitude: coordinates[0],
				Longitude: coordinates[1],
				AddressCode: address.AddressCode
			}];
			getTaxObject.DocCode = id;
			getTaxObject.PurchaseOrderNo = id;

			avatax.getTax(getTaxObject, function(err, returnDoc) {
				assert.equal(err, null);
				assert.ok(returnDoc);
				done();
			});
		});

		it('should return an error when there are no addresses', function(done) {
			var getTaxObject = newGetTaxObject();
			getTaxObject.Addresses = [];//remove address, causing a requirements error;

			avatax.getTax(getTaxObject, function(err, returnDoc) {
				assert.ok(err);
				assert.equal(returnDoc, undefined);
				done();
			});
		});
	});

});
