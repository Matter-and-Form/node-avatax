"use strict";

var assert = require("assert");
var fs = require('fs');

var username = "daniel.hritzkiv@gmail.com";
var password = "h35-ptt-qV7-G4R";

var AvaTax = require("../");//avatax;
var avatax = new AvaTax(username, password, {
	development: true
});

var maxTimeout = 1e4;//10 seconds
var slowTime = 1e3;//1 second

var address = { 
	Line1: "118 N Clark St",
	Line2: "Suite 100",
	Line3: "ATTN Accounts Payable",
	City: "Chicago",
	Region: "IL",
	PostalCode: "60602",
	Country: "US"
};

var address2 = {
	Line1: "151 Sterling Rd.",
	Street2: "Studio 2",
	City: "Toronto",
	Province: "Ontario",
	Country: "Canada",
	PostalCode: "M6R 2B2"
};

var coordinates = [47.627935,-122.51702];

describe('AvaTax', function() {

	describe("New AvaTax instance", function() {
		it('should throw an error when username and/or passwords are missing', function() {
			assert.throws(function() {
				new AvaTax();
			}, Error);

			assert.throws(function() {
				new AvaTax({
					development: false,
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
			avatax.validateAddress(address, function(err, address) {
				console.log(err, address);
				assert.equal(err, null);
				assert.equal(true, !!address);
				//assert.equal(true, !!address.line1);
				done();
			});
		});

		//currently can't find these addresses and need to figure out error handling;
		/*it('should return a json response when only providing street and postal code', function(done) {
			avatax.validateAddress({
				street1: address.street1,
				street2: address.street2,
				postalCode: address.postalCode
			}, function(err, address) {
				console.log(err, address);
				assert.equal(err, null);
				assert.equal(true, !!address);
				//assert.equal(true, !!address.line1);
				done();
			});
		});

		it('should return a json response when only providing street, city, province', function(done) {
			avatax.validateAddress({
				street1: address.street1,
				street2: address.street2,
				city: address.city,
				province: address.province
			}, function(err, address) {
				console.log(err, address);
				assert.equal(err, null);
				assert.equal(true, !!address);
				//assert.equal(true, !!address.line1);
				done();
			});
		});*/

	});

	describe('#estimateTax()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return a json response', function(done) {
			avatax.estimateTax(coordinates, 310.12, function(err, estimate) {
				console.log(err, estimate);
				assert.equal(err, null);
				assert.equal(true, !!estimate);
				//assert.equal(true, !!address.line1);
				done();
			});
		});
	});

});
