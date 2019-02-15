/*
*
*
*       FILL IN EACH UNIT TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]----
*       (if additional are added, keep them at the very end!)
*/

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should(); //can't use due to assertion-analyzer.js?

const threads = require('../models/threads.js');

suite('Unit Tests', function() {
  suite('Threads', function() {
    const options = { filtered: false, limit: 100 };
    const board = 'test';
    const text = 'test';
    const replyText = 'test reply'
    const deletePassword = 'abc123';

    // To be defined and reused in later tests
    let threadId;
    let replyId;

    suiteSetup(async function() {
      await threads.deleteAllThreadsInBoard(board);
    });
    
    suiteTeardown(async function() {
      await threads.deleteAllThreadsInBoard(board);
    });

    suite('#getThreads() - default options', function() {
      let displayThreads; // To be populated with default formatted thread data (default options)
      
      suiteSetup(async function() {
        // Create 10 test threads with 4 replies each

        for (let thread = 1; thread <= 11; thread++) {
          await threads.createThread(board, `Thread ${thread}`, deletePassword);
        }

        const currentThreadsData = await threads.getThreads(board, options)
        const threadIds = currentThreadsData.map(thread => thread._id.toString());

        for (let id of threadIds) {
          for (let reply = 1; reply <= 4; reply++) {
            await threads.createReply(board, id, `Reply ${reply}`, deletePassword);
          }
        }

        displayThreads = await threads.getThreads(board);
      });

      suiteTeardown(async function() {
        await threads.deleteAllThreadsInBoard(board);
      });
      
      test('Returns an array with a length of 10', function() {
        assert.isArray(displayThreads);
        assert.equal(displayThreads.length, 10);
      });

      test('Each element is a thread that includes fields (_id, text, created_on, bumped_on, replies) with correct data types. Reported and delete_password fields are excluded', function() {
        displayThreads.forEach(thread => {
          assert.property(thread, '_id');
          assert.property(thread, 'text');
          assert.property(thread, 'created_on');
          assert.property(thread, 'bumped_on');
          assert.property(thread, 'replies');
          assert.property(thread, 'replycount');
          assert.notProperty(thread, 'reported');
          assert.notProperty(thread, 'delete_password');

          assert.isString(thread.text);
          assert.instanceOf(thread.created_on, Date);
          assert.instanceOf(thread.bumped_on, Date);
          assert.isArray(thread.replies);
          assert.isNumber(thread.replycount);
      });

      test('Array contains the most recently bumped threads, sorted in descending order', function() {
        const threadDates = displayThreads.map(thread => thread.bumped_on.getTime());
        const sortedThreadDates = [...threadDates].sort((a, b) => b - a);
        
        assert.deepEqual(threadDates, sortedThreadDates);
      });

      test('Each threads replycount has a value of 4', function() {
        displayThreads.forEach(thread => {
          assert.equal(thread.replycount, 4);
        });
      });

      test('Each thread.replies array should contain the 3 most recent replies sort in descending order', function() {
        displayThreads.forEach(thread => {
          assert.isArray(thread.replies);
          assert.isAtMost(thread.replies.length, 3);

          const replyDates = thread.replies.map(reply => reply.created_on.getTime());
          const sortedReplyDates = [...replyDates].sort((a,b) => b - a);

          assert.deepEqual(replyDates, sortedReplyDates);
        });
      }); 

      test('Each reply includes fields _id, text, created_on, with correct data types. Reported and delete_password fields are excluded', function() {
        thread.replies.forEach(reply => {
          assert.property(reply, '_id');
          assert.property(reply, 'text');
          assert.property(reply, 'created_on');
          assert.notProperty(thread, 'reported');
          assert.notProperty(thread, 'delete_password');

          assert.isString(reply.text);
          assert.instanceOf(reply.created_on, Date);
        });
      });

      test('Including options { filtered: false and limit: 10+ }, will return all threads with reported and delete_password fields showing for both threads and replies');

      test('If required parameter (board) is not supplied, an error is returned');
    });
  });
    
    suite('#createThread()', function() {
      test('Returns true on success', async function() {
        this.timeout(5000);

        const returnValue = await threads.createThread(board, text, deletePassword)
        
        assert.isTrue(returnValue);
      });
      
      test('Saves _id, text, created_on(Date), bumped_on(Date), reported(boolean), delete_password, & replies(array)', async function() {
        this.timeout(5000);

        const fullThreads = await threads.getThreads(board, options);

        assert.lengthOf(fullThreads, 1);

        const testThread = fullThreads[0];

        assert.property(testThread, '_id');
        assert.property(testThread, 'text');
        assert.property(testThread, 'delete_password');
        assert.property(testThread, 'created_on');
        assert.property(testThread, 'bumped_on');
        assert.property(testThread, 'reported');
        assert.property(testThread, 'replies');

        assert.equal(text, testThread.text);
        assert.equal(deletePassword, testThread.delete_password);
        assert.instanceOf(testThread.created_on, Date);
        assert.instanceOf(testThread.bumped_on, Date);
        assert.isFalse(testThread.reported);
        assert.isArray(testThread.replies);
        assert.isEmpty(testThread.replies);
        testThread.text.should.equal(text);

        threadId = testThread._id;
      });

      test('If required parameters (board, text, deletePassword) are not supplied, an error is returned');
    });

    suite('#reportThread()', function() {
      test('Returns true on success', async function() {
        const returnValue = await threads.reportThread(board, threadId);

        assert.isTrue(returnValue);
      });

      test('Sets threads reported property to true', async function() {
        const fullThreads = await threads.getThreads(board, options);
        const testThread = fullThreads[0];

        assert.isTrue(testThread.reported);
      });

      test('If required parameters (board, threadId) are not supplied, an error is returned');
    });

    suite('#createReply()', function() {
      let testThread; 
      
      test('Returns true on success', async function() {
        const returnValue = await threads.createReply(board, threadId, replyText, deletePassword);

        assert.isTrue(returnValue);
      });

      test('Updates bumped_on property of thread', async function() {
        const fullThreads = await threads.getThreads(board, options);
        
        testThread = fullThreads[0];

        assert.isAbove(testThread.bumped_on, testThread.created_on);
      });

      test('Pushes a new object to replies array. Should have properties (_id,  text, reported, delete_password, created_on)', function() {
        assert.lengthOf(testThread.replies, 1);

        const reply = testThread.replies[0];

        assert.property(reply, '_id');
        assert.property(reply, 'text');
        assert.property(reply, 'reported');
        assert.property(reply, 'delete_password');
        assert.property(reply, 'created_on');

        replyId = reply._id; // Reused in later tests 
      });

      test('The new reply text value matches the submitted value', function() {
        const reply = testThread.replies[0];

        assert.equal(reply.text, replyText);
      })

      test('The new reply created_on value matches the thread bumped_on value', function() {
        const bumpedOn = testThread.bumped_on;
        const replyDate = testThread.replies[0].created_on;

        assert.equal(bumpedOn.toString(), replyDate.toString());
      });

      test('If required parameters (board, threadId, text, deletePassword) are not supplied, an error is returned');
    });

    suite('#reportReply()', function() {
      let fullThreads;

      test('Returns true on success', async function() {
        const returnValue = await threads.reportReply(board, threadId, replyId);

        assert.isTrue(returnValue);
      });

      test('Reply reported property is set to true', async function() {
        fullThreads = await threads.getThreads(board, options);

        const testThread = fullThreads[0];
        const reply = testThread.replies[0];

        assert.isTrue(reply.reported);
      });

      test('If required parameters (board, threadId, replyId) are not supplied, an error is returned');
    });

    suite('#getFullThread()', function() {
      let fullThread;
      let expectedTotalReplies = 5;
      
      suiteSetup(async function() {
        try {
          for (let x = 2; x <= expectedTotalReplies; x++) {
            await threads.createReply(board, threadId, `${replyText} ${x}`, deletePassword);
          }

          fullThread = await threads.getFullThread(board, threadId);
        } catch(err) {
          console.log(err);
        }
      });

      test('Return value excludes reported or delete_password fields for the thread and replies', function () {
        assert.property(fullThread, '_id');
        assert.property(fullThread, 'text');
        assert.property(fullThread, 'created_on');
        assert.property(fullThread, 'bumped_on');
        assert.property(fullThread, 'replies');
        assert.notProperty(fullThread, 'reported');
        assert.notProperty(fullThread, 'delete_password');

        fullThread.replies.forEach(reply => {
          assert.property(fullThread, '_id');
          assert.property(fullThread, 'text');
          assert.property(fullThread, 'created_on');
          assert.notProperty(fullThread, 'reported');
          assert.notProperty(fullThread, 'delete_password');
        });
      });

      test('Includes all replies, sorted ascending by date', function() {
        const replyDates = fullThread.replies.map(reply => reply.created_on);
        const sortedReplyDates = [...replyDates].sort((a, b) => a - b);

        assert.deepEqual(replyDates, sortedReplyDates);
        assert.lengthOf(fullThread.replies, expectedTotalReplies);
      });

      test('If required parameters (board, threadId) are not supplied, an error is returned');
    });

    suite('#deleteReply()', function() {
      test('Returns true on success', async function() {
        const returnValue = await threads.deleteReply(board, threadId, replyId, deletePassword);

        assert.isTrue(returnValue);
      });

      test('Specified replyId should no longer exist in thread.replies', async function() {
        const fullThreads = await threads.getThreads(board, options);
        const testThread = fullThreads.filter(thread => thread._id.equals(threadId))[0];

        testThread.replies.forEach(reply => {
          assert.isFalse(replyId.equals(reply._id));
        });
      });

      test('If required parameters (board, threadId, replyId, deletePassword) are not supplied, an error is returned');
    });

    suite('#deleteThread()', function() {
      test('Returns true on success', async function() {
        const returnValue = await threads.deleteThread(board, threadId, deletePassword);

        assert.isTrue(returnValue);
      });

      test('Specified threadId no longer exists', async function() {
        const fullThreads = await threads.getThreads(board, options);

        assert.lengthOf(fullThreads, 0);
      });

      test('If required parameters (board, threadId, deletePassword) are not supplied, an error is returned');
    });
  });
});