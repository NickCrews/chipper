// Copyright 2019-2020, University of Colorado Boulder

/**
 * Format a PhET-iO API file for printing.
 *
 * NOTE: Please be mindful of the copy in copyWithSortedKeys, TODO see https://github.com/phetsims/phet-io/issues/1733
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

/**
 * Creates a new object, recursively, by sorting the keys at each level.
 * @param {Object} unordered - jsonifiable object to be sorted by key name.  Sorting is recursive.
 */
const copyWithSortedKeys = unordered => {
  if ( Array.isArray( unordered ) ) {
    return unordered.map( copyWithSortedKeys );
  }
  else if ( typeof unordered !== 'object' || unordered === null ) {
    return unordered;
  }

  const ordered = {};
  Object.keys( unordered ).sort().forEach( key => {
    const value = unordered[ key ];
    ordered[ key ] = copyWithSortedKeys( value );
  } );
  return ordered;
};

/**
 * @param {Object} api
 */
module.exports = api => {
  const objectString = JSON.stringify( copyWithSortedKeys( api ), null, 2 );
  return objectString.replace( /\n/g, '\n  ' ); // for proper file formatting
};