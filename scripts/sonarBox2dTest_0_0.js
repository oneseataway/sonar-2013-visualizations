console.log( 'Sónar Box2D Test' );
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
var f = frederickkPaper;

// box2d
var world;

var boxes = [];
var circles = [];
var triangles = [];
var allBodies = [];

//
var debug = false;



// ------------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------------
function Setup() {

	/*
	 *	Box2D
	 */
	world = new b2World(new b2Vec2(0.0, -9.81), true);
	var m_physScale = 1;
	world.SetWarmStarting(true);

	// Create border of boxes
	var wall = new b2PolygonShape();
	var wallBd = new b2BodyDef();

	// Left
	wallBd.position.Set( -9.5 / m_physScale, 36 / m_physScale / 2);
	wall.SetAsBox(10/m_physScale, 40/m_physScale/2);
	this._wallLeft = world.CreateBody(wallBd);
	this._wallLeft.CreateFixture2(wall);

	// Right
	wallBd.position.Set((64 + 9.5) / m_physScale, 36 / m_physScale / 2);
	this._wallRight = world.CreateBody(wallBd);
	this._wallRight.CreateFixture2(wall);

	// Top
	wallBd.position.Set(64 / m_physScale / 2, (36 + 9.5) / m_physScale);
	wall.SetAsBox(68/m_physScale/2, 10/m_physScale);
	this._wallTop = world.CreateBody(wallBd);
	this._wallTop.CreateFixture2(wall);	

	// Bottom
	wallBd.position.Set(64 / m_physScale / 2, -9.5 / m_physScale);
	this._wallBottom = world.CreateBody(wallBd);
	this._wallBottom.CreateFixture2(wall);


	var x = Math.random()*view.width;
	var y = Math.random()*view.height;
	var radius = radius || 2;

	var fixtureDef = new b2FixtureDef();
	fixtureDef.shape = new b2CircleShape(radius);
	fixtureDef.friction = 0.4;
	fixtureDef.restitution = 0.6;
	fixtureDef.density = 1.0;

	var ballBd = new b2BodyDef();
	ballBd.type = b2Body.b2_dynamicBody;
	ballBd.position.Set(x,y);
	var body = world.CreateBody(ballBd);
	body.CreateFixture(fixtureDef);


	console.log( world.m_bodyList );
};



// ------------------------------------------------------------------------
// Update
// ------------------------------------------------------------------------
function Update(event) {

};



// ------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------
function Draw() {
};



// ------------------------------------------------------------------------
// Methods
// ------------------------------------------------------------------------



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





