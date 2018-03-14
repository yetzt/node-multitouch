#!/usr/bin/env node

var util = require("util");
var hideous = require("hideous");

function multitouch(){
	return (this instanceof multitouch) ? this.init() : new multitouch();
};

util.inherits(multitouch, require("events").EventEmitter);

multitouch.prototype.init = function(){
	var self = this;

	hideous({
		scan: true,
		attach: true,
		interval: "30s",
		filter: { vendorId: 0x04dd, productId: 0x9913, usage: 1, usagePage: 0xff00 }
	}).on('attach', function(connection, device){

		var n = 0; // keep number of fingers
		connection.on("data", function(data){

			if (data.length !== 60) return // invalid length
			if (data[0] !== 0x81) return; // invalid first byte

			if (data[59] > 0) n = data[59]; // number of pointers
			var seq = data.readUInt16LE(57); // sequence, maybe also time

			for (var o=1; o<57; o+=8) {
				if (data[o] === 0xff) continue;

				self.emit("data",[
					(data[o]===1), // touching
					data[o+1], // finger id
					data.readUInt16LE(o+2), // x 0-15360 (from left)
					data.readUInt16LE(o+4), // y 0-8640 (from top)
					data[o+6], // state 0-255, probably area
					data[o+7], // state 0-3, probably pressure
					n,
					seq
				]);

			};

		});
		
	});
	
	return this;
	
};

module.exports = multitouch;
