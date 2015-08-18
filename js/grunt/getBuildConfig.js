// Copyright 2002-2015, University of Colorado Boulder

/**
 * Gets configuration information that is required by the 'build' task.
 * Reads information from multiple places, including:
 *
 * chipper/build.json
 * $HOME/.phet/build-local.json
 * REPO/package.json
 * grunt.options( optionName )
 *
 * The information is shared via global variable global.phet.chipper.buildConfig.
 * All entries are @public (read-only).
 * Entries include:
 *
 * {string} name - name of the repository being built
 * {string} version - version identifier
 * {string} license - license
 * {string} simTitleStringKey - key of the sim's title string
 * {string} brand - brand identifier
 * {string[]} phetLibs - other repositories that are required by the sim
 * {string[]} preload - scripts that need to be preloaded in the .html file, in the order that they will be preloaded
 * {string[]} licenseKeys - keys to licenses in sherpa/lib/license.json, for third-party dependencies
 * {string} fallbackLocale - the locale to use if none is specified
 * {string[]} locales - locales to build
 * {Object} gruntConfig
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

// The following comment permits node-specific globals (such as process.cwd()) to pass jshint
/* jslint node: true */
'use strict';

// built-in node APIs
var assert = require( 'assert' );
var fs = require( 'fs' );

// 3rd-party packages
/* jshint -W079 */
var _ = require( '../../../sherpa/lib/lodash-2.4.1.min' ); // allow _ to be redefined, contrary to jshintOptions.js
/* jshint +W079 */

/**
 * @param {Object} grunt - the grunt instance
 */
module.exports = function( grunt ) {

  /**
   * Gets the brand identifier.
   *
   * @param {Object} grunt - the grunt instance
   * @param {Object} buildLocalJSON - build-local.json
   * @returns {string}
   */
  function getBrand( grunt, buildLocalJSON ) {
    return grunt.option( 'brand' ) || buildLocalJSON.brand || 'adapted-from-phet';
  }

  /**
   * Gets phetLibs, the set of repositories on which the repository being built depends.
   *
   * @param {Object} packageJSON - package.json
   * @param {Object} buildJSON - build.json
   * @param {string} brand
   * @returns {string[]}
   */
  function getPhetLibs( packageJSON, buildJSON, brand ) {

    // start with package.json
    var phetLibs = packageJSON.phet.phetLibs || [];

    // add the repo that's being built
    phetLibs.push( packageJSON.name );

    // add common and brand-specific entries from build.json
    [ 'common', brand ].forEach( function( id ) {
      if ( buildJSON[ id ] && buildJSON[ id ].phetLibs ) {
        phetLibs = phetLibs.concat( buildJSON[ id ].phetLibs );
      }
    } );

    // sort and remove duplicates
    return _.uniq( phetLibs.sort() );
  }

  /**
   * Gets preload, the set of scripts to be preloaded in the .html file.
   * NOTE! Order of the return value is significant, since it corresponds to the order in which scripts will be preloaded.
   *
   * @param {Object} packageJSON - package.json
   * @param {Object} buildJSON - build.json
   * @param {string} brand
   * @returns {string[]}
   */
  function getPreload( packageJSON, buildJSON, brand ) {

    var preload = [];

    // add preloads that are common to all sims, from build.json
    if ( buildJSON.common && buildJSON.common.preload ) {
      preload = preload.concat( buildJSON.common.preload );
    }

    // add sim-specific preloads from package.json
    if ( packageJSON.preload ) {
      preload = preload.concat( packageJSON.preload );
    }

    // add brand-specific preloads from build.json
    if ( buildJSON[ buildConfig.brand ] && buildJSON[ buildConfig.brand ].preload ) {
      preload = preload.concat( buildJSON[ buildConfig.brand ].preload );
    }

    // add the together API file
    if ( brand === 'phet-io' ) {
      var TOGETHER_API_FILENAME = '../together/js/api/' + packageJSON.name + '-api.js';
      assert( fs.existsSync( TOGETHER_API_FILENAME ), 'together API file does not exist: ' + TOGETHER_API_FILENAME );
      preload.push( TOGETHER_API_FILENAME );
    }

    // sort and remove duplicates
    return _.uniq( preload.sort() );
  }

  /**
   * Gets the license keys for sherpa (third-party) libs that are used.
   *
   * @param {Object} packageJSON - package.json
   * @param {Object} buildJSON - build.json
   * @param {string} brand
   * @param {string[]} preload
   * @returns {string[]}
   */
  function getLicenseKeys( packageJSON, buildJSON, brand, preload ) {

    // start with package.json
    var licenseKeys = packageJSON.phet.licenseKeys || [];

    // add common and brand-specific entries from build.json
    [ 'common', brand ].forEach( function( id ) {
      if ( buildJSON[ id ] && buildJSON[ id ].licenseKeys ) {
        licenseKeys = licenseKeys.concat( buildJSON[ id ].licenseKeys );
      }
    } );

    // Extract keys from preload for sherpa (third-party) dependencies
    preload.forEach( function( path ) {
      if ( path.indexOf( '/sherpa/' ) !== -1 ) {
        var lastSlash = path.lastIndexOf( '/' );
        var key = path.substring( lastSlash + 1 );
        licenseKeys.push( key );
      }
    } );

    // sort and remove duplicates
    return _.uniq( _.sortBy( licenseKeys, function( key ) { return key.toUpperCase(); } ) );
  }

  /*
   * Gets the locales from a repository, by inspecting the names of the string files in that repository.
   *
   * @param {string} repository - name of the repository to get locales from
   */
  function getLocalesFromRepository( repository ) {

    // confirm that the repository has a strings directory
    var stringsDirectory = '../babel/' + repository;
    var stats = fs.statSync( stringsDirectory );
    assert( stats.isDirectory(), stringsDirectory + 'is not a directory' );

    // Get names of string files.
    var stringFiles = fs.readdirSync( stringsDirectory ).filter( function( filename ) {
      return (/^.*-strings.*\.json/).test( filename );
    } );
    assert( stringFiles.length > 0, 'no string files found in ' + stringsDirectory );

    // Extract the locales from the file names.
    // File names must have a form like 'graphing-lines-strings_ar_SA.json', where no '_' appear in the repo name.
    var locales = stringFiles.map( function( filename ) {
      return filename.substring( filename.indexOf( '_' ) + 1, filename.lastIndexOf( '.' ) );
    } );
    assert( locales.length > 0, 'no locales found in ' + stringsDirectory );

    return locales;
  }

  /**
   * Gets the set of locales to be built.
   *
   * The grunt options are:
   *
   * --locales=* : all locales from the repo's strings/ directory
   * --locales=fr : French
   * --locales=ar,fr,es : Arabic, French and Spanish (comma-separated locales)
   * --localesRepo=beers-law-lab: all locales from another repository's strings/ directory, ignored if --locales is specified
   *
   * @param {Object} grunt - the grunt instance
   * @param {string} repository - name of the repository that is being built
   * @param {string} fallbackLocale - the locale to build if no locales are specified
   */
  function getLocales( grunt, repository, fallbackLocale ) {

    var locales = grunt.option( 'locales' );

    if ( locales ) {
      if ( locales === '*' ) {
        locales = getLocalesFromRepository( repository ); // all locales for the repository that we're building
      }
      else {
        locales = _.uniq( locales.split( ',' ) );
      }
    }
    else {
      var localesRepo = grunt.option( 'localesRepo' );
      if ( localesRepo ) {
        locales = getLocalesFromRepository( localesRepo ); // all locales for some other repository
      }
      else {
        locales = [ fallbackLocale ];
      }
    }
    return locales;
  }

  /**
   * Gets the JSHint configuration object.
   *
   * @param {Object} packageJSON - package.json
   * @param {string[]} phetLibs
   * @returns {Object}
   */
  function getJSHintConfig( packageJSON, phetLibs ) {

    // Repository files to be linted. brand has a non-standard directory structure.
    var repoFilesToLint = ( packageJSON.name === 'brand' ) ? [ '*/js/**/*.js' ] : [ 'js/**/*.js' ];

    // All files to be linted
    var allFilesToLint = _.map( phetLibs, function( repo ) {
      return '../' + repo + '/js/**/*.js';
    } );

    // brand repo has a non-standard directory structure, so add it explicitly if it's a dependency.
    if ( packageJSON.name !== 'brand' ) {
      allFilesToLint.push( '../brand/*/js/**/*.js' );
    }

    // Exclude svgPath.js, it was automatically generated and doesn't match pass lint.
    allFilesToLint.push( '!../kite/js/parser/svgPath.js' );
    allFilesToLint = _.uniq( allFilesToLint );

    return {

      // PhET-specific, passed to the 'lint' grunt task
      // Source files that are specific to this repository
      repoFiles: repoFilesToLint,

      // PhET-specific, passed to the 'lint-all' grunt task
      // All source files for this repository (repository-specific and dependencies).
      allFiles: allFilesToLint,

      // Reference external options in jshintOptions.js
      options: require( './jshintOptions' )
    };
  }

  /**
   * Gets the Grunt configuration object.
   *
   * @param {Object} packageJSON - package.json
   * @param {strings[]} phetLibs
   */
  function getGruntConfig( packageJSON, phetLibs ) {
    return {

      //TODO chipper#278 is this necessary?
      // Setting pkg allows us to refer to package.json entries from within this config
      pkg: packageJSON,

      jshint: getJSHintConfig( packageJSON, phetLibs ),

      // configure the RequireJS plugin, see https://github.com/jrburke/r.js/blob/master/build/example.build.js
      requirejs: {

        // builds the minified script
        build: {

          options: {

            almond: true,
            //TODO chipper#278 is this necessary?
            mainConfigFile: 'js/<%= pkg.name %>-config.js',
            out: 'build/<%= pkg.name %>.min.js',
            name: '<%= pkg.name %>-config',

            // Minification strategy.  Put this to none if you want to debug a non-minified but compiled version
            optimize: 'uglify2',
            wrap: true,
            // generateSourceMaps: true, //#42 commented out this line until source maps are fixed
            preserveLicenseComments: false,
            uglify2: {
              output: {
                inline_script: true // escape </script
              },
              compress: {
                global_defs: {
                  // global assertions
                  assert: false,
                  assertSlow: false,
                  // scenery logging
                  sceneryLog: false,
                  sceneryLayerLog: false,
                  sceneryEventLog: false,
                  sceneryAccessibilityLog: false,
                  phetAllocation: false
                },
                dead_code: true
              }
            },

            //TODO chipper#275 should 'mipmap' be included here too?
            // stub out the plugins, so their source code won't be included in the minified file
            stubModules: [ 'string', 'audio', 'image' ]
          }
        }
      }
    };
  }

  //------------------------------------------------------------------------------------
  // read configuration files

  // ./package.json (required)
  var PACKAGE_FILENAME = 'package.json';
  assert( fs.existsSync( PACKAGE_FILENAME ), 'missing ' + PACKAGE_FILENAME );
  var packageJSON = grunt.file.readJSON( PACKAGE_FILENAME );
  assert( packageJSON.name, 'name missing from ' + PACKAGE_FILENAME );
  assert( packageJSON.version, 'version missing from ' + PACKAGE_FILENAME );
  assert( packageJSON.license, 'license missing from ' + PACKAGE_FILENAME );

  // chipper/build.json (required)
  var BUILD_FILENAME = '../chipper/build.json';
  assert( fs.existsSync( BUILD_FILENAME ), 'missing ' + BUILD_FILENAME );
  var buildJSON = grunt.file.readJSON( BUILD_FILENAME );

  // $HOME/.phet/build-local.json (optional)
  var BUILD_LOCAL_FILENAME = process.env.HOME + '/.phet/build-local.json';
  var buildLocalJSON = {};
  if ( fs.existsSync( BUILD_LOCAL_FILENAME ) ) {
    buildLocalJSON = grunt.file.readJSON( BUILD_LOCAL_FILENAME );
  }

  //------------------------------------------------------------------------------------
  // Assemble the buildConfig

  var buildConfig = {
    // These entries have no dependencies on other entries in buildConfig.
    name: packageJSON.name,
    version: packageJSON.version,
    license: packageJSON.name,
    simTitleStringKey: packageJSON.simTitleStringKey,
    brand: getBrand( grunt, buildLocalJSON ),
    fallbackLocale: 'en'
  };

  // These entries depend on other entries in buildConfig.
  buildConfig.phetLibs = getPhetLibs( packageJSON, buildJSON, buildConfig.brand );
  buildConfig.preload = getPreload( packageJSON, buildJSON, buildConfig.brand );
  buildConfig.licenseKeys = getLicenseKeys( packageJSON, buildJSON, buildConfig.brand, buildConfig.preload );
  buildConfig.locales = getLocales( grunt, buildConfig.name, buildConfig.fallbackLocale );
  buildConfig.gruntConfig = getGruntConfig( packageJSON, buildConfig.phetLibs );

  grunt.log.debug( 'buildConfig=' + JSON.stringify( buildConfig, null, 2 ) );
  return buildConfig;
};
