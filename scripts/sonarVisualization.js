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
 *	Data
 *
 */
var pulse = 1.0;
var pulsePrev = 1.0;


/*
 *	Transportation
 */
// Bicing
var bicingGroup;
var bicingPrevArr = [];
var bBicingLoad = false;
var bBicingUpdate = false;

// Traffic
var trafficGroup;
var trafficPrevArr = [];
var bTrafficLoad = false;
var bTrafficUpdate = false;

// Busses
var busGroup;
var busPrevArr = [];
var bBusLoad = false;
var bBusUpdate = false;


/*
 *	Weather
 */
var bWeatherLoad = false;

// Temperature
var temperatureGroup;
var temperatureMask;

// Humidty
var humidtyGroup;
var humidtyMask;


/*
 *	debug
 */
var bDebug = false;




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
	colors = {
		black:	new Color( 0.11, 0.11, 0.11 ),

		red:	new Color( 0.89, 0.01, 0.18 ),
		blue:	new Color( 0,	 0.62, 0.89 ),
		yellow:	new Color( 0.97, 0.78, 0 ),

		bass: [
			new Color(  89/255,   0/255, 255/255, 0.2 ),
			new Color( 178/255,   0/255,  89/255, 0.2 ),
			new Color( 225/255,   0/255,  46/255, 0.2 )
		],
		mid: [
			new Color( 255/255, 178/255,   0/255, 0.2 ),
			new Color( 178/255,  89/255,   0/255, 0.2 ),
			new Color( 178/255, 255/255,   0/255, 0.2 )
		],
		treble: [
			new Color(   0/255, 255/255, 178/255, 0.2 ),
			new Color(   0/255, 255/255, 255/255, 0.2 ),
			new Color(   0/255, 178/255, 255/255, 0.2 )
		]
	};



	/*
	 *
	 *	Transportation
	 *
	 */
	// Bicing
	bicingGroup = new Group();

	// Traffic
	trafficGroup = new Group();

	// bus
	busGroup = new Group();



	/*
	 *
	 *	Weather
	 *
	 */
	// Temperature
	temperatureGroup = new Group();

	// Humidty
	humidtyGroup = new Group();



	/*
	 *
	 *	create grid
	 *
	 */
	// in order for the grid to work
	// these values have to be odd numbers
	var cols = 15; //21;
	var rows = 11; //15;

	grid = new Group();

	gridSize = new Size(
		(view.bounds.width - (margins.left)) / cols,
		(view.bounds.height - (margins.top)) / rows
	);

	// draw the grid nodes
	var radius = 3;
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

				var dot = new Path.Circle( pt, radius );
				dot.fillColor = colors.black;
				dot.strokeColor = 'white';

				// add to grid
				grid.appendTop( dot );
			}
			index++;
		}
	}

	// draw the grid lines
	var lines = new Group();
	for( var i=0; i<grid.children.length; i++ ) {
		var dot = grid.children[i];

		// debug
		// var text = new Marker( ['', i.toString()], dot.position );
		// text.fillColor = 'white';

		// draw the grid lines
		var dotFloor = grid.children[i+Math.floor(cols/2)];
		var dotCeil = grid.children[i+Math.ceil(cols/2)];
		if( dotCeil != undefined ) {
			if(i % cols != Math.floor(cols/2)) {
				var line = new Path.Line(
					dot.position,
					dotCeil.position
				);
				line.strokeColor = 'white';
				lines.appendBottom( line );
			}
		}
		if( dotFloor != undefined ) {
			if(i % cols != 0) {
				var line = new Path.Line(
					dot.position,
					dotFloor.position
				);
				line.strokeColor = 'white';
				lines.appendBottom( line );
			}
		}


	}
	grid.appendBottom( lines );



	/*
	 *
	 *	create weather data mask shapes
	 *
	 */
	// TODO: make scalable for any col/row combination
	// each node as percentage of total col*row?
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
	humidtyMask = new Path(
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
	humidtyMask.closed = true;
	humidtyMask.fillColor = null;
	humidtyMask.strokeColor = null;


	// move grid layer to be uppermost
	grid.opacity = 0.2;
	grid.bringToFront();


	console.log( '------------------' );
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
	 *	Initial Loading of Data
	 *
	 */
	// load all of the data in (the first time)
	// checks every 3 seconds until
	// all feeds are intiially loaded
	if( parseInt(event.time) % 3 === 0 ) {
		init();
	}


	/*
	 *
	 *	Pulsing
	 *
	 */
	// + 1.0 + ( (Math.sin(event.time) + {RATE} / {SIZE} );
	//	{RATE} larger = faster
	//	{SIZE} smaller = bigger?
	pulse = 1.0 + ((Math.sin(event.time) + 1) / gridSize.height*2);

	// constantly update Draw()
	Draw();
};


/*
 *
 *	Intervals to refresh data
 *
 */
// Bicing
// update every 3 seconds
var UpdateBicing = setInterval(
	function() {
		if( !bBicingUpdate && bBicingLoad ) {
			console.log( 'UpdateBicing', bBicingUpdate );

			// for( var i=0; i<transportation.bicing.length; i++ ) {
			// 	var b = transportation.bicing[i];

			// 	// temporary feed for
			// 	// debugging/testing only
			// 	b.bikes	= Calculation.randomInt( b.total );
			// 	b.free	= b.total - b.bikes;
			// }
			loadBicing( transportation.bicing );
			bBicingUpdate = true;
		}
	},
	(15*1000)
);

// Traffic
// update every 16 minutes (16*60)
var UpdateTraffic = setInterval(
	function() {
		if( !bTrafficUpdate && bTrafficLoad ) {
			// console.log( 'UpdateTraffic', bTrafficUpdate );

			// build in a method that updates
			// the traffic in half the time
			// by using the "future" datapoint
			for( var i=0; i<transportation.traffic.length; i++ ) {
				var t = transportation.traffic[i];

				// temporary feed for
				// debugging/testing only
				// t.current = Calculation.randomInt( 1,7 );
			}			
			bTrafficUpdate = true;
		}
	},
	(3*1000)
);

// Bus
// update ever 1 minute
var UpdateBus = setInterval(
	function() {
		if( !bBusUpdate && bBusLoad ) {
		}
	},
	(60*1000)
);



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function Draw() {
	var delta = 1;

	/*
	 *
	 *	Transportation
	 *
	 */
	// Bicing
	for( var i=0; i<bicingGroup.children.length; i++ ) {
		var dot = bicingGroup.children[i];

		var b = transportation.bicing[i];
		var bp = bicingPrevArr[i];

		if( bBicingUpdate ) {
			// if( tp.t <= 0.0 ) {
				var radius = Calculation.snap(
					(b.bikes/b.total)*gridSize.height,		// Number of bikes in the station
					// (b.free/b.total)*gridSize.height,	// Number of free slots
					gridSize.height/3
				);
				// radius = Calculation.clamp(radius, 12,gridSize.height);
			// }

			// scale the dots up
			dot.scale(
				(radius / bp.radiusPrev)
			);

			bp.radiusPrev = radius;
		}
		else {
			// otherwise idle pulse the dots
			dot.scale(
				pulse / pulsePrev
			);
		}
	}
	bBicingUpdate = false;

	// Traffic
	for( var i=0; i<trafficGroup.children.length; i++ ) {
		var dot = trafficGroup.children[i];

		var t = transportation.traffic[i];
		var tp = trafficPrevArr[i];

		if( bTrafficUpdate ) {
			// if( tp.t <= 0.0 ) {
				var radius = Calculation.snap(
					Calculation.map( t.current, 1,7, 12,gridSize.height ), //(b.bikes/total)*gridSize.height,
					gridSize.height/3
				);
				// radius = Calculation.clamp(radius, 12,gridSize.height);
			// }

			// handle animation
			// tp.t += 0.01;
			// tp.t = 1.0;
			// var scalar = ft.ease.outQuart(tp.t);
			// radius *= scalar;

			// scale the dots up
			dot.scale(
				(radius / tp.radiusPrev)
			);

			// if( tp.t >= 1.0 ) {
			// 	// we're done animating
			// 	// flag the updating to stop
			// 	bTrafficUpdate = false;
			// 	tp.t = 0.0;
			// }

			tp.radiusPrev = radius;
		}
		else {
			// when idle pulse the dots
			dot.scale(
				pulse / pulsePrev
			);
		}
	}
	bTrafficUpdate = false;


	/*
	 *
	 *	Weather
	 *
	 */
	// // Temperature
	// for( var i=0; i<temperatureGroup.children.length; i++ ) {
	// 	var face = temperatureGroup.children[i];

	// }

	// save pulse value for next time
	pulsePrev = pulse;
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

	//
	//	Bicing
	//
	if( transportation.bicing.length > 0 && !bBicingLoad ) {
		for( var i=0; i<transportation.bicing.length; i++ ) {
			var b = transportation.bicing[i];
			// console.log( b.name );

			// global	
			// http://help.arcgis.com/en/data-appliance/4.0/help/basemap/index_Left.htm#CSHID=world_boundaries_places.htm%3F|StartTopic=content%2Fworld_boundaries_places.htm%3F|SkinName=agda
			// var x = Calculation.norm( b.lon, 179.999989, -179.999989 );
			// var y = Calculation.norm( b.lat, 85.000000, -85.000000 );

			// local
			var x = Calculation.norm( b.lon, 2.111615, 2.219377 );
			var y = Calculation.norm( b.lat, 41.357067, 41.450882 );

			var pt = new Point( x*view.bounds.width, y*view.bounds.height );

			var radius = Calculation.snap(
				(b.bikes/b.total)*gridSize.height,		// Number of bikes in the station
				// (b.free/b.total)*gridSize.height,	// Number of free slots
				gridSize.height/3
			);

			bicingPrevArr.push({
				radiusPrev: radius,
				t: 0.0
			});
			
			var dot = new Path.Circle( 
				getClosest( grid, pt ),
				radius
			)
			dot.fillColor = colors.bass[0];
			dot.strokeColor = null;
			// dot.blendMode = 'screen';

			// pass the original data through
			// so that we have it in the group
			dot.data = b;
			
			// add to group
			bicingGroup.appendTop( dot );
		}

		// remove all duplicate dots

		console.log( 'initial bicing load!' );
		bBicingLoad = true;
	}


	//
	//	Traffic
	//
	if( transportation.traffic.length > 0 && !bTrafficLoad ) {
		for( var i=0; i<transportation.traffic.length; i++ ) {
			var t = transportation.traffic[i];

			var x = Calculation.norm( t.lon, 2.111615, 2.219377 );
			var y = Calculation.norm( t.lat, 41.357067, 41.450882 );

			var pt = new Point( x*view.bounds.width, y*view.bounds.height );
			var radius = Calculation.snap(
				Calculation.map( t.current, 1,7, 12,gridSize.height ), //(b.bikes/total)*gridSize.height,
				gridSize.height/3
			);
			// radius = Calculation.clamp(radius, 12,gridSize.height);

			trafficPrevArr.push({
				radiusPrev: radius,
				t: 0.0
			});

			var dot = new Path.Circle( 
				getClosest( grid, pt ),
				radius
			)
			dot.fillColor = colors.bass[1];
			dot.strokeColor = null;
			// dot.blendMode = 'screen';
			// pass the original data through
			// so that we have it in the group
			dot.data = t;
			
			// add to group
			trafficGroup.appendTop( dot );
		}

		console.log( 'initial traffic load!' );
		bTrafficLoad = true;
	}


	//
	//	Busses
	//
	if( transportation.traffic.length > 0 && !bBusLoad ) {
		console.log( 'initial busses load!' );
		bBusLoad = true;
	}



	/*
	 *
	 *	Weather
	 *
	 */
	if( weather.temperature != null && !bWeatherLoad ) {
		// create triangulated pattern
		var triangulate = new Triangulate( nodePoints );
		var tcolor, hcolor;

		// draw faces
		for( var i=0; i<triangulate.length; i++ ) {
			var triangle = triangulate[i];

			// draw triangle
			face = new Path();
			face.add( triangle.p1 );
			face.add( triangle.p2 );
			face.add( triangle.p3 );
			face.closed = true;

			//
			//	Temperature
			//
			var tamt = Calculation.norm(
				weather.temperature,
				weather.temperatureMin, weather.temperatureMax
			);
			tcolor = colors.mid[0].lerp( colors.bass[0], tamt );
			if( i % 3 == 0 ) {
				tcolor.lighten( 
					Calculation.norm( i, 0,triangulate.length )*0.5
				);
			}
			face.fillColor = tcolor;
			face.strokeColor = tcolor;
			face.opacity = Math.abs(tamt); //*0.618;
			// face.blendMode = 'screen';

			// add to group
			temperatureGroup.appendTop( face );

			//
			//	Hudmity
			//
			hcolor = colors.treble[0].lerp( colors.treble[2], weather.humidty/100 );
			if( i % 3 == 0 ) {
				hcolor.lighten( 
					Calculation.norm( i, triangulate.length,0 )*0.5
				);
			}
			var hface = face.clone();
			hface.fillColor = hcolor;
			hface.strokeColor = hcolor;
			// hface.blendMode = 'screen';

			// add to group
			humidtyGroup.appendTop( hface );
		}

		// Temperature
		temperatureMask.clipMask = true;
		temperatureGroup.appendTop( temperatureMask );
		var temperatureText = new Marker( 
			['', weather.temperature.toString() + '\xB0'], 
			new Point( view.bounds.size.width-(margins.right*0.5), view.bounds.center.y )
		);
		temperatureText.fillColor = tcolor;

		// Humidty
		humidtyMask.clipMask = true;
		humidtyGroup.appendTop( humidtyMask );
		humidtyGroup.opacity = Math.abs(weather.humidty/100)*0.618;
		var humidtyText = new Marker( 
			['', weather.humidty.toString()+'\x25'], 
			new Point( (margins.left*0.5), view.bounds.center.y )
		);
		humidtyText.fillColor = hcolor;


		console.log( 'initial weather load!' );
		bWeatherLoad = true;
	}

};

// ------------------------------------------------------------------------
var getClosest = function( searchGroup, searchPoint ) {
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

// ------------------------------------------------------------------------
var Marker = function(text, point) {
	var _point = point.clone();
	var group = new Group();


	function init() {	
		// strip out 0 and replace with O
		// text = replaceZero(text);
		// text.replace('0', 'O');

		// the main text
		main = new PointText( _point );
		main.justification = 'center';
		main.fontSize = 72;
		main.font = 'Futura-kf';

		// the side descriptor
		desc = new PointText( _point );
		desc.justification = 'center';
		desc.fontSize = 15;
		desc.font = 'Futura-kf-Bold';

		if( typeof text == 'object' ) {
			text[0] = replaceZero(text[0]);
			text[1] = replaceZero(text[1]);

			main.content = text[0];
			_point.x -= (text[0].length === 1) ? (main.bounds.size.width*1.5) : (main.bounds.size.width);
			desc.content = text[1];
		}
		else {
			text = replaceZero(text);

			main.content = text;
			_point.x -= (text.length === 1) ? (main.bounds.size.width*1.5) : (main.bounds.size.width);
			_point.y -= 18;
			desc.content = 'No.';
		}

		// the underline
		_point.y += 4.5;
		var underline = new Path.Rectangle(
			new Point(0,0),
			new Size(desc.bounds.size.width*1.1, 3)
		);
		underline.position = _point;

		// add to group
		group.appendTop( main );
		group.appendTop( desc );
		group.appendTop( underline );

		return group;
	};

	function replaceZero(str) {
		for(var i=0; i<str.length; i++) {
			if( str.charAt(i) == '0') {
				str = str.substr(0, i) + 'O' + str.substr(i+1);
			}
		}
		return str;
	};


	return init();
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





