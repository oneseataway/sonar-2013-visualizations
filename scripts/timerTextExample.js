console.log( 'TimerText Example' );
/**
 *	TimerText Example
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


var ttext;


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
			new Color(	89/255,	 0/255, 255/255, 0.2 ),
			new Color( 178/255,	 0/255,	89/255, 0.2 ),
			new Color( 225/255,	 0/255,	46/255, 0.2 )
		],
		mid: [
			new Color( 255/255, 178/255,	 0/255, 0.2 ),
			new Color( 178/255,	89/255,	 0/255, 0.2 ),
			new Color( 178/255, 255/255,	 0/255, 0.2 )
		],
		treble: [
			new Color(	 0/255, 255/255, 178/255, 0.2 ),
			new Color(	 0/255, 255/255, 255/255, 0.2 ),
			new Color(	 0/255, 178/255, 255/255, 0.2 )
		]
	};


	// create type
	ttext = new MarkerFade(
		ft,
		'1.0',
		view.bounds.center,
		500,
		3000
	);
	ttext.path.fillColor = colors.yellow;


};


// ------------------------------------------------------------------------
// Update
// ------------------------------------------------------------------------
function Update(event) {
	// reset change flag at the beginning of 
	// every update cycle
	bChangeFlag = false;


	// add event to MarkerFade 
	ttext.update( event );

	// constantly update Draw()
	// Draw();
};



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function Draw() {

};



// ------------------------------------------------------------------------
// Methods
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
	if( event.key == 'space' ) {
		ttext.toggle();
	}
};

function onKeyUp(event) {
};





