console.log( 'Sónar Visualization - core.js' );
/**
 *	Sónar Visualization
 *	core.js
 *
 *	Ken Frederick
 *	ken.frederick@gmx.de
 *
 *	http://cargocollective.com/kenfrederick/
 *	http://blog.kennethfrederick.de/
 *
 *	
 */


// ------------------------------------------------------------------------
// Properties
// ------------------------------------------------------------------------
/*
 *	Transportation Data
 */
var transportation = {
	bicing:		[],
	traffic:	[],
	bus:		[]
};

/*
 *	Weather Data
 */
 var weather = {
 	// these are the temperature ranges
 	// we'll use for normalizing the current temperature
 	// http://de.wikipedia.org/wiki/Barcelona#Klima
	temperatureMin:	15,
	temperatureMax:	27,
	temperature:	null,

	humidty:		null
 };

/*
 *	Social Data
 */
var social = {
	twitter:	null,
	instagram:	null,
	foursquare:	null
};

/*
 *	Misc.
 */
var bOffline = true; // assume we have no internet connections


// ------------------------------------------------------------------------
// loaded
// ------------------------------------------------------------------------
/*
 *	DOM is loaded
 */
$(function() {

	/*
	 *	Check Connection status
	 */
	console.log( 'online', navigator.onLine );
	if(!(navigator.onLine) && bOffline ) {
		// window.location = "./oops.html";
		// bOffline = false;
	}

});


// ------------------------------------------------------------------------
// Methods
// ------------------------------------------------------------------------
/*
 *
 *	Input Data Methods
 *
 */

//
//	TODO:	make sure these methods are asynchronous
//

/*
 *	Transportation Data
 */
function loadBicing(arr) {
	var jsonUrl = 'http://api.citybik.es/bicing.json';

	// bicingLon = new Array();
	// bicingLat = new Array();

	$.ajax({
		url: jsonUrl,
		type: 'get',
		// dataType: 'json',
		dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {
		$.each(result, function(i, field) {
			// format the data into a way
			// that i can handle
			var _t = Date.parse(field.timestamp);
			var _d = new Date(_t);
			var time = {
				year:		_d.getFullYear(),
				month:		_d.getMonth(),
				day:		_d.getDate(),
				hours:		_d.getHours(),
				minutes:	_d.getMinutes(),
				seconds:	_d.getSeconds()
			};

			arr.push({
				node:		null,  // keeps track of which node this data belongs to
				// flush out the entries
				name:		field.cleaname,
				nearby:	field.nearby_stations.split(','),
				id:			field.id,
				bikes:		field.bikes,	// Number of bikes in the station
				free:		field.free,		// Number of free slots
				total:		(field.free + field.bikes),
				lat:		field.lat/1000000,
				lon:		field.lng/1000000,
				time:		time
			});

			// bicingLon.push( field.lng/1000000 );
			// bicingLat.push( field.lat/1000000 );
		});

		/*
		 * debug
		 */
		// bicingLon.sort();
		// console.log( bicingLon[0] );
		// console.log( bicingLon[bicingLon.length-1] );

		// bicingLat.sort();
		// console.log( bicingLat[0] );
		// console.log( bicingLat[bicingLon.length-1] );

	});

	return arr;
};
// initial activation of data feed
loadBicing( transportation.bicing );

// ------------------------------------------------------------------------
function loadTraffic(arr) {
	var datUrl = 'http://www.bcn.cat/transit/dades/dadestrams.dat';
	var locUrl = 'http://barcelonaapi.marcpous.com/traffic/streets.json';

	// load actual traffic data
	var datTemp = [];

	// create fake traffic data
	for( var i=0; i<2004; i++ ) {
		datTemp.push({
			id:			i,
			time:		'20130525221054',
			current:	parseInt( Math.random()*6 ) + 1,
			future:		parseInt( Math.random()*6 ) + 1
		});
	}

	/*
	$.ajax({
		url: datUrl,
		type: 'get',
		// dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,

		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log( 'loadTraffic() error: ', errorThrown );
			// generate fake data
			for( var i=0; i<100; i++ ) {
				datTemp.push({
					id:			i,
					time:		'20130525221054',
					current:	parseInt( Math.random()*6 ) + 1,
					future:		parseInt( Math.random()*6 ) + 1
				});
			}
		}

	}).done(function(result) {
		var fields = result.split('\n');

		for( var i=0; i<fields.length; i++ ) {
			var field = fields[i].split('#');
			datTemp.push({
				id:			field[0],
				time:		field[1],
				current:	field[2],
				future:		field[3]
			});
		}
	});
	*/

	function findIndex(id) {
		var idx = -1;
		for(var i=0; i<datTemp.length; i++) {
			if(datTemp[i].id == id) idx = id; // break;
		}
		return idx;
	};

	// load street data
	// push to main array
	$.ajax({
		url: locUrl,
		type: 'get',
		dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {
		var index = -1;
		$.each(result.data.streets, function(i, field) {
			var f = field;
			index = findIndex( field.id );

			if( index != -1 ) {
				var coords = field.coordinates.split(',');
				arr.push({
					// flush out the entries
					name:		field.name,
					id:			field.id,
					current:	parseInt(datTemp[index].current)+1,	// add 1, to avoid a 0 value
					future:		parseInt(datTemp[index].future)+1,	// add 1, to avoid a 0 value
					max: 		7,
					lat:		coords[1], // /1000000,
					lon:		coords[0], // /1000000,
					time:		datTemp[index].time
				});
			}

		});

	});

	return arr;
};
// initial activation of data feed
loadTraffic( transportation.traffic );

// ------------------------------------------------------------------------
function loadBus(arr) {
	// var jsonUrl = 'http://marcpous.com/oneseataway/sonarBus.php';
	var jsonUrl = 'json/sonarBus.json';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {
		$.each(result.sonar, function(i, field) {

			try {
				// sometimes field.data.tmb is undefined
				// format the data into a way
				// that i can handle
				var busses = field.data.tmb.buses.split(' - ');

				arr.push({
					// flush out the entries
					name:		field.data.tmb.street_name,
					id:			field.data.tmb.id,
					busses:		busses,	// Numbers of busses which arrive at this station
					total:		busses.length,
					lat:		field.data.tmb.lat,
					lon:		field.data.tmb.lon,
					time:		field.data.tmb.times // list of times for busses [].bus = number [].time = when 
				});
			}
			catch( err ) {
				// console.log( 'loadBus( ' + err + ' )' );
			}

		});
	});


	return arr;
};
// initial activation of data feed
loadBus( transportation.bus );



/*
 *	Weather Data
 */
function loadWeather(arr) {
	var jsonUrl = 'http://api.wunderground.com/api/b8ed943bbfbfffa7/conditions/q/Spain/Barcelona.json';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {
		arr.temperature	= result.current_observation.feelslike_c;
		arr.humidty 	= parseInt(result.current_observation.relative_humidity);
	});

	return arr;
};
// initial activation of data feed
loadWeather( weather );



/*
 *	Social Data
 */
function loadTwitter(arr) {
	var jsonUrl = '';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {

	});

	return arr;
};
// initial activation of data feed
loadTwitter( social.twitter );

// ------------------------------------------------------------------------
function loadInstagram(arr) {
	var jsonUrl = '';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {

	});

	return arr;
};
// initial activation of data feed
loadInstagram( social.instagram );

// ------------------------------------------------------------------------
function loadFourSquare(arr) {
	var jsonUrl = '';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
		// dataType: 'jsonp', // use jsonp data type in order to perform cross domain ajax
		crossDomain: true,
		cache: false,
		async: true,
	}).done(function(result) {

	});

	return arr;
};
// initial activation of data feed
loadFourSquare( social.foursquare );


// ------------------------------------------------------------------------
// http://davidwalsh.name/javascript-clone
function clone(src) {
	function mixin(dest, source, copyFunc) {
		var name, s, i, empty = {};
		for(name in source) {
			// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in 'source'
			// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
			// don't overwrite it with the toString() method that source inherited from Object.prototype
			s = source[name];
			if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
				dest[name] = copyFunc ? copyFunc(s) : s;
			}
		}
		return dest;
	}

	if(!src || typeof src != 'object' || Object.prototype.toString.call(src) === '[object Function]') {
		// null, undefined, any non-object, or function
		return src;	// anything
	}
	if(src.nodeType && 'cloneNode' in src) {
		// DOM Node
		return src.cloneNode(true); // Node
	}
	if(src instanceof Date) {
		// Date
		return new Date(src.getTime());	// Date
	}
	if(src instanceof RegExp) {
		// RegExp
		return new RegExp(src);   // RegExp
	}
	var r, i, l;
	if(src instanceof Array) {
		// array
		r = [];
		for(i = 0, l = src.length; i < l; ++i) {
			if(i in src) {
				r.push(clone(src[i]));
			}
		}
		// we don't clone functions for performance reasons
		//		} 
		//		else if(d.isFunction(src)) {
		//			// function
		//			r = function() { return src.apply(this, arguments); };
	}
	else{
		// generic objects
		r = src.constructor ? new src.constructor() : {};
	}
	return mixin(r, src, clone);

};

