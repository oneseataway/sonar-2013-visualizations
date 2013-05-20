/*
 *	This file is part of Geomajas, a component framework for building
 *	rich Internet applications (RIA) with sophisticated capabilities for the
 *	display, analysis and management of geographic information.
 *	It is a building block that allows developers to add maps
 *	and other geographic data capabilities to their web applications.
 *
 *	Copyright 2008-2010 Geosparc, http://www.geosparc.com, Belgium
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU Affero General Public License as
 *	published by the Free Software Foundation, either version 3 of the
 *	License, or (at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU Affero General Public License for more details.
 *
 *	You should have received a copy of the GNU Affero General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 *	<p>
 *	Snapping algorithm that snaps to the closest end-point of a geometry. Only points that are effectively stored in
 *	the geometries come into account. This makes it a pretty fast algorithm.
 *	</p>
 *	<p>
 *	Also at construction this class will turn the list of geometries into 2 sorted lists of points: one sorted by
 *	X-ordinates, one sorted by Y-ordinates. This may take some time initially, but afterwards you'll reap the results, as
 *	possible snapping points can quickly be fetched using the binary search algorithm.
 *	</p>
 *
 *	@author Pieter De Graef
 */

var ClosestPointAlgorithm = function( _points, _ruleDistance ) {
	/*
	 *	Properties
	 */
	//	private
	var minimumDistance = Number.MAX_VALUE;

	//	The maximum snapping distance, as defined in snapping rules.
	var ruleDistance = (_ruleDistance != undefined) ? _ruleDistance : 0;

	//	Array of points, all sorted (ascending)
	var sortedX = [];
	var sortedY = [];


	/*
	 *	Methods
	 */
	var init = function() {
		sortedX = sortX( _points );
		sortedY = sortY( _points );
	};

	/**
	 *	Calculates a snapping point from the given point.
	 *
	 *	@param searchPoint
	 *			The original and unsnapped point.
	 *	@param threshold
	 *			A threshold value that needs to be beaten in order to snap. Only if the distance between the original
	 *			and the candidate point is smaller then this threshold, can the candidate point be a snapped
	 *			point.
	 *
	 *	@return Returns the eventual snapped point, or null if no snapping occurred.
	 *
	 */
	this.getSnappingPoint = function( searchPoint, threshold ) {
		minimumDistance = Number.MAX_VALUE;
		var snappingPoint = null;
		var currThreshold = threshold;

		var points = getPossibleCoordinates( searchPoint );
		for( var i=0; i<points.length; i++ ) {
			// Paper.js (required)
			var distance = searchPoint.getDistance( points[i] );
			console.log( 'distance', distance );
			if( distance < currThreshold && distance < ruleDistance ) {
				currThreshold = distance;
				minimumDistance = distance;
				snappingPoint = points[i];
			}
		}

		return snappingPoint;
	};

	//	Return a new and sorted list of points.
	//	They should be sorted by their X values.
	var sortX = function( points ) {
		var sorted = points;
		sorted.sort( sortByX );
		return sorted;
	};

	//	Return a new and sorted list of points.
	//	They should be sorted by their Y values.
	var sortY = function( points ) {
		var sorted = points;
		sorted.sort( sortByY );
		return sorted;
	};


	//	Return a possible list of points that are within range of the given point.
	//	This function is very fast as it uses binary search, and it returns a small subset of points.
	//	The perfect set to start calculating from.
	var getPossibleCoordinates = function( point ) {
		// var xMin = Collections.binarySearch( sortedX, new Point(point.x - ruleDistance, 0), new XComparator() );
		// var xMax = Collections.binarySearch( sortedX, new Point(point.x + ruleDistance, 0), new XComparator() );
		// var yMin = Collections.binarySearch( sortedY, new Point(0, point.y - ruleDistance), new YComparator() );
		// var yMax = Collections.binarySearch( sortedY, new Point(0, point.y + ruleDistance), new YComparator() );

		// console.log(point.x - ruleDistance);
		// console.log(point.x + ruleDistance);
		// console.log(point.y - ruleDistance);
		// console.log(point.y + ruleDistance);

		// var xMin = binarySearch( sortedX, new Point((point.x - ruleDistance), 0), 0,sortedX.length-1 );
		// var xMax = binarySearch( sortedX, new Point((point.x + ruleDistance), 0), 0,sortedX.length-1 );
		// var yMin = binarySearch( sortedY, new Point(0, (point.y - ruleDistance)), 0,sortedY.length-1 );
		// var yMax = binarySearch( sortedY, new Point(0, (point.y + ruleDistance)), 0,sortedY.length-1 );

		var xMin = binarySearch( sortedX, new Point((point.x - ruleDistance), 0), sortByX );
		var xMax = binarySearch( sortedX, new Point((point.x + ruleDistance), 0), sortByX );
		var yMin = binarySearch( sortedY, new Point(0, (point.y - ruleDistance)), sortByY );
		var yMax = binarySearch( sortedY, new Point(0, (point.y + ruleDistance)), sortByY );

		console.log( '---------' );
		console.log( 'xMin', xMin );
		console.log( 'xMin', sortedX[ xMin ] );
		console.log( 'xMax', sortedX[ xMax ] );
		console.log( 'yMin', sortedY[ yMin ] );
		console.log( 'yMax', sortedY[ yMax ] );
		console.log( '---------' );

		if( xMin < 0 ) {
			xMin = Math.abs(xMin) - 1;
		}
		if( xMax < 0 ) {
			xMax = Math.abs(xMax) - 1;
		}
		if( yMin < 0 ) {
			yMin = Math.abs(yMin) - 1;
		}
		if( yMax < 0 ) {
			yMax = Math.abs(yMax) - 1;
		}

		var points = [];
		for( var i=xMin; i<xMax; i++ ) {
			console.log( 'push' );
			points.push( sortedX[i] );
		}
		for( var i=yMin; i<yMax; i++ ) {
			console.log( 'push' );
			points.push( sortedY[i] );
		}

		return points;
	};



	//	sort array by X value
	var sortByX = function(a, b) {
		if( a.x < b.x ) return -1;
		if( a.x > b.x ) return 1;
		return 0;
	};

	//	sort array by X value
	var sortByY = function(a, b) {
		if( a.y < b.y ) return -1;
		if( a.y > b.y ) return 1;
		return 0;
	};

	//	https://github.com/mbroten/javascript-binary-search/blob/master/binary-search.js
	/*
	 *
	 *	@param value
	 *			a Point
	 *
	 */
	// var binarySearch = function( sortedArray, value, low, high ) {
	//	console.log( 'value', value );
	//	// if (high < low) {
	//	//	return -1;
	//	// }
		
	//	var mid = Math.floor((low + high) / 2);
	//	console.log( 'mid', mid );

	//	var midValue = sortedArray[mid];
		
	//	console.log( 'midValue', midValue );
		
	//	if (midValue.x > value.x) {
	//		console.log( '(midValue.x > value.x)' );
	//		return binarySearch( sortedArray, value, low, mid - 1 );
	//	}
	//	if (midValue.y > value.y) {
	//		console.log( '(midValue.y > value.y)' );
	//		return binarySearch( sortedArray, value, low, mid - 1 );
	//	}

	//	if (midValue.x < value.x) {
	//		console.log( '(midValue.x < value.x)' );
	//		return binarySearch( sortedArray, value, mid + 1, high );
	//	}
	//	if (midValue.y < value.y) {
	//		console.log( '(midValue.y < value.y)' );
	//		return binarySearch( sortedArray, value, mid + 1, high );
	//	}
		
	//	console.log( 'mid-result', mid );
	//	return mid;
	// };

	var binarySearch = function( arr, find, comparator ) {
		console.log( 'binarySearch' );
		var low = 0;
		var high = arr.length - 1;
		var i;
		var comparison;

		console.log( 'low' , low );
		console.log( 'high', high );

		while (low <= high) {
			i = Math.floor((low + high) / 2);
			console.log( 'arr[i]', arr[i] );

			comparison = comparator(arr[i], find);
			console.log( 'comparison', comparison );

			if (comparison < 0) { 
				low = i + 1;
				continue;
			};
			if (comparison > 0) {
				high = i - 1;
				continue;
			};
			console( 'i', i );
			return i;
		}
		return null;
	};

	init();
};


