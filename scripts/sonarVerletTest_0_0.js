console.log( 'Sónar Verlet Test' );
/**
 *	Sónar Box2D Test
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
// var f = frederickkPaper;

var verlet;
var group;

var limbs = [];

//
var debug = false;



// ------------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------------
function Setup() {

	/*
	 *	Verlet-js
	 */
	verlet = new VerletJS(view.bounds.width, view.bounds.height, canvas);
	verlet.friction = 0.9;

	limbs[0] = verlet.lineSegments([
		new Vec2(548, 500), // left hand
		new Vec2(548, 320), // left elbow
		new Vec2(640, 200), // head
		new Vec2(730, 320), // right elbow
		new Vec2(730, 500)  // right hand
		], 0.02
	);
	limbs[0].appendages = {
		lhand:	limbs[0].pin(0),
		head:	limbs[0].pin(2),
		rhand:	limbs[0].pin(4)
	};

	limbs[1] = verlet.lineSegments([
		new Vec2(600, 600), // left foot
		new Vec2(600, 410), // left knee
		limbs[0].appendages.head.pos,
		new Vec2(685, 410), // right knee
		new Vec2(685, 600)  // right foot
		], 0.02
	);
	limbs[1].appendages = {
		lhand:	limbs[1].pin(0),
		head:	limbs[1].pin(2),
		rhand:	limbs[1].pin(4)
	};


	// create group to hold Paper.js items
	group = new Group();
};



// ------------------------------------------------------------------------
// Update
// ------------------------------------------------------------------------
function Update(event) {

	verlet.frame(12);

	group.removeChildren();

	limbs[0].appendages.lhand.pos.mutableAdd( 
		new Vec2(0, Math.sin( event.time*20 )*20)
	);
	limbs[0].appendages.rhand.pos.mutableAdd( 
		new Vec2(0, Math.sin( event.time*20 )*20)
	);

	limbs[1].appendages.lhand.pos.mutableAdd( 
		new Vec2(0, Math.cos( event.time*20 )*20)
	);
	limbs[1].appendages.rhand.pos.mutableAdd( 
		new Vec2(0, Math.cos( event.time*20 )*20)
	);

	// limbs[0].appendages.head.pos.mutableAdd( 
	//	new Vec2(Math.sin( event.time*40 )*40, Math.cos( event.time*40 )*40)
	// );
	// limbs[1].appendages.head.pos.mutableAdd( 
	//	new Vec2(Math.cos( event.time*40 )*40, Math.sin( event.time*40 )*40)
	// );


	Draw();
};



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function Draw() {
	var c = Render(group, limbs);
	// c.translate( -view.bounds.width/4, -100 );
};



// ------------------------------------------------------------------------
// Methods
// ------------------------------------------------------------------------
function Render(group, segments) {

	// character 1
	var actor = new Group();
	for( var s=0; s<segments.length; s++ ) {
		var path = new Path();
		for( var i=0; i<segments[s].particles.length; i++ ) {
			var p = segments[s].particles[i];
			path.add( new Point(
				p.pos.x,
				p.pos.y
			));

			var appendage = new Path.Circle( 
				new Point( p.pos.x, p.pos.y ),
				(i !== 2) ? 36 : 18
			);
			appendage.fillColor = new RgbColor( p.pos.x/view.bounds.width, p.pos.y/view.bounds.height, 0.0, 0.8 );
			appendage.strokeColor = null;
			// appendage.blendMode = 'screen';
			actor.appendTop( appendage );
		}
		path.strokeColor = new RgbColor( 0.0, path.bounds.height/view.bounds.height, path.bounds.width/view.bounds.width, 0.8 );
		path.strokeWidth = 72; //18*4;
		path.strokeJoin = 'round';
		path.strokeCap = 'round';
		actor.appendBottom( path );
	}
	group.appendTop( actor );



	return actor;
};



// ------------------------------------------------------------------------
var Character = function(limbSegments, group) {
	//
	//	Properties
	//

	//	private:
	var limbs = (typeof limbSegments == 'array') ? limbSegments : [limbSegments];
	var group = group;

	//	public:
	this.colors = {
		limbs:		new RgbColor( 0.0, 0.0, 0.0 ),
		appendages:	new RgbColor( 0.0, 0.0, 0.0 )
	};

	this.strokeWidths = {
		limbs:		72,
		appendages:	18
	};



	//
	//	Methods
	//

	//	public:
	this.render = function(segments) {

		// character 1
		var actor = new Group();
		for( var s=0; s<segments.length; s++ ) {
			var path = new Path();
			for( var i=0; i<segments[s].particles.length; i++ ) {
				var p = segments[s].particles[i];
				path.add( new Point(
					p.pos.x,
					p.pos.y
				));

				// add the appendages
				var appendage = new Path.Circle( 
					new Point( p.pos.x, p.pos.y ),
					this.strokeWidths.appendages
				);
				appendage.fillColor = this.colors.appendages;
				appendage.strokeColor = null;
				// appendage.blendMode = 'screen';
				actor.appendTop( appendage );
			}
			path.strokeColor = this.colors.limbs;
			path.strokeWidth = this.strokeWidths.limbs;
			path.strokeJoin = 'round';
			path.strokeCap = 'round';
			actor.appendBottom( path );
		}
		group.appendTop( actor );

		return actor;
	};


	/**
	 *
	 *	have the characters limbs dance
	 *
	 *	@param: amts - object literal array of various options
	 *			example:
	 *			var amts = [
	 *				{ appendage: 'head', amt: new Vec2(0, 12) },
	 *				{ appendage: 'hands', amt: new Vec2(0, 12) }
	 *			];
	 */
	this.dance = function(amts) {
		for( var i=0; i<appendages.length; i++ ) {
			if( amts[i].appendage === 'head' ) {
				for( var j=0; j<limbs.length; j++ ) {
					limbs[j].appendages.head.pos.mutableAdd( amts[i].amt );
				}
			}

			// hands
			else if( amts[i].appendage === 'hands') {
				for( var j=0; j<limbs.length; j++ ) {
					limbs[j].appendages.lhand.pos.mutableAdd( amts[i].amt );
					limbs[j].appendages.rhand.pos.mutableAdd( amts[i].amt );
				}
			}
			else if( amts[i].appendage === 'left-hand') {
				limbs[0].appendages.lhand.pos.mutableAdd( amts[i].amt );
			}
			else if( amts[i].appendage === 'right-hand') {
				limbs[0].appendages.rhand.pos.mutableAdd( amts[i].amt );
			}

			// elbows
			else if( amts[i].appendage === 'elbows') {
				for( var j=0; j<limbs.length; j++ ) {
					limbs[j].appendages.lelbow.pos.mutableAdd( amts[i].amt );
					limbs[j].appendages.relbow.pos.mutableAdd( amts[i].amt );
				}
			}
			else if( amts[i].appendage === 'left-elbow') {
				limbs[0].appendages.lelbow.pos.mutableAdd( amts[i].amt );
			}
			else if( amts[i].appendage === 'right-elbow') {
				limbs[0].appendages.relbow.pos.mutableAdd( amts[i].amt );
			}

			// knees
			else if( amts[i].appendage === 'knees') {
				for( var j=0; j<limbs.length; j++ ) {
					limbs[j].appendages.lknee.pos.mutableAdd( amts[i].amt );
					limbs[j].appendages.rknee.pos.mutableAdd( amts[i].amt );
				}
			}
			else if( amts[i].appendage === 'left-knee') {
				limbs[0].appendages.lknee.pos.mutableAdd( amts[i].amt );
			}
			else if( amts[i].appendage === 'right-knee') {
				limbs[0].appendages.rknee.pos.mutableAdd( amts[i].amt );
			}

			// feet
			else if( amts[i].appendage === 'feet') {
				for( var j=0; j<limbs.length; j++ ) {
					limbs[j].appendages.lfoot.pos.mutableAdd( amts[i].amt );
					limbs[j].appendages.rfoot.pos.mutableAdd( amts[i].amt );
				}
			}
			else if( amts[i].appendage === 'left-foot') {
				limbs[0].appendages.lfoot.pos.mutableAdd( amts[i].amt );
			}
			else if( amts[i].appendage === 'right-foot') {
				limbs[0].appendages.rfoot.pos.mutableAdd( amts[i].amt );
			}

		}

	};

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





