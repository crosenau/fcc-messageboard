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
      test('Redirects to /b/:board', function(done) {
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
      let response;

      suiteSetup(async function() {
        response = await chai.request(server)
          .get('/api/threads/test');

        threadId = response.body[0]._id;
      });

      test('Response is an array with length of 1', function() {
        assert.equal(response.status, 200);
        assert.isArray(response.body);
        assert.lengthOf(response.body, 1);
      });

      test('Each element is a thread that has properties _id, text, created_on, bumped_on, replies. reported and delete_password are excluded', function() {
        response.body.forEach(thread => {        
          assert.property(thread, '_id');
          assert.property(thread, 'text');
          assert.property(thread, 'created_on');
          assert.property(thread, 'bumped_on');
          assert.property(thread, 'replies');
          assert.property(thread, 'replycount');
          assert.notProperty(thread, 'reported');
          assert.notProperty(thread, 'delete_password');
        });
      });

      test('Values match what input data', function() {
        response.body.forEach(thread => {
          assert.isString(thread._id);
          assert.isString(thread.text);
          assert.equal(thread.text, text);
          assert.isString(thread.created_on);
          assert.isString(thread.bumped_on);
          assert.isArray(thread.replies);
          assert.lengthOf(thread.replies, 0);
          assert.isNumber(thread.replycount);
          assert.equal(thread.replycount, 0);
        });
      });

      test('Invalid/missing inputs');
    });

    suite('PUT', function() {
      test('Returns “error” when incorrect input is supplied or input is missing', async function() {
      const res = await chai.request(server)
        .put('/api/threads/test')
        .send({
            report_id: '5c628c77250b924058897f13'
        });

      assert.equal(res.status, 200);
      assert.equal(res.text, 'error');
      });

      test('Returns "success" when correct data is supplied', async function() {
        const res = await chai.request(server)
          .put('/api/threads/test')
          .send({
            report_id: threadId,
            delete_password: deletePassword
          });

        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
      });
    });

    suite('DELETE', function(done) {
      test('Should return "incorrect password" when wrong delete_password is sent', async function() {
        const res = await chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: threadId,
            delete_password: 'wrong'
          })

        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
      });

      test('Should return "success" when correct data is sent', async function() {
        const res = await chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: threadId,
            delete_password: deletePassword
          });

        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
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
      await threads.createThread(board, text, deletePassword);

      const allThreads = await threads.getThreads(board);
      
      threadId = allThreads[0]._id;
    });

    suite('POST', function() {
      test('On success, should redirect to /b/:board/:thread_id', async function() {
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
      });
    });
    
    suite('GET', function() {
      let response;

      suiteSetup(async function() {

        response = await chai.request(server)
          .get('/api/replies/test')
          .query({
            thread_id: threadId.toString()
          });          

      });
      
      test('Returns a json object containing the full thread and the newly added reply', function() {
        assert.equal(response.status, 200);
        assert.isObject(response.body);
      });

      test('Thread includes properties _id, text, created_on, bumped_on, replies. Excludes reported and delete_password', function() {
        const thread = response.body;

        assert.property(thread, '_id');
        assert.property(thread, 'text');
        assert.property(thread, 'created_on');
        assert.property(thread, 'bumped_on');
        assert.property(thread, 'replies');
        assert.notProperty(thread, 'reported');
        assert.notProperty(thread, 'delete_password');
      });

      test('Replies is an array with a length of 1', function() {
        const thread = response.body;

        assert.isArray(thread.replies);
        assert.lengthOf(thread.replies, 1);
      });

      test('Reply includes fields _id, text, created_on. Excludes reported and delete_password', function() {
        const reply = response.body.replies[0];

        assert.property(reply, '_id');
        assert.property(reply, 'text');
        assert.property(reply, 'created_on');
        assert.notProperty(reply, 'reported');
        assert.notProperty(reply, 'delete_password');

        replyId = reply._id;
      });

      test('Reply matches the text of what was sent', function() {
        const reply = response.body.replies[0];

        assert.equal(reply.text, text);
      });

      test('Thread.bumped_on date matches reply.created_on', function() {
        const thread = response.body;
        const reply = thread.replies[0];

        assert.equal(thread.bumped_on, reply.created_on);
      });
    });
    
    suite('PUT', function() {
      test('Returns error when incorrect input is supplied or input is missing');

      test('Returns "success" when correct data is sent', async function() {
        const response = await chai.request(server)
          .put('/api/replies/test')
          .send({
            thread_id: threadId,
            reply_id: replyId
          });

        assert.equal(response.text, 'success');
      });
    });
    
    suite('DELETE', function() {
      test('Returns "incorrect password" when wrong delete_password is sent', async function() {
        const response = await chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: 'wrong'
          });

          assert.equal(response.text, 'incorrect password');
      });
      
      test('Returns "success" when correct data is sent', async function() {
        const response = await chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: deletePassword
          });

          assert.equal(response.text, 'success');
      });
    });
  });
});
