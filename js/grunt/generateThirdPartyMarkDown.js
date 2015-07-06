// Copyright 2002-2015, University of Colorado Boulder

/**
 * This grunt task generates a markdown form of sherpa/third-party-licenses.json.
 *
 * @author Aaron Davis
 * @author Sam Reid
 */

// constants
var SHERPA = '../sherpa';  // The relative path to sherpa, from the chipper path

/**
 * @param grunt the grunt instance
 */
module.exports = function( grunt ) {
  'use strict';

  var json = grunt.file.readJSON( SHERPA + '/third-party-licenses.json' );

  var entries = [];

  for ( var library in json ) {
    var lines = [
      '**' + library + '**',
      '*' + json[ library ].text.join( '<br>' ) + '*',
      json[ library ].projectURL,
      '- ' + json[ library ].license + '  ' + json[ library ].licenseURL,
      '- ' + json[ library ].notes
    ];

    entries.push( lines.join( '\n' ) );
  }

  var output = entries.join( '\n\n' );
  console.log( '!!!!!!' );
  console.log( output );
  console.log( '!!!!!!' );

  //grunt.log.writeln( 'writing file ' + OUTPUT_FILE );
  //grunt.file.write( SHERPA + '/' + OUTPUT_FILE, output );
  //
  //var done = grunt.task.current.async();
  //
  //// exec a command in the sherpa directory
  //var exec = function( command, callback ) {
  //  child_process.exec( command, { cwd: SHERPA }, function( err, stdout, stderr ) {
  //    grunt.log.writeln( stdout );
  //    grunt.log.writeln( stderr );
  //    assert( !err, 'assertion error running ' + command );
  //    callback();
  //  } );
  //};
  //
  //exec( 'git add ' + OUTPUT_FILE, function() {
  //  exec( 'git commit --message "update info.md"', function() {
  //    exec( 'git push', function() {
  //      done();
  //    } );
  //  } );
  //} );

};
