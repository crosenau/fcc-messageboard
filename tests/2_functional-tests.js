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

const threads = require('../models/threads.js');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  const board = 'test';
  const text = 'POST to /api/threads/test';
  const deletePassword = 'abc123';

  let threadId;

  suiteSetup(async function() {
    await threads.deleteAllThreadsInBoard(board);
  });
  
  suiteTeardown(async function() {
    await threads.deleteAllThreadsInBoard(board);
  });

  suite('API ROUTING FOR /api/threads/:board', function() {
    suite('POST', function() {
      test('Should redirect to /b/:board', function(done) {
        chai.request(server)
          .post(`/api/threads/test`)
          .send({
            text,
            delete_password: deletePassword
          })
          .end((err, res) => {
            if (err) console.log(err);

            assert.equal(res.status, 200);
            assert.isNotNull(res.redirects);
            assert.match(res.redirects[0], /.*\/b\/test$/);
            done();
          });
      });
    });

    suite('GET', function() {
      test('Should return an array of thread json objects with proper fields', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            if (err) console.log(err);

            assert.equal(res.status, 200);

            const body = res.body;

            assert.isArray(body);
            body.forEach(thread => {        
              assert.property(thread, '_id');
              assert.property(thread, 'text');
              assert.property(thread, 'created_on');
              assert.property(thread, 'bumped_on');
              assert.property(thread, 'replies');
              assert.property(thread, 'replycount');
              assert.notProperty(thread, 'reported');
              assert.notProperty(thread, 'delete_password');
      
              assert.isString(thread._id);
              assert.isString(thread.text);
              assert.isString(thread.created_on);
              assert.isString(thread.bumped_on);
              assert.isArray(thread.replies);
              assert.lengthOf(thread.replies, 0);
              assert.isNumber(thread.replycount);
            });

            threadId = body[0]._id;
            done()
          });
      });
    });

    suite('PUT', function() {
      test('Should return "success" when correct data is supplied', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({
            report_id: threadId,
            delete_password: deletePassword
          })
          .end((err, res) => {
            if (err) console.log(err);

            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });

    suite('DELETE', function(done) {
      test('Should return "incorrect password" when wrong delete_password is sent', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: threadId,
            delete_password: 'wrong'
          })
          .end((err, res) => {
            if (err) console.log(err);

            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });

      test('Should return "success" when correct data is sent', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: threadId,
            delete_password: deletePassword
          })
          .end((err, res) => {
            if (err) console.log(err);

            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    const board = 'test';
    const text = 'suiteSetup - POST to /api/threads/test';
    const replyText = 'POST to /api/replies/text'
    const deletePassword = 'abc123';
  
    let threadId;
    let replyId; // To be assigned during GET suite

    suiteSetup(async function() {
      try {
        await threads.createThread(board, text, deletePassword);

        const allThreads = await threads.getThreads(board);
        
        threadId = allThreads[0]._id;

      } catch(err) {
        console.log(err);
      }
    });

    suite('POST', function() {
      test('On success, should redirect to /b/:board/:thread_id', async function() {
        try {
          const res = await chai.request(server)
            .post('/api/replies/test')
            .send({
              thread_id: threadId,
              text,
              delete_password: deletePassword
            });

          assert.equal(res.status, 200);
          
          const pattern = `/b/test/${threadId.toString()}$`;
          const re = new RegExp(pattern);

          assert.match(res.redirects[0], re);
        } catch(err) {
          console.log(err);
        }
      });
    });
    
    suite('GET', async function() {
      let thread; 

      test('Returns a json object containing the full thread and the newly added reply. Excludes properties "reported" and "delete_password"', async function() {
        try {
          const res = await chai.request(server)
            .get('/api/replies/test')
            .query({ thread_id: threadId.toString() });
          
          assert.equal(res.status, 200);
          
          thread = res.body;

          assert.isObject(thread);
          assert.isArray(thread.replies);
          assert.isAbove(thread.replies.length, 0);
          assert.equal(thread.reply[0].text, text);


          replyId = thread.replies[0]._id;

          /*
          assert.property(thread, '_id');
          assert.property(thread, 'text');
          assert.property(thread, 'created_on');
          assert.property(thread, 'bumped_on');
          assert.property(thread, 'replies');
          assert.property(thread, 'replycount');
          assert.notProperty(thread, 'reported');
          assert.notProperty(thread, 'delete_password');
          */

        } catch(err) {
          console.log(err);
        }
        
      });
    });
    
    suite('PUT', function() {
      
    });
    
    suite('DELETE', function() {
      
    });
    
  });

});
