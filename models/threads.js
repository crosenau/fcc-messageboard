'use strict';

const ObjectID = require('mongodb').ObjectID;

const getDb = require('./db.js').getDb;

async function getThreads(board) {
  const db = getDb();

  try {
    const dbResults = await db.collection(`${board}-threads`).find({}).sort({bumped_on: -1}).limit(10).toArray();
    const threads = [];

    for (let thread of dbResults) {
      const newThread = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replycount: thread.replies.length,
        replies: thread.replies
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
      };

      threads.push(newThread);
    }

    return threads;
  } catch(err) {
    throw(err);
  }
}

async function createThread(board, text, deletePassword) {
  const db = getDb();
  const timeStamp = new Date();
  const newThread = {
    text: text,
    created_on: timeStamp,
    bumped_on: timeStamp,
    reported: false,
    delete_password: deletePassword, //bCrypt(password)
    replies: []
  };
  
  try {
    const dbResults = await db.collection(`${board}-threads`).insertOne(newThread);

    if (dbResults.ops.length === 0) {
      throw new Error('Error posting new thread');
    }

    return dbResults.ops[0];
  } catch(err) {
    throw err;
  }
}

async function reportThread(board, reportId) {
  const db = getDb();
  const filter = { _id: ObjectID(reportId) };
  const update = { $set: { reported: true } };
  const options = { returnOriginal : false }

  try {
    const dbResults = await db.collection(`${board}-threads`).findOneAndUpdate(filter, update, options);

    console.log(dbResults);
    return dbResults.lastErrorObject.updatedExisting;
  } catch(err) {
    throw err;
  }
}

async function deleteThread(board, threadId, deletePassword) {
  const db = getDb();
  const filter = {
    _id: ObjectID(threadId),
    delete_password: deletePassword
  };

  try {
    const dbResults = await db.collection(`${board}-threads`).findOneAndDelete(filter);

    return dbResults.value;

  } catch(err) {
    throw err;
  }
}

async function getFullThread(board, threadId) {
  const db = getDb();
  const query = { _id: ObjectID(threadId) };

  console.log(threadId);

  try {
    const dbResults = await db.collection(`${board}-threads`).findOne(query);
    const thread = {
      _id: dbResults._id,
      text: dbResults.text,
      created_on: dbResults.created_on,
      bumped_on: dbResults.bumped_on,
      replies: []
    };

    for (let reply of dbResults.replies) {
      thread.replies.push({
        _id: reply._id,
        text: reply.text,
        created_on: reply.created_on
      });
    }

    thread.replies = thread.replies.sort((a, b) => a.created_on - b.created_on);

    return thread;
  } catch(err) {
    throw err;
  }
}

async function createReply(board, threadId, text, deletePassword) {
  const db = getDb();
  const timeStamp = new Date();
  const filter = { _id: ObjectID(threadId) };
  const reply = {
    _id: new ObjectID(),
    text: text,
    reported: false,
    delete_password: deletePassword,
    created_on: timeStamp
  };
  const update = {
    $set: {
      bumped_on: timeStamp
    },
    $push: {
      replies: reply
    },
  };
  const options = { returnOriginal: false };

  try {
    const dbResults = await db.collection(`${board}-threads`).findOneAndUpdate(filter, update, options);

    console.log(dbResults);
    return dbResults.lastErrorObject.updatedExisting
  } catch(err) {
    throw err;
  }
}

async function reportReply(board, threadId, replyId) {
  const db = getDb();
  const filter = {
    _id: ObjectID(threadId),
    'replies._id': ObjectID(replyId)
  };
  const update = { $set: { 'replies.$.reported': true } };
  const options = { returnOriginal: false };

  try {
    const dbResults = await db.collection(`${board}-threads`).findOneAndUpdate(filter, update, options);

    return dbResults.lastErrorObject.updatedExisting;
  } catch(err) {
    throw err;
  }
}

async function deleteReply(board, threadId, replyId, deletePassword) {
  const db = getDb();
  const filter = { _id: ObjectID(threadId) };
  const update = {
    $pull: {
      replies: {
        _id: ObjectID(replyId),
        delete_password: deletePassword
      }
    }
  }
  const options = { returnOriginal: false };

  try {
    const dbResults = await db.collection(`${board}-threads`).findOneAndUpdate(filter, update, options);

    if (dbResults.lastErrorObject.updatedExisting) {
      const replies = dbResults.value.replies;

      for (let reply of replies) {
        if (reply._id.equals(ObjectID(replyId))) {
          return false;
        }
      }

      return true;
    }
  } catch(err) {
    throw err;
  }
}

module.exports = {
  getThreads,
  createThread,
  reportThread,
  deleteThread,
  getFullThread,
  createReply,
  reportReply,
  deleteReply
}