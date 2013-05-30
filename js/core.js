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
// set the min and max longitude & latitude values 

// bicing edges
var lonThreshold = {
	min: 2.111615,
	max: 2.219377
};
var latThreshold = {
	min: 41.357067,
	max: 41.450882
};

// barcelona edges
var lonBarcelona = {
	min: 1.7083740234375,
	max: 2.515869140625
};
var latBarcelona = {
	min: 41.08763212467915,
	max: 41.83273506215261
};



var yqlBase = 'https://query.yahooapis.com/v1/public/yql';  

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
	twitter:	[],
	instagram:	null,
	foursquare:	[]
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
		dataType: 'jsonp'

	}).done( function(output) {
		var result = output;

		try {
			$.each( result, function(i, field) {
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

				/*
				 * debug
				 */
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
		}
		catch(err) {

		}

		return arr;

	}).fail( function() {
		console.log( 'Loading Bicing error');
	}).always( function() {

	});

};
// initial activation of data feed
loadBicing( transportation.bicing );

// ------------------------------------------------------------------------
function loadTraffic(arr) {
	// grabs data via YQL to avoid
	// cross-origin errors
	var datUrl = 'http://www.bcn.cat/transit/dades/dadestrams.dat';
	var yqlQuery = 'SELECT * FROM json WHERE url=\"' + datUrl + '\"';
	var yqlQueryUrl = yqlBase + '?q=' + encodeURI(yqlQuery) + '&format=json';

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

	// $.ajax({
	// 	url: yqlQueryUrl,
	// 	type: 'get',
	// 	dataType: 'jsonp',
	// 	error: function(XMLHttpRequest, textStatus, errorThrown) {
	// 		console.log( 'loadTraffic() error: ', errorThrown );
	// 		// generate fake data
	// 		for( var i=0; i<100; i++ ) {
	// 			datTemp.push({
	// 				id:			i,
	// 				time:		'20130525221054',
	// 				current:	parseInt( Math.random()*6 ) + 1,
	// 				future:		parseInt( Math.random()*6 ) + 1
	// 			});
	// 		}
	// 	}

	// }).done(function(output) {
	// 	var result = output.query.results.json.json;

	// 	var fields = result.split('\n');

	// 	for( var i=0; i<fields.length; i++ ) {
	// 		var field = fields[i].split('#');
	// 		datTemp.push({
	// 			id:			field[0],
	// 			time:		field[1],
	// 			current:	field[2],
	// 			future:		field[3]
	// 		});
	// 	}
	// });

	function findIndex(id) {
		var idx = -1;
		for(var i=0; i<datTemp.length; i++) {
			if(datTemp[i].id == id) idx = id; // break;
		}
		return idx;
	};


	// grabs data via YQL to avoid
	// cross-origin errors
	var locUrl = 'http://barcelonaapi.marcpous.com/traffic/streets.json';
	var yqlQuery = 'SELECT * FROM json WHERE url=\"' + locUrl + '\"';
	var yqlQueryUrl = yqlBase + '?q=' + encodeURI(yqlQuery) + '&format=json';


	// load street data
	// push to main array
	$.ajax({
		url: yqlQueryUrl,
		type: 'get',
		dataType: 'jsonp',

	}).done( function(output) {
		var result = output.query.results.json.data.streets;

		var index = -1;
		$.each(result, function(i, field) {
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

		return arr;

	}).fail( function() {
		// console.log( 'Loading Traffic error');
	}).always( function() {

	});

};
// initial activation of data feed
loadTraffic( transportation.traffic );

// ------------------------------------------------------------------------
function loadBus(arr) {
	// grabs data via YQL to avoid
	// cross-origin errors
	// var jsonUrl = 'http://marcpous.com/oneseataway/sonarBus.php';
	var jsonUrl = 'http://kennethfrederick.com/sandbox/sonar-2013/json/sonarBus.json';
	var yqlQuery = 'SELECT * FROM json WHERE url=\"' + jsonUrl + '\"';
	var yqlQueryUrl = yqlBase + '?q=' + encodeURI(yqlQuery) + '&format=json';

	$.ajax({
		url: yqlQueryUrl,
		type: 'get',
		dataType: 'jsonp',

	}).done( function(output) {
		var result = output.query.results.json.sonar

		$.each(result, function(i, field) {
			try {
				// sometimes field.data.tmb is undefined
				// format the data into a way
				// that i can handle
				var busses = field.data.tmb.buses.split(' - ');

				// parse and sort times
				var times = [];
				var current;
				for( var j=0; j<field.data.tmb.times.length; j++ ) {
					var t = field.data.tmb.times[j];

					// parse time from a string '1 min' -> Integer 1
					var time = ( t.time != 'imminent' ) 
						? parseInt( t.time.split(' min')[0] )
						: 0;

					// get current bus number
					current = ( time === 0 ) 
						? t.bus
						: null;

					// get all times of all busses
					times.push({
						bus: t.bus,
						time: time
					});
				}

				// sort busses by time
				// TODO: make sure this is actually working
				times.sortBy('time');

				// get size of bus station
				// Pal = (Palo) = a pole
				// Marquesina = a shelter
				var size = ( field.data.tmb.furniture === 'Pal') ? 2 : 1;

				arr.push({
					// flush out the entries
					name:		field.data.tmb.street_name,
					id:			field.data.tmb.id,
					busses:		busses,	// Numbers of busses which arrive at this station
					total:		busses.length,
					lat:		field.data.tmb.lat,
					lon:		field.data.tmb.lon,
					time:		times, // array of times for busses [].bus = number [].time = when 
					current:	current, // the current bus arriving

					size:		size,
					sizeMax:	2
				});
			}
			catch( err ) {
				// console.log( 'loadBus( ' + err + ' )' );
			}

		});

		return arr;

	}).fail( function() {
		// console.log( 'Loading Bus error');
	}).always( function() {

	});

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
	var jsonUrl = 'http://thethings.io/getJSON/TWITTER';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
	}).done(function(output) {
		var result = output.Sonar2013.tweets;

		// fake 
		$.each(result, function(i, field) {
			var lat, lon;

			if( field.geo == null ) {
				// this tweet has no geographic location
				lat = Math.random() * (latThreshold.min - latThreshold.max) + latThreshold.max;
				lon = Math.random() * (lonThreshold.min - lonThreshold.max) + lonThreshold.max;
			}
			else {
				// bootleg way of confining the coordinates of
				// tweets to stay within our defined (ie. bicing)
				// geographic area
				// TODO: maybe marc can/will define
				lat = Calculation.map(
					field.geo.coordinates[0],
					latBarcelona.min, latBarcelona.max,
					latThreshold.min, latThreshold.max
				);

				lon = Calculation.map(
					field.geo.coordinates[1],
					lonBarcelona.min, lonBarcelona.max,
					lonThreshold.min, lonThreshold.max
				);

				// lat = ( field.geo.coordinates[0] < latThreshold.min )
				// 	? latThreshold.min
				// 	: ( field.geo.coordinates[0] > latThreshold.min )
				// 		? latThreshold.max
				// 		: field.geo.coordinates[0];
				// lon = ( field.geo.coordinates[1] < lonThreshold.min )
				// 	? lonThreshold.min
				// 	: ( field.geo.coordinates[1] > lonThreshold.min )
				// 		? lonThreshold.max
				// 		: field.geo.coordinates[1];
			}

			arr.push({
				// flush out the entries
				bpm: 		output.Sonar2013.bpm,

				// general
				id:			field.user.id,
				// location:	'Barcelona',
				lat: 		lat,
				lon: 		lon,
				time: 		field.created_at,

				// user
				name:		field.user.screen_name,
				img: 		field.user.profile_image_url,
				media: 		field.entities.media,

				// tweet
				text: 		result.text,
				favorite: 	field.entities.favorite_count,
				hashtags: 	field.entities.hashtags,
			});

		});

		return arr;

	}).fail( function() {
		// console.log( 'Loading Bus error');
	}).always( function() {

	});

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
function loadFoursquare(arr) {
	var jsonUrl = 'http://oneseataway.thethings.io/getFoursquare.php';

	$.ajax({
		url: jsonUrl,
		type: 'get',
		dataType: 'json',
	}).done(function(output) {
		var result = output.Sonar2013[0].results;

		$.each(result, function(i, field) {
			if( field.geo != null ) {
				arr.push({
					// flush out the entries
					name:		field.from_user_name,
					id:			field.from_user_id,
					location:	field.location, //place.full_name, // the full name of the check-in
					text:		field.text, // the text entered at check-in
					lat:		field.geo.coordinates[0],
					lon:		field.geo.coordinates[1],
					time:		field.created_at, // the time the check-in was logged
					img:		field.profile_image_url // profile image of the user
				});
			}

		});

	}).fail( function() {
		// console.log( 'Loading Bus error');
	}).always( function() {

	});

};
// initial activation of data feed
loadFoursquare( social.foursquare );


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

// ------------------------------------------------------------------------
// http://stackoverflow.com/questions/1129216/sorting-objects-in-an-array-by-a-field-value-in-javascript
function dynamicSortMultiple(attr) {
	/*
	 * save the arguments object as it will be overwritten
	 * note that arguments object is an array-like object
	 * consisting of the names of the properties to sort by
	 */
	var props = arguments;
	return function (obj1, obj2) {
		var i = 0, result = 0, numberOfProperties = props.length;
		/* try getting a different result from 0 (equal)
		 * as long as we have extra properties to compare
		 */
		while(result === 0 && i < numberOfProperties) {
			result = dynamicSort(props[i])(obj1, obj2);
			i++;
		}
		return result;
	}
};
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === '-') {
        sortOrder = -1;
        property = property.substr(1, property.length - 1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
};
Object.defineProperty(Array.prototype, 'sortBy', {
	enumerable: false,
	writable: true,
	value: function() {
		return this.sort(
			dynamicSortMultiple.apply( null, arguments )
		);
	}
});