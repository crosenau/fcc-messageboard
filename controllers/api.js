/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect    = require('chai').expect;
const ObjectID  = require('mongodb').ObjectID;

const getDb = require('../models/db.js').getDb;

module.exports = function (app) {

  const db = getDb();

  app.route('/api/threads/:board')
    .get((req, res) => {
      db.collection(`${req.params.board}-threads`).find({}).sort({bumped_on: -1}).limit(10).toArray()
        .then(result => {
          const threads = [];

          for (let thread of result) {
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

          res.json(threads);
        })
        .catch(err => {
          console.log(err);
          res.send('Error retrieving threads');
        });
    })

    .post((req, res) => {
      const timeStamp = new Date(); //alternatively use $currentDate parameter?
      const newThread = {
        text: req.body.text,
        created_on: timeStamp,
        bumped_on: timeStamp,
        reported: false,
        delete_password: req.body.delete_password, //bCrypt(password)
        replies: []
      };

      db.collection(`${req.params.board}-threads`).insertOne(newThread)
        .then(result => {
          if (result.ops.length === 0) {
            if (process.env.NODE_ENV === 'test' && req.query.debug === process.env.DEBUG_KEY) {
              return res.json(result.ops[0]);
            }
            return res.send('Error posting new thread');
          }
        
          res.redirect(`/b/${req.params.board}`);
        })
        .catch(err => {
          console.log(err);
          res.send('error');
        });
    })

    .put((req, res) => {
      const filter = { _id: ObjectID(req.body.report_id) };
      const update = {
        $set: { reported: true } 
      };
      const options = { returnOriginal : false }

      db.collection(`${req.params.board}-threads`).findOneAndUpdate(filter, update, options)
        .then(result => {
          console.log(result.value);
          if (result.lastErrorObject.updatedExisting) {
            if (process.env.NODE_ENV === 'test' && req.query.debug === process.env.DEBUG_KEY) {
              return res.json(result.value);
            }
            return res.send('success')
          }

          res.send('error');
        })
        .catch(err => {
          console.log(err);
          res.send('error');
        });
    })
    
    .delete((req, res) => {
      const filter = {
        _id: ObjectID(req.body.thread_id),
        delete_password: req.body.delete_password
      };

      db.collection(`${req.params.board}-threads`).findOneAndDelete(filter)
        .then(result => {
          if (result.value) {
            return res.send('success');
          } 
          
          return res.send('incorrect password');
        })
        .catch(err => {
          console.log(err);
          res.send('error');
        });

    });

  app.route('/api/replies/:board')
    .get((req, res) => {
      const query = { _id: ObjectID(req.query.thread_id) };

      db.collection(`${req.params.board}-threads`).findOne(query)
        .then(result => {
          const thread = {
            _id: result._id,
            text: result.text,
            created_on: result.created_on,
            bumped_on: result.bumped_on,
            replies: []
          };

          for (let reply of result.replies) {
            thread.replies.push({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            });
          }

          thread.replies = thread.replies.sort((a, b) => a.created_on - b.created_on);

          res.json(thread);
        })
        .catch(err => {
          console.log(err);
        });
    })
    
    .post((req, res) => {
      const timeStamp = new Date();
      const filter = { _id: ObjectID(req.body.thread_id) };
      const reply = {
        _id: new ObjectID(),
        text: req.body.text,
        reported: false,
        delete_password: req.body.delete_password,
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

      db.collection(`${req.params.board}-threads`).findOneAndUpdate(filter, update, options)
        .then(result => {
          if (result.lastErrorObject.updatedExisting) {
            return res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
          }

          res.send('error');
        })
        .catch(err => {
          console.log(err);
          res.send('error');
        });
    })
    
    .put((req, res) => {
      const filter = {
        _id: ObjectID(req.body.thread_id),
        'replies._id': ObjectID(req.body.reply_id)
      };
      const update = {
        $set: { 'replies.$.reported': true }
      };
      const options = { returnOriginal: false };

      db.collection(`${req.params.board}-threads`).findOneAndUpdate(filter, update, options)
        .then(result => {
          console.log(result);
          if (result.lastErrorObject.updatedExisting) {
            return res.send('success')
          }

          res.send('error');
        })
        .catch(err => {
          console.log(err);
          res.send('error');
        });
    })
    
    .delete((req, res) => {
      const filter = { _id: ObjectID(req.body.thread_id) };
      const update = {
        $pull: {
          replies: { _id: ObjectID(req.body.reply_id) }
        }
      }
      const options = { returnOriginal: false };

      db.collection(`${req.params.board}-threads`).findOneAndUpdate(filter, update, options)
        .then(result => {
          console.log(result);

          if (result.lastErrorObject.updatedExisting) {
            return res.send('success');
          }

          res.send('incorrect password');
        })
        .catch(err => {
          console.log(err);
          res.send('error');
        });
    });
};
