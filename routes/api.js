/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;

module.exports = function (app, db) {
  
  app.route('/api/threads/:board');
    
  app.route('/api/replies/:board');

};
