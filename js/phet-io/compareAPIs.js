// Copyright 2021, University of Colorado Boulder

/**
 * Compare macro APIs (files that contain 1+ APIs).  TODO: https://github.com/phetsims/phet-io/issues/1733, see
 * TODO: compareAPIs.js and make sure this can run in all appropriate contexts, not just node
 * @author Sam Reid (PhET Interactive Simulations)
 */

'use strict';

const _ = require( 'lodash' ); // eslint-disable-line

module.exports = ( api1, api2 ) => {
  const problems = [];
  const elements1 = Object.keys( api1.phetioElements );
  const elements2 = Object.keys( api2.phetioElements );
  if ( !_.isEqual( elements1, elements2 ) ) {
    const missingFrom2 = elements1.filter( e => !elements2.includes( e ) );
    if ( missingFrom2.length > 0 ) {
      problems.push( { message: `Second API missing elements:\n\t${missingFrom2.join( '\n\t' )}` } );
    }
  }
  elements1.forEach( phetioID => {
    if ( elements2.includes( phetioID ) ) {

      const reportDifferences = ( metadataKey, invalidNewValue ) => {
        const oldValue = api1.phetioElements[ phetioID ][ metadataKey ];
        const newValue = api2.phetioElements[ phetioID ][ metadataKey ];
        if ( oldValue !== newValue ) {
          if ( invalidNewValue === undefined ) {
            problems.push( { message: `${phetioID}.${metadataKey} changed from ${oldValue} to ${newValue}` } );
          }
          else {

            if ( newValue === invalidNewValue ) {
              problems.push( { message: `${phetioID}.${metadataKey} changed from ${oldValue} to ${newValue}` } );
            }
            else {

              // value changed, but it was a widening API (adding something to state, or making something read/write)
            }
          }
        }
      };

      // appears in both, now check its metadata
      reportDifferences( 'phetioTypeName' );
      reportDifferences( 'phetioEventType' );
      reportDifferences( 'phetioPlayback' );
      reportDifferences( 'phetioDynamicElement' );
      reportDifferences( 'phetioIsArchetype' );
      reportDifferences( 'phetioArchetypePhetioID' );
      reportDifferences( 'phetioState', false ); // Only report if something became non-stateful
      reportDifferences( 'phetioReadOnly', true ); // Only need to report if something became readOnly

      // The following metadata keys are non-breaking:
      // 'phetioFeatured'
      // 'phetioStudioControl'
      // 'phetioHighFrequency', non-breaking, assuming clients with data have the full data stream
    }
  } );

// NOTE: Check for:
// missing methods
// incompatible method signatures

  return problems;
};