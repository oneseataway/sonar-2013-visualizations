console.log( 'Sónar Visualization' );
/**
 *	Sónar Visualization
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



// ------------------------------------------------------------------------
// Methods
// ------------------------------------------------------------------------
/*
 *
 *	Input Data Methods
 *
 */

/*
 *	Transportation Data
 */
function loadBicing(arr) {
	var jsonUrl = 'http://api.citybik.es/bicing.json';

	// bicingLon = new Array();
	// bicingLat = new Array();

	$.ajax({
		url: jsonUrl,
		dataType: 'jsonp', //use jsonp data type in order to perform cross domain ajax
		context: document.body,
		crossDomain: true
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
	$.ajax({
		url: datUrl,
		dataType: 'jsonp', //use jsonp data type in order to perform cross domain ajax
		context: document.body,
		crossDomain: true
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
		dataType: 'jsonp', //use jsonp data type in order to perform cross domain ajax
		context: document.body,
		crossDomain: true
	}).done(function(result) {
		// console.log( result.data.streets );

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
	var jsonUrl = 'http://api.citybik.es/bicing.json';

	$.ajax({
		url: jsonUrl,
		dataType: 'jsonp', //use jsonp data type in order to perform cross domain ajax
		context: document.body,
		crossDomain: true
	}).done(function(result) {
		$.each(result, function(i, field) {

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
		dataType: 'jsonp', //use jsonp data type in order to perform cross domain ajax
		context: document.body,
		crossDomain: true
	}).done(function(result) {
		arr.temperature	= result.current_observation.feelslike_c;
		arr.humidty 	= parseInt(result.current_observation.relative_humidity);
	});

	return arr;
};
// initial activation of data feed
loadWeather( weather );

