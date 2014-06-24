"use strict";

var assert = require("assert");
var fs = require('fs');

var username = "daniel.hritzkiv@gmail.com";
var password = "h35-ptt-qV7-G4R";

var Avalera = require("../");//avalera;
var avalera = new Avalera(username, password, {
	development: true
});

var validOrderNumber = 21;
var validavaleraID = "1394587839-108974-1";

var maxTimeout = 1e4;//10 seconds
var slowTime = 1e3;//1 second

var address = {
	street1: "151 Sterling Rd.",
	street2: "Studio 2",
	city: "Toronto",
	province: "Ontario",
	country: "Canada",
	postalCode: "M6R 2B2"
};

describe('Avalera', function() {

	describe("New Avalera instance", function() {
		it('should throw an error when username and/or passwords are missing', function() {
			assert.throws(function() {
				new Avalera();
			}, Error);

			assert.throws(function() {
				new Avalera({
					development: false,
				});
			}, Error);

			assert.throws(function() {
				new Avalera("username");
			}, Error);

			assert.throws(function() {
				new Avalera("username", {
					development: true
				});
			}, Error);
		});
	});

	describe('#validate()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return a json response', function(done) {
			avalera.validate(address, function(err, address) {
				console.log(err, address);
				assert.equal(err, null);
				assert.equal(true, !!address);
				//assert.equal(true, !!address.line1);
				done();
			});
		});

		//currently can't find these addresses and need to figure out error handling;
		/*it('should return a json response when only providing street and postal code', function(done) {
			avalera.validate({
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
			avalera.validate({
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

	/*describe('#estimateTax()', function() {
		this.timeout(maxTimeout);
		this.slow(slowTime);

		it('should return a json response', function(done) {
			avalera.validate(address, function(err, address) {
				console.log(err, address);
				assert.equal(err, null);
				assert.equal(true, !!address);
				//assert.equal(true, !!address.line1);
				done();
			});
		});
	});*/

});
