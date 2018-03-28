#!/usr/bin/env node

var util = require("util");
var hideous = require("hideous");

function multitouch(){
	return (this instanceof multitouch) ? this.init() : new multitouch();
};

util.inherits(multitouch, require("events").EventEmitter);

multitouch.prototype.init = function(){
	var self = this;
	
	// pointer collection
	self.pointers = Array(50).fill([false,0,0,0,0,0,0]);

	// last sequence
	self.lastseq = 0;

	// node-hid instance via hideous
	self.hid = hideous({
		scan: true,
		attach: true,
		interval: "5s",
		filter: { vendorId: 0x04dd, productId: 0x9913, usage: 1, usagePage: 0xff00 }
	}).on('attach', function(connection, device){

		var n = 0; // keep number of fingers
		connection.on("data", function(data){

			if (data.length !== 60) return // invalid length
			if (data[0] !== 0x81) return; // invalid first byte

			if (data[59] > 0) n = data[59]; // number of pointers

			// emit raw data stream
			// self.emit("raw", data);

			// read sequence number
			var seq = data.readUInt16LE(57); // sequence, maybe also time
			var t = Date.now();

			// detect change in sequence
			if (self.lastseq !== seq) self.emit("newseq"), self.lastseq = seq;

			// read pointers
			for (var o=1; o<57; o+=8) {
				if (data[o] === 0xff) continue;
				
				// emit data
				self.emit("data",[
					(data[o]===1), // touching
					data[o+1], // finger id
					data.readUInt16LE(o+2), // x 0-15360 (from left)
					data.readUInt16LE(o+4), // y 0-8640 (from top)
					data[o+6], // state 0-255, probably area
					data[o+7], // state 0-3, probably pressure
					n,
					seq,
					t
				]);
				
			};

		});
		
	});
	
	self.on("data", function(pointer){
		if (!self.pointers[pointer[1]] || self.pointers[pointer[1]][0] !== pointer[0]) this.emit(((!!pointer[0])?"start":"end"), pointer);
		self.pointers[pointer[1]] = pointer;
	});

	function cleanup(){
		var t = Date.now();
		self.pointers = self.pointers.map(function(pointer){
			return (pointer[0]&&t-pointer[8]>50) ? ((pointer[0]=false), (self.emit("end", pointer)), pointer) : pointer;
		});
		self.emit("pointers", self.pointers);
	};

	// filter on every frame
	var cleantimer = null;
	self.on("newseq", function(){
		cleanup();
		clearTimeout(cleantimer);
		cleantimer = setTimeout(cleanup, 50);
	});
	
	return this;
	
};

module.exports = multitouch;
