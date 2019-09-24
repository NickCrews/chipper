// Copyright 2015-2019, University of Colorado Boulder

/**
 * String utilities used throughout chipper.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

/* eslint-env browser, node */
'use strict';

( function() {

  // What divides the repo prefix from the rest of the string key, like `FRICTION/friction.title`
  const NAMESPACE_PREFIX_DIVIDER = '/';

  const ChipperStringUtils = {

    /**
     * Pad LTR/RTL language values with unicode embedding marks (see https://github.com/phetsims/joist/issues/152)
     * Uses directional formatting characters: http://unicode.org/reports/tr9/#Directional_Formatting_Characters
     *
     * @param {string} str
     * @param {boolean} isRTL
     * @returns {string} the input string padded with the embedding marks, or an empty string if the input was empty
     */
    addDirectionalFormatting: function( str, isRTL ) {
      if ( str.length > 0 ) {
        return ( isRTL ? '\u202b' : '\u202a' ) + str + '\u202c';
      }
      else {
        return str;
      }
    },

    /**
     * Appends spaces to a string
     *
     * @param {string} str - the input string
     * @param {number} n - number of spaces to append
     * @returns {string} a new string
     */
    padString: function( str, n ) {
      while ( str.length < n ) {
        str += ' ';
      }
      return str;
    },

    /**
     * Replaces all occurrences of {string} find with {string} replace in {string} str
     *
     * @param {string} str - the input string
     * @param {string} find - the string to find
     * @param {string} replaceWith - the string to replace find with
     * @returns {string} a new string
     */
    replaceAll: function( str, find, replaceWith ) {
      return str.replace( new RegExp( find.replace( /[-/\\^$*+?.()|[\]{}]/g, '\\$&' ), 'g' ), replaceWith );
    },

    // TODO chipper#316 determine why this behaves differently than str.replace for some cases (eg, 'MAIN_INLINE_JAVASCRIPT')
    /**
     * Replaces the first occurrence of {string} find with {string} replaceWith in {string} str
     *
     * @param {string} str - the input string
     * @param {string} find - the string to find
     * @param {string} replaceWith - the string to replace find with
     * @returns {string} a new string
     */
    replaceFirst: function( str, find, replaceWith ) {
      const idx = str.indexOf( find );
      if ( str.indexOf( find ) !== -1 ) {
        return str.slice( 0, idx ) + replaceWith + str.slice( idx + find.length );
      }
      else {
        return str;
      }
    },

    /**
     * Returns a string with all of the keys of the mapping replaced with the values.
     * @public
     *
     * @param {string} str
     * @param {Object} mapping
     * @returns {string}
     */
    replacePlaceholders: function( str, mapping ) {
      Object.keys( mapping ).forEach( function( key ) {
        const replacement = mapping[ key ];
        key = '{{' + key + '}}';
        let index;
        while ( ( index = str.indexOf( key ) ) >= 0 ) {
          str = str.slice( 0, index ) + replacement + str.slice( index + key.length );
        }
      } );
      Object.keys( mapping ).forEach( function( key ) {
        if ( str.indexOf( '{{' + key + '}}' ) >= 0 ) {
          throw new Error( 'Template string detected in placeholders: ' + key + '\n\n' + str.slice( 0, str.indexOf( '{{' + key + '}}' ) + 10 ) );
        }
      } );
      return str;
    },

    /**
     * Return the first line that contains the substring 'find'
     * @param {string} string - the parent string within which to search
     * @param {string} find - the legal regex string to be found
     * @returns {array} - the whole line containing the matched substring
     */
    firstLineThatContains: function( string, find ) {
      const findRE = '.*' + find.replace( /[-/\\^$*+?.()|[\]{}]/g, '\\$&' ) + '.*';
      const theReturn = string.match( new RegExp( findRE, 'g' ) );
      return theReturn ? theReturn[ 0 ] : null;
    },

    /**
     * Recurse through a string file and format each string value appropriately
     * @param {Object.<string, intermediary:Object|{value:string}>} stringsMap - if "intermediary", then recurse to
     *                                                                             find more nested keys
     * @param {boolean} isRTL - is right to left language
     * @public
     */
    formatStringValues: function( stringObject, isRTL ) {
      for ( const stringKey in stringObject ) {
        if ( stringObject.hasOwnProperty( stringKey ) ) {

          // This will either have a "value" key, or be an object with keys that will eventually have 'value' in it
          const element = stringObject[ stringKey ];
          if ( element.hasOwnProperty( 'value' ) ) {

            // remove leading/trailing whitespace, see chipper#619. Do this before addDirectionalFormatting
            // TODO: some a11y strings have leading/trailing whitespace purposefully, perhaps we should formalize that somehow, https://github.com/phetsims/chipper/issues/779
            element.value = element.value.trim();
            element.value = ChipperStringUtils.addDirectionalFormatting( element.value, isRTL );
          }
          else {

            // Recurse a level deeper
            ChipperStringUtils.formatStringValues( element, isRTL );
          }
        }
      }
    },

    /**
     * Given a key, get the appropriate string from the "map" object, or null if the key does not appear in the map.
     * This method is called during requirejs mode from the string plugin and during the build via CHIPPER/getStringMap.
     * This method supports recursing through keys that support string nesting. This method was created to support
     * nested string keys in https://github.com/phetsims/rosetta/issues/193
     * @param {Object.<string, Object|{value: string}>} map - where an "intermediate" Object should hold nested strings
     * @param {string} key - like `FRICTION/friction.title` or using nesting like `a11y.nested.string.here`
     * @returns {string|null} - the string value of the key, or null if the key does not appear in the map
     * @throws  {Error} - if the key doesn't hold a string value in the map
     * @public
     */
    getStringFromMap( map, key ) {

      if ( key.indexOf( NAMESPACE_PREFIX_DIVIDER ) >= 0 ) {
        throw new Error( 'getStringFromMap key should not have REPO/' );
      }

      // Lodash gives precedence to  "key1.key2" over "key1:{key2}", so we do too.
      const result = _.at( map, key )[ 0 ];
      if ( result ) {
        if ( result.value === undefined ) {
          throw new Error( `no value for string: ${key}` );
        }
        if ( typeof result.value !== 'string' ) {
          throw new Error( `value should be a string for key ${key}` );
        }
        return result.value;
      }

      // They key does not appear in the map
      return null;
    },

    /**
     * Call a function on each object with a value attribute in an object tree.
     * @param {Object.<string, Object|{value:string}>} map - string map, like a loaded JSON strings file
     * @param {function(key:string, {value:string})} func
     * @public
     */
    forEachString( map, func ) {
      forEachStringImplementation( '', map, func );
    }
  };

  /**
   * This implementation function helps keep a better api for `forEachString`.
   * @param {string} keySoFar - as we recurse down, build up a string of the key separated with dots.
   * @param {Object} map - string key map
   * @param {function(key:string, {value:string})} func
   */
  const forEachStringImplementation = ( keySoFar, map, func ) => {
    for ( const key in map ) {
      if ( map.hasOwnProperty( key ) ) {
        const nextKey = keySoFar ? `${keySoFar}.${key}` : key; // don't start with period, assumes '' is falsey
        const stringObject = map[ key ];
        if ( stringObject.value ) {
          func( nextKey, stringObject );
        }

        // recurse to the next level since if it wasn't the `value` key
        key !== 'value' && forEachStringImplementation( nextKey, stringObject, func );
      }
    }
  };

  // browser require.js-compatible definition
  if ( typeof define !== 'undefined' ) {
    define( function() {
      return ChipperStringUtils;
    } );
  }

  // Node.js-compatible definition
  if ( typeof module !== 'undefined' ) {
    module.exports = ChipperStringUtils;
  }

} )();
