// Copyright 2021, University of Colorado Boulder

const _ = require( 'lodash' ); // eslint-disable-line
const fs = require( 'fs' );
const compareMacroAPIs = require( './compareMacroAPIs' );

/**
 * Compare two macro apis specified on the command line.  Command-line adapter to run compareMacroAPIs.js
 * USAGE:
 * cd root
 * node chipper/js/phet-io/compare-macro-apis.js macroapi1.json macroapi2.json
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
const args = process.argv.slice( 2 );
const a = JSON.parse( fs.readFileSync( args[ 0 ], 'utf8' ) );
const b = JSON.parse( fs.readFileSync( args[ 1 ], 'utf8' ) );

const result = compareMacroAPIs( a, b );
if ( result.problemCount > 0 ) {
  console.log( result.formatted );
}