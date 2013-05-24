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
var sizing;
var lonThreshold, latThreshold;

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
// TODO: multiple pulses?
var pulse;


/*
 *	Transportation
 */
// Bicing
var bicingGroup;
var bBicingLoad = false;
var bBicingUpdate = false;


/*
 *	debug
 */
var bDebug = false;
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

	// set the min and max longitude & latitude values 
	lonThreshold = {
		min: 2.111615,
		max: 2.219377
	};
	latThreshold = {
		min: 41.357067,
		max: 41.450882
	};

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
				node.fillColor = colors.black;
				node.strokeColor = 'white';

				// add to grid
				grid.appendTop( node );
			}
			index++;
		}
	}


	//
	//	Transportation
	//

	// each data point is simply a clone
	// of the original grid

	// Bicing
	bicingGroup = grid.clone();





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
	grid.appendBottom( lines );

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
	 *	Stepper Syncing
	 *
	 */
	pulse.update( event.time );
	if( pulse.isDone() ) {
		pulse.toggle();
	}
	if( bDebug ) {
		debugPath = new TimerClock( view.bounds.center, 100, pulse.delta );
		debugPath.fillColor = new Color( 0.0, 1.0, 0.7 );
		debugPath.opacity = 0.618;
	}


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
	// pulse = ((Math.sin(event.time*2)) / sizing.max);

	// constantly update Draw()
	// Draw();

	bBicingUpdate = UpdateGroup( event, bicingGroup, bBicingLoad, bBicingUpdate );
};


/*
 *
 *	Intervals to refresh data
 *
 */
// Bicing
// update every 5 seconds
var UpdateBicing = setInterval(
	function() {
		if( !bBicingUpdate && bBicingLoad ) {
			for( var i=0; i<transportation.bicing.length; i++ ) {
				var b = transportation.bicing[i];

				// temporary feed for
				// debugging/testing only
				b.bikes	= Calculation.randomInt( b.total );
				b.free	= b.total - b.bikes;
			}
			// get the new json feed
			// loadBicing( transportation.bicing );

			var dataUpdateKeys = [ 'total', 'bikes', 'free' ]; // , 'radius' ];
			UpdateGroupData( bicingGroup, transportation.bicing, dataUpdateKeys );
			bBicingUpdate = true;

			console.log( 'Updated Bicing', bBicingUpdate );
		}
	},
	(5*1000)
);



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function UpdateGroupData( group, dataArr, dataUpdateKeys ) {
	for( var i=0; i<dataArr.length; i++ ) {
		// var node = group.children[ dataArr[i].node ];
		var node = f.findByName( group.children, ('__' + dataArr[i].node) );
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
				// based on dataUpdateKeys
				for( var k=0; k<dataUpdateKeys.length; k++ ) {
					// reset counts to 0
					data.current[ dataUpdateKeys[k] ] = 0;
				}
				data.clear = true;
			}

			// update data
			for( var k=0; k<dataUpdateKeys.length; k++ ) {
				data.current[ dataUpdateKeys[k] ] += dataArr[i][ dataUpdateKeys[k] ];
			}

			// determine radius of node
			data.current.radius = [
				Calculation.snap(
					(data.current.free/data.current.total)*sizing.max,	// Number of free slots
					sizing.snap
				)*2,
				Calculation.snap(
					(data.current.bikes/data.current.total)*sizing.max,	// Number of bikes in the station
					sizing.snap
				)*2,
			];

		} // end if( data.current...

	} // end for

};

var debugAnimator;
function UpdateGroup( event, group, bLoad, bUpdate ) {
	if( bLoad ) {
		for( var i=0; i<group.children.length; i++ ) {
			var node = group.children[i];
			var data = node.data;
			var pos = node.position;

			// check if the node actually
			// contains data
			if( data.current != null ) {
				// keep animator in sync
				var animator = data.animator;
				animator.update( event.time );

				// check if an update has been made
				if( bUpdate ) {
					// kick off animator stepper
					// animator.setDelta( 0.0 );
					// animator.stepIn();
					animator.toggle();
				}
				else {
					if( animator.delta <= 0.0 || animator.delta >= 1.0 ) {
						// no update, just pulse
						// TODO: fix pulse flickering
						// var start = data.current.radius[0]
						// var stop = data.current.radius[1]
						// node.bounds.size = new Size( 
						// 	Calculation.lerp( start, stop, pulse.delta ),
						// 	Calculation.lerp( start, stop, pulse.delta )
						// );
					}
				}

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
				}

			}
			else {
				// no data, no show
				node.fillColor = null;
				node.strokeColor = null;
			}
			node.position = pos;

		}

		// all nodes have been cycled through
		// if there was an update, everything
		// is now up-to-date
		if( bUpdate ) {
			return false;
		}
	}
};



// ------------------------------------------------------------------------
function Draw() {

};



// ------------------------------------------------------------------------
// Methods
// ------------------------------------------------------------------------
/**
 *
 *	Initial loading of Data
 *
 */
function init() {
	/*
	 *
	 *	Transportation
	 *
	 */

	//
	//	Bicing
	//
	// TODO:	make into a function?

	if( transportation.bicing.length > 0 && !bBicingLoad ) {
		for( var i=0; i<transportation.bicing.length; i++ ) {
			// incoming data
			var b = transportation.bicing[i];

			// normalize longitude & latitude values
			var x = Calculation.norm( b.lon, lonThreshold.min, lonThreshold.max );
			var y = Calculation.norm( b.lat, latThreshold.min, latThreshold.max );

			// create local point
			var pt = new Point( x*view.bounds.width, y*view.bounds.height );

			// find the node within the grid
			// that is closest to the data's local point
			var node = findClosestItem( bicingGroup, pt );

			if( node != undefined ) {
				// since we now node which represents
				// the data point, we'll push that back
				// into the master data array
				b.node = node.id;

				// create data structure
				// this is where all of the information is stored that we need
				// data comes in two flavors...
				// current = the latest data
				var current, previous;
				if( node.data.current == undefined ) {
					current = {
						ids:	[],	// keep track of what ids are represented by this node (array)
						total:	0,	// the total number of bike represented = (##.free + ##.bikes) + (...)
						bikes:	0,	// the number of bikes "currently" at the station
						free:	0,	// the total number of "free" slots
					};
				}
				else {
					current = node.data.current;
				}

				// if (!$.inArray(b.id, data.ids)) {
					// this id hasn't been logged yet
					// so push it's data into the node
					current.ids.push( b.id );
					current.total += b.total;
					current.bikes += b.bikes;
					current.free += b.free;
					// determine radius of node
					current.radius = [
						Calculation.snap(
							(current.free/current.total)*sizing.max,	// Number of free slots
							sizing.snap
						)*2,
						Calculation.snap(
							(current.bikes/current.total)*sizing.max,	// Number of bikes in the station
							sizing.snap
						)*2,
					];
				// }

				// ...and previous = the data just "replaced"
				// with the latest data
				previous = current;
				// previous.radius = node.bounds.height;


				// create an animation stepper 
				// this handles the transitioning from 
				// previous to current (in the case of an update)
				var animator = new ft.FStepper();
				animator.setMillis( 500 );
				animator.setDelta( 0.0 );


				// push all of our date into one master data source
				var data = {
					animator: animator,
					current: current,
					previous: previous,
					clear:	false
				};

				// add data within node
				node.data = data;

				// if the ids length is 1 then
				// we give the node some initial properties
				if( current.ids.length === 1 ) {
					node.name = '__' + node.id;
					node.fillColor = colors.bass[0];
					node.strokeColor = null;
				}

				// otherwise let's check if a dot exists
				// and modify it's attributes
				if( current.ids.length >= 1 ) {
					var pos = node.position;
					node.bounds.size = new Size(
						current.radius[0],
						current.radius[0]
					);
					node.position = pos;
					node.fillColor = colors.bass[0].lerp( colors.bass[1], 1/current.ids.length );

					// update node data
					node.data = data;
				}

			} // end if( node...

		} // end for

		console.log( 'initial bicing load!' );
		bBicingLoad = true;

	} // end if( trans...

};

// ------------------------------------------------------------------------
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
 * 	var text = new Marker(
 *		'Large',
 *		view.bounds.center
 *	);
 *	ttext.fillColor = new Color( 1.0, 0.7, 0.0 );
 *
 */
 /**
 *	@param content
 *			an array of Strings [0] = large text [1] = small text
 *	@param point
 *			the center point of the large text (above)
 *
 *	@example
 * 	var text = new Marker(
 *		['Large', 'tiny'],
 *		view.bounds.center
 *	);
 *	ttext.fillColor = new Color( 1.0, 0.7, 0.0 );
 *
 */
var Marker = function( content, point ) {
	var _point = point.clone();
	var _group = new Group();

	function init() {	
		// strip out 0 and replace with O
		// content = replaceZero(content);
		// content.replace('0', 'O');

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

		if( typeof content == 'object' ) {
			content[0] = replaceZero(content[0]);
			content[1] = replaceZero(content[1]);

			main.content = content[0];
			_point.x -= (content[0].length === 1) ? (main.bounds.size.width*1.2) : (main.bounds.size.width);
			desc.content = content[1];
			desc.position = _point;
		}
		else {
			content = replaceZero(content);

			main.content = content;
			_point.x -= (content.length === 1) ? (main.bounds.size.width*1.2) : (main.bounds.size.width);
			_point.y -= 18;
			desc.content = 'No.';
			desc.position = _point;
		}

		// the underline
		_point.y += 9;
		var underline = new Path.Rectangle(
			new Point(0,0),
			new Size(desc.bounds.size.width*1.1, 3)
		);
		underline.position = _point;

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


	return init();
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
 * 	var ttext = new MarkerFade(
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
 * 	var ttext = new MarkerFade(
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

	// the fade out time
	fadeMillis = (fadeMillis != undefined) ? fadeMillis : 0.5*1000;
	var _fader = new ft.FStepper();
	_fader.setMillis( fadeMillis ); // default: 1 second
	var isDone = false;


	//
	// Methods
	//
	function setEvent(event) {
		// handling the delay timer
		_timer.update( event.time );
		// stop the delay timer and reset() it
		if( _timer.isDone() ) {
			_timer.stop();
			_fader.toggle();
		}

		// handling the fader
		_fader.update( event.time );
		// stop the fader and reset() it
		// if( _fader.delta < 0.0  || _fader.delta > 1.0 ) {
		if( _fader.isDone() ) {
			_fader.stop();
			if( _fader.delta < 0.0 ) _fader.setDelta( 0.0 );
			if( _fader.delta > 1.0 ) _fader.setDelta( 1.0 );
		}
		isDone = _fader.isDone();

		// adjust opacity of text
		_marker.opacity = _fader.delta;
		_timerMarker = new TimerClock( _marker.position, 20, _timer.delta );
		_timerMarker.fillColor = new Color( 0.0, 1.0, 0.7 );
		// _timerMarker.opacity = _timer.delta;
	};

	function toggle() {
		_timer.toggle();
	};

	function init() {
		// create the text
		_marker = new Marker(content, point);

		// pass the timers to the data holder of _marker
		_marker.data = {
			timer: _timer,
			fader: _fader
		};

		return _marker;
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
		path: _marker,

		// methods
		update: setEvent,
		toggle: toggle,
		isDone: isDone
	}

};


// ------------------------------------------------------------------------
// TODO:	create a class that can grow
//			inject.Path?
var Ring = function(event) {
	var path;

	return path;
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
	// console.log( project.activeLayer.children.length );
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





