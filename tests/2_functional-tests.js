/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {

    suite('POST', function() {
      const text = 'POST to /api/threads/test';
      const deletePassword = 'abc123';
      
      test('Should redirect to /b/:board', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text,
            delete_password: deletePassword
          })
          .end((err, res) => {
            if (err) console.log(err);

            assert.equal(res.status, 200);
            assert.isNotNull(res.redirects);
            assert.match(res.redirects[0], /.*\/b\/test/);
            done();
          });
      });
    });


    suite('GET', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
    });
    
    suite('GET', function() {
      
    });
    
    suite('PUT', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
