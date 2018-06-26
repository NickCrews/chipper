// Copyright 2018, University of Colorado Boulder

/**
 * Combines all parts of a runnable's built file into an XHTML structure (with separate files)
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */
/* eslint-env node */
'use strict';

// modules
const assert = require( 'assert' );
const ChipperStringUtils = require( '../common/ChipperStringUtils' );
const getTitleStringKey = require( './getTitleStringKey' );
const grunt = require( 'grunt' );
const nodeHTMLEncoder = require( 'node-html-encoder' ); // eslint-disable-line require-statement-match

/**
 * From a given set of config (including the JS and other required things), it creates an XHTML structure.
 * @public
 *
 * @param {string} xhtmlDir
 * @param {Object} config
 * @returns {string} - The HTML for the file.
 */
module.exports = function( xhtmlDir, config ) {
  const encoder = new nodeHTMLEncoder.Encoder( 'entity' );

  const {
    repo, // {string}
    stringMap, // {Object}, map[ locale ][ stringKey ] => {string}
    scripts, // {Array.<string>}
    locale, // {string}
    htmlHeader // {string}
  } = config;
  assert( typeof repo === 'string', 'Requires repo' );
  assert( stringMap, 'Requires stringMap' );
  assert( scripts, 'Requires scripts' );
  assert( typeof locale === 'string', 'Requires locale' );
  assert( typeof htmlHeader === 'string', 'Requires htmlHeader' );

  const localizedTitle = stringMap[ locale ][ getTitleStringKey( repo ) ];

  const script = scripts.join( '\n' );
  const scriptFilename = `${repo}_phet.js`;

  const xhtml = ChipperStringUtils.replacePlaceholders( grunt.file.read( '../chipper/templates/sim.xhtml' ), {
    PHET_SIM_TITLE: encoder.htmlEncode( localizedTitle ),
    PHET_HTML_HEADER: htmlHeader,
    PHET_SIM_SCRIPTS: `<script type="text/javascript" src="${scriptFilename}" charset="utf-8"></script>`
  } );
  grunt.file.write( `${xhtmlDir}/${repo}_${locale}_phet.html`, xhtml );
  grunt.file.write( `${xhtmlDir}/${scriptFilename}`, script );
};