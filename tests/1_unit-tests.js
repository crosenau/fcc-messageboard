/*
*
*
*       FILL IN EACH UNIT TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]----
*       (if additional are added, keep them at the very end!)
*/

/**
 * createThread -
 * reportThread -
 * createReply -
 * reportReply -
 * getFullThread -
 * deleteReply
 * deleteThread
 * getThreads (after creating multiple threads and replies)
 */

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should(); //can't use due to assertion-analyzer.js?

const threads = require('../models/threads.js');

suite('threads', function() {
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
    });

    suiteTeardown(async function() {
      await threads.deleteAllThreadsInBoard(board);
    });
    
    test('Should return array containing a maximum of 10 of the most recently bumped threads', async function() {
      displayThreads = await threads.getThreads(board);
      fullThreads = await threads.getThreads(board, options);

      assert.isArray(displayThreads);
      assert.isAtMost(displayThreads.length, 10);
    });

    test('Array contains the most recently bumped threads, sorted in descending order', function() {
      const threadDates = displayThreads.map(thread => thread.bumped_on.getTime());
      const fullThreadDates = fullThreads.map(thread => thread.bumped_on.getTime());

      assert.equal(Math.max(...threadDates), Math.max(...fullThreadDates));

      const sortedThreadDates = [...threadDates].sort((a, b) => b - a);
      
      assert.deepEqual(threadDates, sortedThreadDates);
    });

    test('Each thread.replies array should contain the 3 most recent replies sort in descending order', function() {
      const date = new Date();

      displayThreads.forEach(thread => {
        assert.isArray(thread.replies);
        assert.isAtMost(thread.replies.length, 3);

        const replyDates = thread.replies.map(reply => reply.created_on.getTime());
        const sortedReplyDates = [...replyDates].sort((a,b) => b - a);

        assert.deepEqual(replyDates, sortedReplyDates);
      });
    }); 
    
    test('Thread and replies only include valid fields and exclude reported and delete_password', function() {
      displayThreads.forEach(thread => {
        assert.property(thread, '_id');
        assert.property(thread, 'text');
        assert.property(thread, 'created_on');
        assert.property(thread, 'bumped_on');
        assert.property(thread, 'replies');
        assert.notProperty(thread, 'reported');
        assert.notProperty(thread, 'delete_password');

        thread.replies.forEach(reply => {
          assert.property(reply, '_id');
          assert.property(reply, 'text');
          assert.property(reply, 'created_on');
          assert.notProperty(thread, 'reported');
          assert.notProperty(thread, 'delete_password');
        });
      });
    });
  });
  
  suite('#createThread()', function() {
    test('Should return true', async function() {
      const returnValue = await threads.createThread(board, text, deletePassword)
      
      assert.isTrue(returnValue);
    });
    
    test('Should save _id, text, created_on(Date), bumped_on(Date), reported(boolean), delete_password, & replies(array).', async function() {
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
  });

  suite('#reportThread()', function() {
    test('Should return true on success', async function() {
      const returnValue = await threads.reportThread(board, threadId);

      assert.isTrue(returnValue);
    });

    test('Should set threads reported property to true', async function() {
      const fullThreads = await threads.getThreads(board, options);
      const testThread = fullThreads[0];

      assert.isTrue(testThread.reported);
    });
  });

  suite('#createReply()', function() {
    let testThread; 
    
    test('Should return true on success', async function() {
      const returnValue = await threads.createReply(board, threadId, replyText, deletePassword);

      assert.isTrue(returnValue);
    });

    test('Should update bumped_on property of thread', async function() {
      const fullThreads = await threads.getThreads(board, options);
      
      testThread = fullThreads[0];

      assert.isAbove(testThread.bumped_on, testThread.created_on);
    });

    test('Should push a new object to replies array. Should have properties _id,  text, reported, delete_password, created_on.', function() {
      assert.lengthOf(testThread.replies, 1);

      const reply = testThread.replies[0];

      assert.property(reply, '_id');
      assert.property(reply, 'text');
      assert.property(reply, 'reported');
      assert.property(reply, 'delete_password');
      assert.property(reply, 'created_on');

      replyId = reply._id; // Reused in later tests 
    });

    test('The new reply text value should match the submitted value', function() {
      const reply = testThread.replies[0];

      assert.equal(reply.text, replyText);
    })

    test('The new reply created_on value should match the thread bumped_on value', function() {
      const bumpedOn = testThread.bumped_on;
      const replyDate = testThread.replies[0].created_on;

      assert.equal(bumpedOn.toString(), replyDate.toString());
    });
  });

  suite('#reportReply()', function() {
    let fullThreads;

    test('Should return true on success', async function() {
      const returnValue = await threads.reportReply(board, threadId, replyId);

      assert.isTrue(returnValue);
    });

    test('Reply reported property should be set to true', async function() {
      fullThreads = await threads.getThreads(board, options);

      const testThread = fullThreads[0];
      const reply = testThread.replies[0];

      assert.isTrue(reply.reported);
    });
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

    test('Return value should not include properties reported or delete_password for the thread or any of the replies', function () {

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

    test('Should include all fullThread replies, sorted ascending by date', function() {
      const replyDates = fullThread.replies.map(reply => reply.created_on);
      const sortedReplyDates = [...replyDates].sort((a, b) => a - b);

      assert.deepEqual(replyDates, sortedReplyDates);
      assert.lengthOf(fullThread.replies, expectedTotalReplies);
    });
  });

  suite('#deleteReply()', function() {
    test('Should return true on success', async function() {
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
  });

  suite('#deleteThread()', function() {
    test('Should return true on success', async function() {
      const returnValue = await threads.deleteThread(board, threadId, deletePassword);

      assert.isTrue(returnValue);
    });

    test('Specified threadId should no longer exist', async function() {
      const fullThreads = await threads.getThreads(board, options);

      assert.lengthOf(fullThreads, 0);
    });
  });
});