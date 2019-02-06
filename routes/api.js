/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const ObjectID = require('mongodb').ObjectID;

module.exports = function (app, db) {

  app.route('/api/threads/:board')
    .get((req, res) => {
      db.collection(`${req.params.board}-threads`).find({}).sort({bumped_on: -1}).limit(10).toArray()
        .then(result => {
          const threads = [];

          for (let thread of result) {
            const newThread = {...thread};

            newThread.replycount = newThread.replies.length;
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
        deletePassword: req.body.delete_password, //bCrypt(password)
        replies: []
      };

      db.collection(`${req.params.board}-threads`).insertOne(newThread)
        .then(result => {
          if (result.ops.length === 0) {
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
      const filter = {
        _id : ObjectID(req.body.thread_id),
        deletePassword: req.body.delete_password
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

  app.route('/api/replies/:board');

};
