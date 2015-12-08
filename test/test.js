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
	Country: "US"
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

var coordinates = [47.627935,-122.51702];

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

	});

	describe('#estimateTax()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return a number', function(done) {
			avatax.estimateTax(coordinates, 310.12, function(err, estimate) {
				assert.equal(err, null);
				assert.ok(typeof estimate === "number");
				done();
			});
		});
	});

	describe('#estimateTaxDetails()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return an array', function(done) {
			avatax.estimateTaxDetails(coordinates, 310.12, function(err, estimateDetails) {
				assert.equal(err, null);
				assert.ok(Array.isArray(estimateDetails));
				done();
			});
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

		it('should return an error', function(done) {
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
