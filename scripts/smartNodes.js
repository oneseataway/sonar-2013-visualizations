console.log( 'Sónar Visualization - smartNodes.js' );
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
// Libraries
// ------------------------------------------------------------------------
var f = frederickkPaper;
var ft = f.FTime;



// ------------------------------------------------------------------------
// Properties
// ------------------------------------------------------------------------
/*
 *
 *	General
 *
 */
var margins;
var colors;
var sizing;

var bChangeFlag = false;


/*
 *
 *	Grid
 *
 */
var grid;
var gridSize;
var nodePoints = [];


/*
 *
 *	Triangulation
 *
 */
var triangles;


/*
 *
 *	Data
 *
 */
// TODO: multiple pulses?
var pulse;


/*
 *	Transportation
 */
// Bicing
var bicing;
var bicingNodeGroup;

// Traffic
var traffic;
var trafficNodeGroup;

// Bus
var bus;
var busNodeGroup;


/*
 *	Weather
 */
// Temperature
var temperature;
var temperatureNodeGroup;
var temperatureMask;

// Humidty
var humidity;
var humidityNodeGroup;
var humidityMask;


/*
 *	Social
 */
// Twitter
var twitter;
var twitterNodeGroup;

// Foursquare
var foursquare;
var foursquareNodeGroup;

// Instagram
var instagram;
var instagramNodeGroup;



/*
 *
 *	Interface
 *
 */
var InterfaceValues = function() {
	//
	// general
	//
	this.bFullscreen	= false;


	//
	// datapoints
	//

	// transportation
	this.bBicing		= true;
	this.bTraffic		= true;
	this.bBus			= true;

	// weather
	this.bTemperature	= true;
	this.bHumidity		= true;

	// social
	this.bTwitter		= true;
	this.bFoursquare	= true;
	this.bInstagram		= true;


	//
	// colors
	//
	// pull color values in from CSS
	// then convert to Paper.js compatible colors
	this.sonar_black		= new Color( getCSSColor('.sonar-black', true) ); 

	// primaries
	this.sonar_red			= new Color( getCSSColor('.sonar-red', true) ); 
	this.sonar_yellow		= new Color( getCSSColor('.sonar-yellow', true) ); 
	this.sonar_blue			= new Color( getCSSColor('.sonar-blue', true) ); 
	this.sonar_green		= new Color( getCSSColor('.sonar-green', true) ); 

	// bass
	this.sonar_bikes		= new Color( getCSSColor('.sonar-bikes', true) );
	this.sonar_traffic		= new Color( getCSSColor('.sonar-traffic', true) );
	this.sonar_bus			= new Color( getCSSColor('.sonar-bus', true) );

	// mid
	this.sonar_teperature	= new Color( getCSSColor('.sonar-temperature', true) );
	this.sonar_humidity		= new Color( getCSSColor('.sonar-humidity', true) ); 

	// treble	
	this.sonar_twitter		= new Color( getCSSColor('.sonar-twitter', true) );
	this.sonar_foursquare	= new Color( getCSSColor('.sonar-foursquare', true) );
	this.sonar_instagram	= new Color( getCSSColor('.sonar-instagram', true) );




	//
	// debug
	//
	this.bVerbose = true;
	this.bDebug = false;
};
// instantiate values
var values = new InterfaceValues();


var debugPath;



// ------------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------------
function Setup() {
	/*
	 *
	 *	Globals
	 *
	 */
	// margins
	margins = {
		top:	60,
		right:	70,
		bottom:	60,
		left:	70
	};

	// colors
	colors = values.colors;

	// sizes
	// in order for the grid to work
	// these values have to be odd numbers
	var cols = 15; //21;
	var rows = 11; //15;

	gridSize = new Size(
		(view.bounds.width - (margins.left)) / cols,
		(view.bounds.height - (margins.top)) / rows
	);

	// set the min and max sizes
	// TODO:	define the high-medium-low?
	sizing = {
		min: 6,
		max: gridSize.height,
		snap: gridSize.height/3
	}

	// pulsing stepper
	pulse = new ft.FStepper();
	pulse.setSeconds( 3 );
	pulse.toggle();



	/*
	 *
	 *	create grid
	 *
	 */
	grid = new Group();

	// draw the grid nodes
	var index = 0;
	for( var j=0; j<rows; j++ ) {
		for( var i=0; i<cols; i++ ) {
			if( index % 2 === 0 ) {
				var pt = new Point(
					margins.left + i * gridSize.width,
					margins.top + j * gridSize.height
				);

				// add points
				nodePoints.push( pt );

				var node = new Path.Circle( pt, sizing.min*0.5 );
				node.fillColor = values.sonar_black;
				node.strokeColor = 'white';

				// add to grid
				grid.appendTop( node );
			}
			index++;
		}
	}

	// draw the grid lines
	var lines = new Group();
	for( var i=0; i<grid.children.length; i++ ) {
		var node = grid.children[i];

		// debug
		// var text = new Marker( ['', i.toString()], node.position );
		// text.fillColor = 'white';

		// draw the grid lines
		var nodeFloor = grid.children[i+Math.floor(cols/2)];
		var nodeCeil = grid.children[i+Math.ceil(cols/2)];
		if( nodeCeil != undefined ) {
			if(i % cols != Math.floor(cols/2)) {
				var line = new Path.Line(
					node.position,
					nodeCeil.position
				);
				line.strokeColor = 'white';

				lines.appendBottom( line );
			}
		}
		if( nodeFloor != undefined ) {
			if(i % cols != 0) {
				var line = new Path.Line(
					node.position,
					nodeFloor.position
				);
				line.strokeColor = 'white';
				lines.appendBottom( line );
			}
		}

	}



	/*
	 *
	 *	create triangulation
	 *
	 */
	var triangulate = new Triangulate( nodePoints )	;
	triangles = new Group();

	// draw faces
	// TODO: sort faces left -> right
	for( var i=0; i<triangulate.length; i++ ) {
		var triangle = triangulate[i];

		// draw triangle
		face = new Path();
		face.name = 'triangle';
		face.add( triangle.p1 );
		face.add( triangle.p2 );
		face.add( triangle.p3 );
		face.closed = true;

		face.fillColor = new Color( 0.0, 0.0, 0.0, 0.0 );

		triangles.appendTop( face );
	}


	/*
	 *
	 *	create weather data mask shapes
	 *
	 */
	// TODO:	make scalable for any col/row combination
	//			each node as percentage of total col*row?
	// Temperature
	temperatureMask = new Path(
		nodePoints[9],
		nodePoints[25],
		nodePoints[11],
		nodePoints[27],
		nodePoints[13],

		nodePoints[37],
		
		nodePoints[79],
		nodePoints[71],
		nodePoints[78],

		nodePoints[30]
	);
	temperatureMask.closed = true;
	temperatureMask.fillColor = null;
	temperatureMask.strokeColor = null;

	// Humidty
	humidityMask = new Path(
		nodePoints[3],
		nodePoints[11],
		nodePoints[4],

		nodePoints[52],

		nodePoints[80],
		nodePoints[64],
		nodePoints[71],
		nodePoints[63],
		nodePoints[77],

		nodePoints[45]
	);
	humidityMask.closed = true;
	humidityMask.fillColor = null;
	humidityMask.strokeColor = null;



	/*
	 *
	 *	create data handlers
	 *
	 *	this is where all of the magic starts
	 *
	 */

	// each data point is simply a clone
	// of the original grid

	// ------------------------------------
	//
	//	Transportation
	//

	// ------------------------------------
	//
	// Bicing
	//
	bicingNodeGroup = grid.clone();
	bicingNodeGroup.name = 'Bicing';

	// create the data structures
	bicing = new DataHandler( 
		// the group of items to push the data into
		bicingNodeGroup,
		// the array of data
		transportation.bicing, 
		// an object literal Array of the structure and
		// keys which should be infused within the group
		{
			id:		[],	// keep track of what ids are represented by this node (array)
			total:	0,	// the total number of bike represented = (##.free + ##.bikes) + (...)
			bikes:	0,	// the number of bikes "currently" at the station
			free:	0,	// the total number of "free" slots
			radius: []	// two radii for pulsing between (pulsing optional)
		},
		// the keys of the dataArray within the nodes
		// which should be updated
		[
			'total',
			'bikes',
			'free',
			{
				radius1: ['free', 'total'],
				radius2: ['total', 'free']
			}
		]
	);

	// create & set the style
	var style = {
		fillColor: values.sonar_bikes,
		opacity: 0.4
	};
	bicing.setStyle(style);



	// ------------------------------------
	//
	// Traffic
	//
	trafficNodeGroup = grid.clone();
	trafficNodeGroup.name = 'Traffic';

	// create the data structures
	traffic = new DataHandler( 
		// the group of items to push the data into
		trafficNodeGroup,
		// the array of data
		transportation.traffic, 
		// an object literal Array of the structure and
		// keys which should be infused within the group
		{
			id:			new Array(),	// keep track of what ids are represented by this node (array)
			time:		0,	// what time is the traffic happening
			current:	0,	// the current traffic situation
			future:		0,	// the predicted traffic situation
			radius:		new Array(),	// two radii for pulsing between (pulsing optional)
			max:		7
		},
		// the keys of the dataArray within the nodes
		// which should be updated
		[
			'time',
			'current',
			'future',
			{
				radius1: ['current','max'],
				radius2: ['future','max']
			}
			// {
			//	label: ['current','']
			//	// label: 'current'
			//}
		]
	);

	// create & set the style
	var style = {
		fillColor: values.sonar_traffic,
		opacity: 0.4
	};
	traffic.setStyle(style);


	// ------------------------------------
	//
	// Bus
	//
	busNodeGroup = grid.clone();
	busNodeGroup.name = 'Bus';

	// create the data structures
	bus = new DataHandler( 
		// the group of items to push the data into
		busNodeGroup,
		// the array of data
		transportation.bus, 
		// an object literal Array of the structure and
		// keys which should be infused within the group
		{
			id:			new Array(),	// keep track of what ids are represented by this node (array)
			current:	0,	// the current bus arriving
			radius:		new Array(),	// two radii for pulsing between (pulsing optional)
			size:		0,
			sizeMax:	2,
		},
		// the keys of the dataArray within the nodes
		// which should be updated
		[
			'time',
			'current',
			'size',
			'sizeMax',
			{
				radius1: ['size','sizeMax'],
				radius2: ['size','sizeMax'],
			},
			{
				label: 'current'
			}
		]
	);

	// create & set the style
	var style = {
		fillColor: values.sonar_bus,
		opacity: 0.4
	};
	bus.setStyle(style);



	// ------------------------------------
	//
	//	Transportation
	//

	// ------------------------------------
	//
	// Temperature
	//
	temperatureNodeGroup = triangles.clone();
	temperatureNodeGroup.name = 'Temperature';

	// create the data structures
	temperature = new DataHandler(
		// the group of items to push the data into
		temperatureNodeGroup,
		// the array of data
		weather,
		// an object literal Array of the structure and
		// keys which should be infused within the group
		{
			temperature:	0,
			radius: 		new Array(),	// two radii for pulsing between (pulsing optional)

			temperatureMin:	0,
			temperatureMax:	0
		},
		// the keys of the dataArray within the nodes
		// which should be updated
		[
			'temperature'
		]
	);

	// create & set the style
	var style = {
		fillColor: values.sonar_temperature,
		opacity: 0.2
	};
	temperature.setStyle(style);


	// ------------------------------------
	//
	// Humidty
	//
	humidityNodeGroup = triangles.clone();
	humidityNodeGroup.name = 'Humidty';

	// create the data structures
	humidity = new DataHandler(
		// the group of items to push the data into
		humidityNodeGroup,
		// the array of data
		weather,
		// an object literal Array of the structure and
		// keys which should be infused within the group
		{
			humidity:		0,
			radius: 		new Array()	// two radii for pulsing between (pulsing optional)
		},
		// the keys of the dataArray within the nodes
		// which should be updated
		[
			'humidity'
		]
	);

	// create & set the style
	var style = {
		fillColor: values.sonar_humidity,
		opacity: 0.2
	};
	humidity.setStyle(style);



	// ------------------------------------
	//
	//	Social
	//

	// ------------------------------------
	//
	// Twitter
	//
	twitterNodeGroup = triangles.clone();
	twitterNodeGroup.name = 'Twitter';

	// create the data structures
	twitter = new DataHandler(
		// the group of items to push the data into
		twitterNodeGroup,
		// the array of data
		social.twitter,
		// an object literal Array of the structure and
		// keys which should be infused within the group
		{
			name:			' ',
			id:				new Array(),
			location:		' ',
			text:			' ',

			radius: 		new Array()	// two radii for pulsing between (pulsing optional)
		},
		// the keys of the dataArray within the nodes
		// which should be updated
		[
			'name',
			'location',
			'text'
		]
	);

	// create & set the style
	var style = {
		fillColor: values.sonar_twitter,
		opacity: 0.2
	};
	twitter.setStyle(style);


	// ------------------------------------
	// //
	// // Foursquare
	// //
	// foursquareNodeGroup = grid.clone();
	// foursquareNodeGroup.name = 'Foursquare';

	// // create the data structures
	// foursquare = new DataHandler( 
	// 	// the group of items to push the data into
	// 	foursquareNodeGroup,
	// 	// the array of data
	// 	social.foursquare,
	// 	// an object literal Array of the structure and
	// 	// keys which should be infused within the group
	// 	{
	// 		id:				new Array(),	// keep track of what ids are represented by this node (array)
	// 		name:			' ',	// keep track of the name of the user
	// 		location:		' ', // keep track of the location of the user
	// 		img:			' ', // keep track of the user's avatar
	// 		raster:			null,
	// 		text:			' ', // keep track of the text the user enters

	// 		radius: 		new Array(),	// two radii for pulsing between (pulsing optional)
	// 		size:			1,
	// 		sizeMax:		8

	// 	},
	// 	// the keys of the dataArray within the nodes
	// 	// which should be updated
	// 	[
	// 		'name',
	// 		'location',
	// 		'img',
	// 		'text',
	// 		'size',
	// 		{
	// 			radius1: ['size','sizeMax'],
	// 		}
	// 		// {
	// 		//	label: ['name', 'text']
	// 		//}
	// 	]
	// );

	// // create & set the style
	// var style = {
	// 	fillColor: values.sonar_foursquare,
	// 	opacity: 0.2
	// };
	// foursquare.setStyle(style);



	/*
	 *
	 *	Cleanup
	 *
	 */
	// add the lines to the main grid
	grid.appendBottom( lines );

	// move main grid layer to be uppermost
	grid.opacity = 0.2;
	grid.bringToFront();


	// we've cloned triangles where 
	// it needs to be, let's remove the original
	triangles.remove();

};



// ------------------------------------------------------------------------
// Update
// ------------------------------------------------------------------------
function Update(event) {
	// reset change flag at the beginning of 
	// every update cycle
	bChangeFlag = false;


	/*
	 *
	 *	Values
	 *
	 */
	colors = values.colors;


	/*
	 *
	 *	Stepper Syncing
	 *
	 */
	pulse.update( event.time );
	if( pulse.isDone() ) {
		pulse.toggle();
	}
	if( values.bDebug ) {
		debugPath = new TimerClock( view.bounds.center, 100, pulse.delta );
		debugPath.fillColor = new Color( 0.0, 1.0, 0.7 );
		debugPath.opacity = 0.618;
	}
	else {
		if( debugPath != undefined ) debugPath.remove();
	}



	/*
	 *
	 *	Initial Loading of Data
	 *
	 */
	// load all of the data in (the first time)
	// checks every 3 seconds until
	// all feeds are intiially loaded
	if( parseInt(event.time) % 3 === 1 ) {
		init();
	}



};


/*
 *
 *	Intervals to refresh data
 *
 */

// ------------------------------------------------------------------------
//
// Transportation
//

// Bicing
// update every 5 seconds
var UpdateBicing = setInterval(
	function() {
		if( !bicing.isUpdated() && bicing.isLoaded() ) {
			// if( bOffline ) {
				// fake values for offline & testing only
				var fakeBpm = parseInt( Math.random()*180 );
				for( var i=0; i<transportation.bicing.length; i++ ) {
					var b = transportation.bicing[i];
					b.bpm = fakeBpm;
					b.bikes	= Calculation.randomInt( b.total );
					b.free	= b.total - b.bikes;
				}
			// }
			// else {
				// get the new json feed
				// loadBicing( transportation.bicing );
			// }

			// push the data into the group
			bicing.refresh( transportation.bicing );
			bicing.isUpdated(true);

			// update BPM
			setBpmText( '#bicing', transportation.bicing );

			if( values.bVerbose ) console.log( 'Updated Bicing', bicing.isUpdated() );
		}
	},
	(9*1000)
);

// ------------------------------------------------------------------------
// Traffic
// update every 16 minutes (16*60)
var UpdateTraffic = setInterval(
	function() {
		if( !traffic.isUpdated() && traffic.isLoaded() ) {
			// if( values.bVerbose ) console.log( 'UpdateTraffic', bTrafficUpdate );

			if( bOffline ) {
				// fake values for offline & testing only
				var fakeBpm = parseInt( Math.random()*180 );
				for( var i=0; i<transportation.traffic.length; i++ ) {
					var t = transportation.traffic[i];
					t.bpm = fakeBpm;
					if( i % 5 == 0 ) {
						t.current = Calculation.randomInt( 1,7 );
						t.future = Calculation.randomInt( 1,7 );
					}
				}			
			}
			else {
				// get the new json feed
				loadTraffic( transportation.traffic );
			}

			// push the data into the group
			traffic.refresh( transportation.traffic );
			traffic.isUpdated(true);

			// update BPM
			setBpmText( '#traffic', transportation.traffic );

			if( values.bVerbose ) console.log( 'Updated Traffic', traffic.isUpdated() );
		}
	},
	(6*1000)
);

// ------------------------------------------------------------------------
// Bus
// update every 16 minutes (16*60)
var UpdateBus = setInterval(
	function() {
		if( !bus.isUpdated() && bus.isLoaded() ) {
			// if( values.bVerbose ) console.log( 'UpdateTraffic', bTrafficUpdate );

			if( bOffline ) {
				// fake values for offline & testing only
				var fakeBpm = parseInt( Math.random()*180 );
				for( var i=0; i<transportation.bus.length; i++ ) {
					var b = transportation.bus[i];
					b.bpm = fakeBpm;
					b.current = Calculation.randomInt( 1,7 );
				}			
			}
			else {
				// get the new json feed
				// loadBus( transportation.bus );
			}

			// push the data into the group
			bus.refresh( transportation.bus );
			bus.isUpdated(true);

			// update BPM
			setBpmText( '#bus', transportation.bus );

			if( values.bVerbose ) console.log( 'Updated Bus', bus.isUpdated() );
		}
	},
	(12*1000)
);


// ------------------------------------------------------------------------
//
// Weather
//
// update every hour
var UpdateWeather = setInterval(
	function() {
		if( !temperature.isUpdated() && temperature.isLoaded() &&
			!humidity.isUpdated() && humidity.isLoaded() ) {

			// if( bOffline ) {
			// }
			// else {
				// get the new json feed
				loadWeather( weather );
			// }

			// push the data into the group
			temperature.refresh( weather );
			temperature.isUpdated(true);

			// update BPM
			setBpmText( '#temperature', weather.temperature );

			humidity.refresh( weather );
			humidity.isUpdated(true);

			// update BPM
			setBpmText( '#humidity', weather.humidity );

			if( values.bVerbose ) console.log( 'Updated Weather' );
		}
	},
	(2*1000)
);


// ------------------------------------------------------------------------
//
// Social
//
var UpdateTwitter = setInterval(
	function() {
		if( !twitter.isUpdated() && twitter.isLoaded() ) {
			// if( values.bVerbose ) console.log( 'UpdateTraffic', bTrafficUpdate );

			if( bOffline ) {

			}
			else {
				// get the new json feed
				loadTwitter( social.twitter );
			}

			// push the data into the group
			twitter.refresh( social.twitter );
			twitter.isUpdated(true);

			// update BPM
			setBpmText( '#twitter', social.twitter );

			if( values.bVerbose ) console.log( 'Updated Twitter', twitter.isUpdated() );
		}
	},
	(60*1000)
);

// ------------------------------------------------------------------------
// var UpdateFoursquare = setInterval(
//	function() {
//		if( !foursquare.isUpdated() && foursquare.isLoaded() ) {
//			// if( values.bVerbose ) console.log( 'UpdateTraffic', bTrafficUpdate );

//			if( bOffline ) {
//				// fake values for offline & testing only
//				for( var i=0; i<social.foursquare.length; i++ ) {
//					var f = social.foursquare[i];
					
//					f.name = 'Testy McTesterson';
//					f.location = 'Am Arsch der Welt';
//					f.lat = Calculation.random( latThreshold.min, latThreshold.max );
//					f.lon = Calculation.random( lonThreshold.min, lonThreshold.max );
//					f.img = 'http://a0.twimg.com/profile_images/3056041095/2bf137201d095af9feff271a168ca7a1_normal.png';
//				}			
//			}
//			else {
//				// get the new json feed
//				// loadFoursquare( social.foursquare );
//			}

//			// push the data into the group
//			foursquare.refresh( social.foursquare );
//			foursquare.isUpdated(true);

			// // update BPM
			// setBpmText( '#foursquare', social.foursquare );

//			if( values.bVerbose ) console.log( 'Updated FourSquare', foursquare.isUpdated() );
//		}
//	},
//	(12*1000)
// );



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function Draw(event) {

	/*
	 *
	 *	Update Visualizations
	 *
	 */

	// if( parseInt(event.time) % 1 === 1 ) {
		//
		// Transportation
		//
		bicing.draw( event, values.bBicing );
		traffic.draw( event, values.bTraffic );
		bus.draw( event, values.bBus );


		//
		// Weather
		//
		temperature.draw( event, values.bTemperature,
			function( event, node, bUpdate ) {
				node.fillColor = values.sonar_temperature;
				node.opacity = 1.0;

				console.log( 'temperature', node.data );

				var p = new Path.Circle(
					node.position,
					12
				);
				p.fillColor = values.sonar_temperature;
			}
		);
		humidity.draw( event, values.bHumidity );


		//
		// Social
		//
		twitter.draw( event, values.bTwitter,
			function( event, node, bUpdate ) {
				var data = node.data;
				// console.log( 'TWITTER: id\t', data.current.id.length );

				// var t = new PointText( node.position );
				// t.content = node.data.current.text;
				// t.fillColor = new Color( 0.0, 1.0, 0.7 );

				// var t = new Path.Circle(
				//	node.position,
				//	10
				// );
				// node.fillColor = new Color( Math.random(), Math.random(), Math.random(), Math.random() );

				// node.fillColor = values.sonar_twitter;
				// node.opacity = Math.random();

			}
		);

//		foursquare.draw( event, values.bFoursquare, 
//			function( event, node, bUpdate  ) {
//				var data = node.data;
//				var animator = data.animator;
//				var pos = node.position;

//				// check if an update has been made
//				if( bUpdate ) {
//					// kick off animator stepper
//					animator.setDelta( 0.0 );
//					// animator.stepIn();
//					animator.toggle();
//				}
//				else {
//					if( animator.delta < 0.0 || animator.delta > 1.0 ) {
//						// no update, just pulse
//						// TODO: fix pulse flickering
//						// TODO: make a generic function
//					}
//				} // end if( bUpdate...


//				if( !animator.isDone() ) {
//					// the animator stepper is still running
//					// so let's be sure to animate
//					// var start = data.previous.radius[0];
//					// var stop = data.current.radius[0];
//					// node.bounds.size = new Size( 
//					//	Calculation.lerp( start, stop, animator.delta ),
//					//	Calculation.lerp( start, stop, animator.delta )
//					// );
//				}
//				else {
//					animator.stop();
//					// the updates have been animated
//					// prepare the data to allow new info
//					// data.clear = false;
//				} // end if( !animator...

//			}
//		);

	// } // end if( parseInt(event.time...

};



// ------------------------------------------------------------------------
// Methods
// ------------------------------------------------------------------------
function init() {
	/*
	 *
	 *	Transportation
	 *
	 */
	bicing.init();
	traffic.init();
	bus.init();


	/*
	 *
	 *	Weather
	 *
	 */
	temperature.init();
	humidity.init();

	/*
	 *
	 *	Social
	 *
	 */
	twitter.init();
	// foursquare.init();

};


/*
 *	@param {Group} pathGroup
 *					the group of items to push the data into
 *	@param {Array} dataArray
 *					the array of data
 *	@param {Array} dataArrayStructure
 *					an object literal Array of the structure and
 *					keys which should be infused within the group
 *	@param {Array} dataKeys
 *					the keys of the dataArray within the nodes which should be updated
 */
var DataHandler = function( pathGroup, dataArray, dataArrayStructure, dataKeys ) {
	//
	// Properties
	//
	var _group = pathGroup;
	var _style = {
		fillColor:		new Color( 0.0, 1.0, 0.7 ),
		strokeColor:	null
	};	// default style

	var _dataArr = dataArray;
	var _dataStruct = dataArrayStructure;
	var _dataKeys;

	var animationMillis = 500;

	var labelFadeMillis = 600;
	var labeldelayMillis = 2100;
	var labelKey;
	var bLabeled = false;

	var bLoad = false;
	var bUpdate = true;



	//
	// Methods
	//
	/**
	 *
	 *	Initial loading of Data
	 *
	 *	@param {Array} dataKeys
	 *					the keys of the dataArray within the nodes which should be updated
	 *	@param {Function} func
	 *					a function/callback which can be defined
	 *					for "custom" node updating operations
	 *					passed variables include: event, node, bLoad
	 */
	function dataInit( dataKeys, func ) {
		// if data keys are added during init
		setDataKeys( dataKeys );

		// if( _dataArr.length > 0 && !bLoad ) {
		if( !bLoad ) {
			for( var i=0; i<_dataArr.length; i++ ) {
				// incoming data
				var data = _dataArr[i];

				// get the node that corresponds
				// to the given data
				var node = getNode( data );

				if( node != undefined ) {
					// since we now node which represents
					// the data point, we'll push that back
					// into the master data array
					data.node = node.id;

					// create data structure
					// this is where all of the information is stored that we need
					// data comes in two flavors...
					// current = the latest data
					var current, previous;
					if( node.data.current == undefined ) {
						current = clone( _dataStruct );
					}
					else {
						current = node.data.current;
					}

					// if (!$.inArray(data.id, data.ids)) {
						// this id hasn't been logged yet
						// so push it's data into the node
						for (var key in _dataStruct ) {
							if( current[ key ] instanceof Array ) {
								current[ key ].push( data[ key ] );
							}
							else if( typeof current[ key ] == 'object' ) {
								// current[ key ].push( data[ key ] );
								current[ key ] = data[ key ];
							}
							else if( typeof current[ key ] == 'string' ) {
								current[ key ] = data[ key ];
							}
							else {
								current[ key ] += data[ key ];
							}
						}

						// determine radius of node
						current.radius = calcRadii( current );
					//}

					// ...and previous = the data just "replaced"
					// with the latest data
					previous = clone( current );

					// if the ids length is 1 then
					// we give the node some initial properties
					if( current.id.length === 1 ) {
						// is this necessary?
					}

					// push all of our date into one master data source
					var d = {
						animator: null,
						label: null,
						current: current,
						previous: previous,
						clear:	false
					};

					// add data within node
					node.data = d;

					// name the node so we can find it later
					node.name = '__' + node.id;
					node.style = _style;
					// node.blendMode = 'screen';

					// ...otherwise let's check if a dot exists
					// and modify it's attributes
					if( current.id.length >= 1 ) {
						var pos = node.position;
						// node.bounds.size = new Size(
						// 	current.radius[0],
						// 	current.radius[0]
						// );
						node.position = pos;
						// node.fillColor = values.sonar_bikes.lerp( values.sonar_traffic, 1/current.id.length );

						// update node data
						node.data = d;
					}

				} // end if( node...

			} // end for


			// iterate through the entire group
			// as a group, and add animator (FStepper)
			// and labels (MarkerFade) as necessary
			for( var i=0; i<_group.children.length; i++ ) {
				var node = _group.children[i];

				if( node.data.current != undefined ) {
					// create an animation stepper 
					// this handles the transitioning from 
					// previous to current (in the case of an update)
					var animator = new ft.FStepper();
					animator.setMillis( animationMillis );
					animator.setDelta( 0.0 );

					// add animator to internal data
					node.data.animator = animator;

					// create type
					if( bLabeled ) {
						// is the label key an array?
						var content = (typeof labelKey === 'object')
							? [ node.data.current[ labelKey[0] ], labelKey[1] ]
							: node.data.current[ labelKey ];
 
						// create type
						var label = new MarkerFade(
							ft,
							content,
							new Point( node.position.x, node.position.y + 72 ),
							labelFadeMillis,
							labeldelayMillis
						);
						label.path.fillColor = 'white';
						label.toggle();

						// add label to internal data
						node.data.label = label;

					}

					// execute callback function (if defined)
					if( func != undefined ) {
						func( event, node, bLoad );
					}
					
				} // end if( node.data.current...
			
			}

			// data loaded successfully
			bLoad = true;
			if( values.bVerbose ) console.log( _group.name + ' loaded! ' + bLoad );
		}

	};

	/**
	 *
	 *	Update Data
	 *
	 *	@param {Array} updatedDataArray
	 *					the array of data
	 *	@param {Array} updatedDataKeys
	 *					the keys of the dataArray within the nodes which should be updated
	 *	@param {Function} func
	 *					a function/callback which can be defined
	 *					for "custom" node updating operations
	 *					passed variables include: event, node, bUpdate
	 */
	function dataRefresh( updatedDataArray, updatedDataKeys, func ) {
		// update data array
		_dataArr = updatedDataArray;
		// if data keys are added during refresh
		_dataKeys = (updatedDataKeys != undefined) ? updatedDataKeys : _dataKeys;

		for( var i=0; i<_dataArr.length; i++ ) {
			// var node = _group.children[ _dataArr[i].node ];
			// var node = f.findByName( _group.children, ('__' + _dataArr[i].node) );
			// var node = _group.children[ ('__' + _dataArr[i].node) ];

			// get the node that corresponds
			// to the given data
			var node = getNode( _dataArr[i] );

			try {
				var data = node.data;

				// check if the node actually
				// contains data
				if( data.current != null ) {
					// check the clear flag, this tells
					// us whether certain values have 
					// been reset or not
					if( !data.clear ) {
						// save current as previous
						data.previous = clone( data.current );

						// clear current values
						// based on dataKeys
						for( var k=0; k<_dataKeys.length; k++ ) {
							// reset counts to 0
							data.current[ _dataKeys[k] ] = 0;
						}
						data.clear = true;
					}

					// update data
					for( var k=0; k<_dataKeys.length; k++ ) {
						data.current[ _dataKeys[k] ] += _dataArr[i][ _dataKeys[k] ];
					}

					// determine radius of node
					data.current.radius = calcRadii( data.current );

				} // end if( data.current...
			
			} 
			catch(err) {
				if( values.bVerbose ) console.log( _group.name + '.refresh() ERROR: ' + node + ': ' + err );
			}

		} // end for

		// a method for creating a temp values
		// _dataArr.temp = ( func( _dataArr ) != null ) ? func( _dataArr ) : null;
	};

	/**
	 *
	 *	Update (re-draw) Nodes
	 *
	 *	@param {Event} event
	 *					an event item to sync the animations
	 *	@param {boolean} bDraw
	 *					toggles the display/drawing of the nodes
	 *	@param {Function} func
	 *					a function/callback which can be defined
	 *					for "custom" node updating operations
	 *					passed variables include: event, node, bUpdate
	 */
	 function nodeUpdate( event, bDraw, func ) {
		if( bLoad ) {

			for( var i=0; i<_group.children.length; i++ ) {
				// properties
				var node = _group.children[i];
				var pos = node.position;

				// check if the node actually
				// contains data, they're the only
				// ones we actually care about
				if( node.data.current != null ) { //&& bDraw ) {
					// keep animator in sync
					var animator = node.data.animator;
					animator.update( event.time );

					// call the passed function with 
					// "pre-" passed variables
					if( func != undefined ) {
						func( event, node, bUpdate );
					}
					else {
						nodeUpdateDefault( event, node );
					}

				}
				else {
					// no data, no show
					// node.fillColor = null;
					// node.strokeColor = null;
				}  // end if( node.data.current...

				// always put the node back where it should be
				node.position = pos;

			} // end for

			// all nodes have been cycled through
			// if there was an update, everything
			// is now up-to-date
			if( bUpdate ) {
				bUpdate = false;
			}
		}

		return _group;
	};


	/**
	 *
	 *	Default method for updating Nodes
	 *
	 *	@param {Event} event
	 *					an event item to sync the animations
	 */
	 function nodeUpdateDefault( event, node ) {
		var data = node.data;
		var animator = data.animator;
		var pos = node.position;

		// apply given style to node
		node.style = _style;

		// keep label in sync
		var label;
		if( data.label != undefined ) {
			label = data.label;
			label.update( event );
		}

		// check if an update has been made
		if( bUpdate ) {
			// kick off animator stepper
			animator.setDelta( 0.0 );
			// animator.stepIn();
			animator.toggle();

			if( data.label != null ) {
				var content;
				var bLabelChange = false;
				if( typeof labelKey === 'object' ) {
					bLabelChange = (data.current[ labelKey[0] ] != data.previous[ labelKey[0] ])
						? true
						: false;
					content = [ data.current[ labelKey[0] ], labelKey[1] ];
				}
				else {
					bLabelChange = (data.current[ labelKey ] != data.previous[ labelKey ])
						? true
						: false;
					content = data.current[ labelKey ];
				}

				// did the data change?
				// show the label
				if( bLabelChange ) {
					// update label content
					label.setContent( content );

					// kick off label stepper
					label.toggle();
				}
			}
		}
		else {
			if( animator.delta < 0.0 || animator.delta > 1.0 ) {
				// no update, just pulse
				// TODO: fix pulse flickering
				// pulse();
			}
		} // end if( bUpdate...


		if( !animator.isDone() ) {
			// the animator stepper is still running
			// so let's be sure to animate
			var start = data.previous.radius[0];
			var stop = data.current.radius[0];
			node.bounds.size = new Size( 
				Calculation.lerp( start, stop, animator.delta ),
				Calculation.lerp( start, stop, animator.delta )
			);
		}
		else {
			animator.stop();
			// the updates have been animated
			// prepare the data to allow new info
			// data.clear = false;
		} // end if( !animator...


		// if( values.bVerbose ) console.log( 'label', label.isDone() );
		if( data.label != null ) {
			if( label.isDone() && data.clear ) {
				label.toggle()
				data.clear = false;
			}
		} // end if( data.label...

		return node;
	};


	function pulse( node ) {
		// var start = data.current.radius[0]
		// var stop = data.current.radius[1]
		// node.bounds.size = new Size( 
		//	Calculation.lerp( start, stop, pulse.delta ),
		//	Calculation.lerp( start, stop, pulse.delta )
		// );
	};


	//
	// Sets
	//
	/**
	 *
	 *	Calculate Radius
	 *
	 *	@param {Array} nodeDataArray
	 *					the array of data (local to the node)
	 *		
	 *	@return array of radii values
	 */
	function calcRadii( nodeDataArray ) {
		// this one's a doozy!
		var arr = [];

		// find the radius object within
		// the passed data keys 
		for( var k=0; k<_dataKeys.length; k++ ) {

			if( typeof _dataKeys[k] === 'object' && 
				Object.keys( _dataKeys[k] )[0].indexOf('radius') !=-1 ) {
				for( var key in _dataKeys[k] ) {

					// based on the components listed
					// in the arrays, determin the numerator
					// and denominator for the radii
					var num, den;

					// if the value passed is a number
					// i.e { radius: [1,8]} OR
					// { radius: 0.5}
					if( typeof _dataKeys[k][ key ] == 'number' ) {
						// a conditional for handling an
						// array versus single value
						if( _dataKeys[k][ key ].length == undefined ) {
							num = _dataKeys[k][ key ];
							den = 1;
						}
						else {
							num = _dataKeys[k][ key ][0];
							den = _dataKeys[k][ key ][1];
						}
					}
					// if the value passed is an object <strike>string</strike>
					// it MUST match one of the data points
					// i.e. { radius: ['value','maxValue']}
					else if( typeof _dataKeys[k][ key ] == 'object' ) {
						num = nodeDataArray[ _dataKeys[k][ key ][0] ];
						den = nodeDataArray[ _dataKeys[k][ key ][1] ];
					}
					// if nothing is passed
					// then the size will be 100%
					else {
						num = 1;
						den = 1;
					}


					// calculate the radius, this is a clamped value
					// between the sizing.min and the sizing.max
					// and it's snapped to the sizing.snap value
					// oh... and it's multiplied by two
					var radius = Calculation.clamp(
						Calculation.snap(
							(num/den)*sizing.max,	// Number of free slots
							sizing.snap
						),
						sizing.min,
						sizing.max
					)*2;

					// push into the radius data holder
					arr.push(radius);	
				}


			}

		}

		return arr;
	};

	/**
	 *	set the style attributes for each node
	 *
	 *	@param style
	 *			object literal Array of various style attributes
	 *
	 *	@example
	 *		var style = {
	 *			strokeColor: 'black',
	 *			dashArray: [4, 10],
	 *			strokeWidth: 4,
	 *			strokeCap: 'round'
	 *		};
	 */
	function setNodeStyle( style ) {
		_style = style;
	};

	/**
	 *
	 *	set the data keys
	 *
	 *	@param {Array} dataKeys
	 *					the keys of the dataArray within the nodes which should be updated
	 */
	function setDataKeys( dataKeys ) {
		// if data keys are added during init
		_dataKeys = (dataKeys != undefined) ? dataKeys : _dataKeys;

		// determine if there's a label flag
		for( var k=0; k<_dataKeys.length; k++ ) {

			if( typeof _dataKeys[k] === 'object' && 
				Object.keys( _dataKeys[k] )[0].indexOf('label') !=-1 ) {
				// there is a label key
				bLabeled = true;

				for( var key in _dataKeys[k] ) {
					labelKey = _dataKeys[k][ key ];
				}
			}

		}
	};


	//
	// Gets
	//
	/**
	 *
	 *	find the node based on the data properties
	 *
	 *	@param {Array} data
	 *					the array of data
	 */
	function getNode( data ) {
		// normalize longitude & latitude values
		var x = Calculation.norm( data.lon, lonThreshold.min, lonThreshold.max );
		var y = Calculation.norm( data.lat, latThreshold.min, latThreshold.max );

		// create local point
		var pt = new Point( x*view.bounds.width, y*view.bounds.height );

		// find the node within the grid
		// that is closest to the data's local point
		return findClosestItem( _group, pt );
	};

	function getLoad() {
		return bLoad;
	};

	function getUpdate(val) {
		// a bit dirty, but fuck it
		bUpdate = (val != undefined) ? val : bUpdate;
		return bUpdate;
	};

	function getNodeStyle() {
		return _style;
	};

	function getGroupName() {
		return _group.name;	
	};



	//
	// Instantiate
	//
	setDataKeys( dataKeys );



	//
	// return public values
	//
	return {
		// properties
		isLoaded:	getLoad,
		isUpdated:	getUpdate,

		// methods
		init:		dataInit,
		refresh:	dataRefresh,
		draw:		nodeUpdate,

		// sets
		setStyle:	setNodeStyle,

		// gets
		getStyle:	getNodeStyle,
		getName:	getGroupName
	}

};

// ------------------------------------------------------------------------
/**
 *	@param {Group} searchGroup
 *
 *	@param {Point} searchPoint
 *
 *	@return {Point} closest
 *
 */
var findClosest = function( searchGroup, searchPoint ) {
	// assume the first point is the closest
	var closest = searchGroup.children[0].position;
	// set our distance to that assumption
	var distance = closest.getDistance(searchPoint);

	for( var i=0; i<searchGroup.children.length; i++ ) {
		var p = searchGroup.children[i].position;
		// iteratively hone in on the closest point
		// this could be drastically more efficient (/unnecessary)
		// if i could sort the array by distance
		if( p.getDistance(searchPoint) < distance ) {
			distance = p.getDistance(searchPoint);
			closest = p;
		}
	}

	return closest;
};

/**
 *	@param {Group} searchGroup
 *
 *	@param {Point} searchPoint
 *
 *	@return {Item} closest
 *
 */
var findClosestItem = function( searchGroup, searchPoint ) {
	// assume the first item is the closest
	var closest = searchGroup.children[0];
	// set our distance to that assumption
	var distance = closest.position.getDistance(searchPoint);

	for( var i=0; i<searchGroup.children.length; i++ ) {
		var path = searchGroup.children[i];
		var p = path.position;
		// iteratively hone in on the closest point
		// this could be drastically more efficient (/unnecessary)
		// if i could sort the array by distance
		if( p.getDistance(searchPoint) < distance ) {
			distance = p.getDistance(searchPoint);
			closest = path;
		}
	}

	return closest;
};


// ------------------------------------------------------------------------
/**
 *
 *	Marker text
 *
 *	@param content
 *			a String of text (should be a number)
 *	@param point
 *			the center point of the large text (above)
 *
 *	@example
 *	var text = new Marker(
 *		'Large',
 *		view.bounds.center
 *	);
 *	ttext.path.fillColor = new Color( 1.0, 0.7, 0.0 );
 *
 */
 /**
 *	@param content
 *			an array of Strings [0] = large text [1] = small text
 *	@param point
 *			the center point of the large text (above)
 *
 *	@example
 *	var text = new Marker(
 *		['Large', 'tiny'],
 *		view.bounds.center
 *	);
 *	ttext.path.fillColor = new Color( 1.0, 0.7, 0.0 );
 *
 */
var Marker = function( content, point ) {
	//
	// Properties
	//
	var _group = new Group();
	var _content = content;
	var _typeSizes = [72,15];

	var main = new PointText( point );
	var desc = new PointText( point );
	var underline = new Path.Rectangle( new Point(0,0), new Size(1, 3) );
	

	//
	// Methods
	//
	function init() {	
		// strip out 0 and replace with O
		// _content = replaceZero(_content);
		// _content.replace('0', 'O');

		// the main text
		main.justification = 'center';
		main.font = 'futura-kf';

		// the side descriptor
		desc.justification = 'center';
		desc.font = 'futura-kf-bold';

		// set content
		// setContent( _content );

		// set size and content
		setSize( _typeSizes );

		// add to group
		_group.appendTop( main );
		_group.appendTop( desc );
		_group.appendTop( underline );

		return _group;
	};

	function replaceZero(str) {
		for(var i=0; i<str.length; i++) {
			if( str.charAt(i) == '0') {
				str = str.substr(0, i) + 'O' + str.substr(i+1);
			}
		}
		return str;
	};


	//
	// Sets
	//
	function setSize( arg ) {
		_typeSizes[0] = (arg.length != undefined) ? arg[0] : arg;
		_typeSizes[1] = (arg.length != undefined) ? arg[1] : arg;

		main.fontSize = _typeSizes[0];
		desc.fontSize = _typeSizes[1];

		// reset content with new sizes
		setContent( _content );
	};


	function setContent( content ) {
		_point = point.clone();

		if( typeof _content == 'object' ) {
			_content[0] = replaceZero( content[0] );
			_content[1] = replaceZero( content[1] );

			main.content = _content[0];
			_point.x -= (_content[0].length === 1) ? (main.bounds.size.width*1.2) : (main.bounds.size.width);

			desc.content = _content[1];
			desc.position = _point;
		}
		else {
			_content = replaceZero( content );

			main.content = _content;
			_point.x -= (_content.length === 1) ? (main.bounds.size.width*1.2) : (main.bounds.size.width);
			_point.y -= 18;
			desc.content = 'No.';
			desc.position = _point;
		}

		// the underline
		_point.y += 9;
		underline.bounds.size = new Size(
			desc.bounds.size.width*1.1,
			3
		);
		underline.position = _point;

	};


	//
	// Instantiate
	//
	init();


	//
	// return public values
	//
	return {
		// properties
		path: _group,

		// sets
		setSize: setSize,
		setContent: setContent,

	}
};

/**
 *
 *	an "instance" of Marker that fades out after a certain time
 *
 *	@param ft
 *			instance of FTimer (requires frederickkPaper)
 *	@param content
 *			a String of content (should be a number)
 *	@param point
 *			the center point of the large text (above)
 *	@param fadeMillis
 *			milliseconds it takes to fade text (in or out)
 *	@param delayMillis
 *			milliseconds to before beginning fade (in or out)
 *
 *	@example
 *	var ft = frederickkPaper.FTime;
 *
 *	var ttext = new MarkerFade(
 *		ft,
 *		'Large',
 *		view.bounds.center,
 *		500,
 *		3000
 *	);
 *	ttext.path.fillColor = new Color( 1.0, 0.7, 0.0 );
 *
 *	// within Update()
 *	ttext.update(event);
 *
 */
/**
 *
 *	@param ft
 *			instance of FTimer (requires frederickkPaper)
 *	@param content
 *			an array of Strings [0] = large text [1] = small text
 *	@param point
 *			the center point of the large text (above)
 *	@param fadeMillis
 *			milliseconds it takes to fade text (in or out)
 *	@param delayMillis
 *			milliseconds to before beginning fade (in or out)
 *
 *	@example
 *	var ft = frederickkPaper.FTime;
 *
 *	var ttext = new MarkerFade(
 *		ft,
 *		['Large', 'tiny'],
 *		view.bounds.center,
 *		500,
 *		3000
 *	);
 *	ttext.path.fillColor = new Color( 1.0, 0.7, 0.0 );
 *
 *	// within Update()
 *	ttext.update(event);
 *
 */
  var MarkerFade = function( ft, content, point, fadeMillis, delayMillis ) {
	//
	// Properties
	//
	var _marker;
	var _timerMarker;

	// the delay timer
	delayMillis = (delayMillis != undefined) ? delayMillis : 1000;
	var _timer = new ft.FStepper();
	_timer.setMillis( delayMillis );

	// the fade in/out time
	fadeMillis = (fadeMillis != undefined) ? fadeMillis : 0.5*1000;
	var _fader = new ft.FStepper();
	_fader.setMillis( fadeMillis ); // default: 1 second
	var bFaderDone = false;


	//
	// Methods
	//
	function init() {
		// create the text
		_marker = new Marker(content, point);

		// start with the text faded out
		_fader.stop();
		_fader.setDelta( 0.01 );

		// also start with timer at 0.0
		_timer.stop();
		_timer.setDelta( 0.01 );

		// pass the timers to the data holder of _marker
		_marker.path.data = {
			timer: _timer,
			fader: _fader
		};

		return _marker;
	};

	function toggle() {
		_fader.toggle();
		bFaderDone = false;
	};


	//
	// Sets
	//
	function setSize( arg ) {
		_marker.setSize( arg );	
	};

	function setContent( content ) {
		_marker.setContent( content );
	};

	function setEvent(event) {
		// keep the timer and fader in sync
		_timer.update( event.time );
		_fader.update( event.time );

		// the text is faded in
		// start the timer to keep 
		// it on screen...
		if( _fader.delta > 1.01 && !bFaderDone ) {
			_fader.stop();
			_fader.setDelta( 1.09 );

			_timer.stepIn();
		}

		// handling the fader
		if( _fader.delta <= -0.01 ) {
			_fader.stop();
			_fader.setDelta( 0.0 );

			bFaderDone = true;
		}
		// else {
		//	bFaderDone = false;
		//}

		// if the timer is done
		// toggle the fader to begin fading out
		if( _timer.delta > 1.01 ) {
			_timer.stop();
			_timer.setDelta( 0.0 );

			_fader.toggle();
		}

		// adjust opacity of text
		_marker.path.opacity = _fader.delta;
		// _timerMarker = new TimerClock( _marker.path.position, 20, _timer.delta );
		// _timerMarker.fillColor = new Color( 0.0, 1.0, 0.7 );
		// _timerMarker.opacity = _timer.delta;
	};


	//
	// Gets
	//
	function isDone() {
		return bFaderDone;
	};


	//
	// Instantiate
	//
	init();


	//
	// return public values
	//
	return {
		// properties
		path: _marker.path,

		// methods
		update: setEvent,
		toggle: toggle,

		// sets
		setSize: setSize,
		setContent: setContent,

		// gets
		isDone: isDone
	}

};


// ------------------------------------------------------------------------
/**
 *
 *	A simple 'pie-chart' style timer
 *
 *	@param {Point} center
 *			 the center point of the circle
 *	@param {Number} radius
 *			the radius of the timer clock
 *	@param {Number} time
 *			normalized time value (0.0 - 1.0)
 *
 *	@example
 *
 */
var TimerClock = function( center, radius, time ) {
	// clean out previous instances
	// there has to be a better way to animate objects
	// if( values.bVerbose ) console.log( project.activeLayer.children.length );
	if( project.activeLayer.children['__TimerClock'] ) {
		project.activeLayer.children['__TimerClock'].remove();
	}

	time = (time != undefined) ? time : 1.0;
	var angle = (Math.PI*2.001) * time;

	var from = new Point(
		center.x + radius * Math.cos(Math.PI*0),
		center.y + radius * Math.sin(Math.PI*0)
	);
	var through = new Point(
		center.x + radius * Math.cos(angle/2),
		center.y + radius * Math.sin(angle/2)
	);
	var to = new Point(
		center.x + radius * Math.cos(angle),
		center.y + radius * Math.sin(angle)
	);

	var path = new Path.Arc(from, through, to);
	path.add( center );
	path.name = '__TimerClock';
	return path;
};



// ------------------------------------------------------------------------
// Events
// ------------------------------------------------------------------------
function onResize(event) {
	view.size = event.size;
};

// ------------------------------------------------------------------------
function onMouseUp(event) {
};

function onMouseDown(event) {
};

function onMouseMove(event) {
};

function onMouseDrag(event) {
};


// ------------------------------------------------------------------------
function onKeyDown(event) {
};

function onKeyUp(event) {
};





