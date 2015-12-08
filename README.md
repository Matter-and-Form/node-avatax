# node-avatax

Node library to make requests to the Avalara Avatax API

## Installation

```js
npm install --save avatax
```

## Features

Supports these features of Avalara's Avatax REST API:

- **Validate.** Normalizes a single US or Canadian address, providing a non-ambiguous address match.
- **GetTax.** Calculates taxes on a document such as a sales order, sales invoice, purchase order, purchase invoice, or credit memo.
- **EstimateTax.** Retrieves tax rate details for the supplied geographic coordinates and sale amount.

## Usage 

### Constructor

```js
var AvaTax = require("avatax");
var avatax = new AvaTax(username, password, [options]);
```

- `username`: String. Required. Typically your account number.
- `password`: String. Required. Typically your license key.
- `options`: Object. Optional.
	- `options.development`: Boolean. Defaults to `false`
	
### `validateAddress`

```js
avatax.validateAddress(address, callback);
```

- `address`: `address` Object (see below). Required.
- `callback`: Function. Called with two arguments: `err` and `validatedAddress`
	- `err`: `null` or `Error`
	- `validatedAddress`: the validated and transformed `address` data

### `getTax`

```js
avatax.getTax(taxObject, callback);
```

- `taxObject`: Object. Required. (See Avalara Documentation for full options)
- `callback`: Function. Called with two arguments: `err` and `result`
	- `err`: `null` or `Error`
	- `result`: tax calculation object for the `taxObject` provided
	
### `estimateTax`

```js
avatax.getTax(latitude, longitude, amount, callback);
```

- `latitude`: Number. Required.
- `longitude`: Number. Required.
- `amount`: Number. Required.
- `callback`: Function. Called with two arguments: `err` and `result`
	- `err`: `null` or `Error`
	- `result`: basic tax calculation object for the coordinates and amount provided.

### Object types

#### `taxObject`

An object representing an order with the following properties:

- `CustomerCode`: String. Required.
- `DocDate`: String or Date. If String, format must be "YYYY-MM-DD". Defaults to `new Date()`.
- `Commit`: Boolean. Defaults to `false`.
- `CurrencyCode`: String. 3 character ISO 4217 compliant currency code. Defaults to `"USD"`
- `Lines`: Array of `line` objects (see below). Required.
- `Addresses`: Array of `address` objects (see below). Required.

See [Avalara's documentation](http://developer.avalara.com/wp-content/apireference/master/#gettaxrequest) for a full list of fields.

#### `address`

An object representing address data with the following properties:

- `Line1`: String. Required unless `Latitude` and `Longitude`, or `TaxRegionId` is present.
- `Line2`: String. Optional.
- `Line3`: String. Optional.
- `PostalCode`: String. Required unless `City` and `Region` are present.
- `City`: String. Required with `Region` unless `PostalCode` is present.
- `Region`: String. Required with `City` unless `PostalCode` is present.
- `Country`: String. Optional.
- `Latitude`: Number. Must be accompanied by `Longtitude`. Can be used in `getTax()` instead of `Line1` and `PostalCode` or `City` plus `Region`.
- `Longitude`: Number
- `TaxRegionId`: Number. Optional. If present, no other above `address` field is required.
- `AddressCode`: String. Required when used in `getTax()`. Used in conjunction with `line` objects (see below).

See [Avalara's documentation](http://developer.avalara.com/wp-content/apireference/master/#address) for full options and usage.

#### `line`

An object representing a line item in an order (e.g. product, shipping) with the following properties:

- `LineNo`: String. Required.
- `Qty`: Number. Required.
- `Amount`: Number. Required.
- `ItemCode`: String.
- `DestinationCode`: String. Required. Corresponds to LocationCode in Address objects. See `address` above.
- `OriginCode`: String. Required. Corresponds to LocationCode in Address objects. See `address` above.

See [Avalara's Documentation](http://developer.avalara.com/wp-content/apireference/master/#line) for full options.

---

## Testing

1. run `npm install`
1. copy and rename `authentication_template.json` to `authenticate.json`, and fill in your credentials
	- `authentication.json` is in `.gitignore`, so therefore won't be added to the repo
1. run `npm test`

## License

MIT