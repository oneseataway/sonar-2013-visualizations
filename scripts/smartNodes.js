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
var bicing;
var bicingNodeGroup;

// Traffic
var traffic;
var trafficNodeGroup;


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
	bicingNodeGroup = grid.clone();
	bicingNodeGroup.name = 'Bicing';

	// create the data structures
	bicing = new DataHandler( 
		bicingNodeGroup,
		transportation.bicing, 
		{
			id:		[],	// keep track of what ids are represented by this node (array)
			total:	0,	// the total number of bike represented = (##.free + ##.bikes) + (...)
			bikes:	0,	// the number of bikes "currently" at the station
			free:	0,	// the total number of "free" slots
			radius: []	// two radii for pulsing between (pulsing optional)
		},
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

	// Traffic
	trafficNodeGroup = grid.clone();
	trafficNodeGroup.name = 'Traffic';

	// create the data structures
	traffic = new DataHandler( 
		trafficNodeGroup,
		transportation.traffic, 
		{
			id:			[],	// keep track of what ids are represented by this node (array)
			time:		0,	// what time is the traffic happening
			current:	0,	// the current traffic situation
			future:		0,	// the predicted traffic situation
			radius: 	[]	// two radii for pulsing between (pulsing optional)
		},
		[
			'time',
			'current',
			'future',
			{
				radius1: ['current'],
				radius2: ['future']
			}
		]
	 );



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
	 *	Update Visualizations
	 *
	 */
	// if( parseInt(event.time) % 3 === 1 ) {
		bicing.draw( event );
		traffic.draw( event );
	// }
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
		if( !bicing.isUpdated() && bicing.isLoaded() ) {
			// temporary feed for
			// debugging/testing only
			for( var i=0; i<transportation.bicing.length; i++ ) {
				var b = transportation.bicing[i];
				b.bikes	= Calculation.randomInt( b.total );
				b.free	= b.total - b.bikes;
			}
			// get the new json feed
			// loadBicing( transportation.bicing );

			// push the data into the group
			bicing.refresh( transportation.bicing );
			bicing.isUpdated(true);

			console.log( 'Updated Bicing', bicing.isUpdated() );
		}
	},
	(10*1000)
);

// Traffic
// update every 16 minutes (16*60)
var UpdateTraffic = setInterval(
	function() {
		if( !traffic.isUpdated() && traffic.isLoaded() ) {
			// console.log( 'UpdateTraffic', bTrafficUpdate );

			// temporary feed for
			// debugging/testing only
			for( var i=0; i<transportation.traffic.length; i++ ) {
				var t = transportation.traffic[i];
				t.current = Calculation.randomInt( 1,7 );
				t.future = Calculation.randomInt( 1,7 );
			}			
			// get the new json feed
			// loadTraffic( transportation.traffic );

			// push the data into the group
			traffic.refresh( transportation.traffic );
			traffic.isUpdated(true);

			console.log( 'Updated Traffic', traffic.isUpdated() );
		}
	},
	(3*1000)
);



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function Draw() {

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

};


/*
 *	@param {Group} pathGroup
 *					the group of items to push the data into
 *	@param {Array} dataArray
 *					the array of data
 *	@param {Array} dataArrayStructure
 *					an object literal Array of the strucutre and
 *					keys which should be infused within the group
 *	@param {Array} dataKeys
 *					the keys of the dataArray within the nodes which should be updated
 */
var DataHandler = function( pathGroup, dataArray, dataArrayStructure, dataKeys ) {
	//
	// Properties
	//
	var _group = pathGroup;

	var _dataArr = dataArray;
	var _dataStruct = dataArrayStructure;
	var _dataKeys = dataKeys;

	var animationMillis = 500;

	var bLoad = false;
	var bUpdate = true;



	//
	// Methods
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
			if( typeof _dataKeys[k] === 'object' ) {

				for( var key in _dataKeys[k] ) {
					// based on the components listed
					// in the arrays, determin the numerator
					// and denominator for the radii
					var num = nodeDataArray[ _dataKeys[k][ key ][0] ];
					var den = (nodeDataArray[ _dataKeys[k][ key ][1] ] != undefined) ? nodeDataArray[ _dataKeys[k][ key ][1] ] : num;

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
	 *
	 *	Initial loading of Data
	 *
	 *	@param {Array} dataKeys
	 *					the keys of the dataArray within the nodes which should be updated
	 */
	function dataInit( dataKeys ) {
		// if data keys are added during init
		_dataKeys = (dataKeys != undefined) ? dataKeys : _dataKeys;

		if( _dataArr.length > 0 && !bLoad ) {
			for( var i=0; i<_dataArr.length; i++ ) {
				// incoming data
				var data = _dataArr[i];

				// normalize longitude & latitude values
				var x = Calculation.norm( data.lon, lonThreshold.min, lonThreshold.max );
				var y = Calculation.norm( data.lat, latThreshold.min, latThreshold.max );

				// create local point
				var pt = new Point( x*view.bounds.width, y*view.bounds.height );

				// find the node within the grid
				// that is closest to the data's local point
				var node = findClosestItem( _group, pt );

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
							if( typeof current[ key ] === 'Array' ) {
								current[ key ].push( data[ key ] );
							}
							else {
								current[ key ] += data[ key ];
							}
						}

						// determine radius of node
						current.radius = calcRadii( current );
					// }

					// ...and previous = the data just "replaced"
					// with the latest data
					previous = clone( current );


					// create an animation stepper 
					// this handles the transitioning from 
					// previous to current (in the case of an update)
					var animator = new ft.FStepper();
					animator.setMillis( animationMillis );
					animator.setDelta( 0.0 );


					// push all of our date into one master data source
					var d = {
						animator: animator,
						current: current,
						previous: previous,
						clear:	false
					};

					// add data within node
					node.data = d;

					// name the node so we can find it
					node.name = '__' + node.id;

					// if the ids length is 1 then
					// we give the node some initial properties
					if( current.id.length === 1 ) {
						node.fillColor = colors.bass[0];
						node.strokeColor = null;
					}

					// otherwise let's check if a dot exists
					// and modify it's attributes
					if( current.id.length >= 1 ) {
						var pos = node.position;
						node.bounds.size = new Size(
							current.radius[0],
							current.radius[0]
						);
						node.position = pos;
						node.strokeColor = null;
						node.fillColor = colors.bass[0].lerp( colors.bass[1], 1/current.id.length );

						// update node data
						node.data = d;
					}

				} // end if( node...

			} // end for

			// data loaded successfully
			bLoad = true;
			// console.log( _group.name + ' loaded! ' + bLoad );
		}

	};

	/**
	 *
	 *	Update Data
	 *
	 *	@param {Array} dataArray
	 *					the array of data
	 *	@param {Array} updatedDataKeys
	 *					the keys of the dataArray within the nodes which should be updated
	 */
	function dataRefresh( updatedDataArray, updatedDataKeys ) {
		// update data array
		_dataArr = updatedDataArray;
		// if data keys are added during refresh
		_dataKeys = (updatedDataKeys != undefined) ? updatedDataKeys : _dataKeys;

		for( var i=0; i<_dataArr.length; i++ ) {
			var node = _group.children[ _dataArr[i].node ];
			// var node = f.findByName( _group.children, ('__' + _dataArr[i].node) );
			var node = _group.children[ ('__' + _dataArr[i].node) ];

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
				if( bDebug ) console.log( 'refresh() ERROR: ' + node + ': ' + err );
			}

		} // end for

		// console.log( _group.name + ' dataRefresh() ' + bUpdate );
	};

	/**
	 *
	 *	Update (re-draw) Nodes
	 *
	 *	@param {Event} event
	 *					an event item to sync the animations
	 */
	 function nodeUpdate( event ) {
		if( bLoad ) {
			for( var i=0; i<_group.children.length; i++ ) {
				var node = _group.children[i];
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
						animator.setDelta( 0.0 );
						// animator.stepIn();
						animator.toggle();
					}
					else {
						if( animator.delta < 0.0 || animator.delta > 1.0 ) {
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
						// the updates have been animated
						// prepare the data to allow new info
						data.clear = false;
					}

				}
				else {
					// no data, no show
					node.fillColor = null;
					node.strokeColor = null;
				}
				node.position = pos;

			} // end for

			// all nodes have been cycled through
			// if there was an update, everything
			// is now up-to-date
			if( bUpdate ) {
				bUpdate = false;
			}
		}

		// return _group;
	};


	//
	// Gets
	//
	function getLoad() {
		return bLoad;
	};

	function getUpdate(val) {
		// a bit dirty, but fuck it
		bUpdate = (val != undefined) ? val : bUpdate;
		return bUpdate;
	};


	//
	// Instantiate
	//



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
		draw:		nodeUpdate
	}

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





