/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const router    = require('express').Router();

const threads = require('../models/threads.js');

router.route('/threads/:board')
  .get((req, res) => {
    const board = req.params.board;

    threads.getThreads(board)
      .then(threads => {
        res.json(threads);
      })
      .catch(err => {
        console.log(err);
        res.send('Error retrieving threads');
      });
  })

  .post((req, res) => {
    const board = req.params.board;
    const text = req.body.text;
    const deletePassword = req.body.delete_password;

    threads.createThread(board, text, deletePassword)
      .then((result) => {
        if (result) {
          res.redirect(`/b/${req.params.board}`);
        }
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })

  .put((req, res) => {
    const board = req.params.board;
    const reportId = req.body.report_id

    threads.reportThread(board, reportId)
      .then(result => {
        if (result) {
          return res.send('success');
        }

        res.send('error');
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })
  
  .delete((req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const deletePassword = req.body.delete_password;

    threads.deleteThread(board, threadId, deletePassword)
      .then(result => {
        if (result) {
          return res.send('success');
        }

        res.send('incorrect password');
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });

  });

router.route('/replies/:board')
  .get((req, res) => {
    const board = req.params.board;
    const threadId = req.query.thread_id;

    threads.getFullThread(board, threadId)
      .then(result => res.json(result))
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })
  
  .post((req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const text = req.body.text;
    const deletePassword = req.body.delete_password;

    threads.createReply(board, threadId, text, deletePassword)
      .then(result => {
        if (result) {
          return res.redirect(`/b/${board}/${threadId}`);
        }

        res.send('error');
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })
  
  .put((req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const replyId = req.body.reply_id;

    threads.reportReply(board, threadId, replyId)
      .then(result => {
        if (result) {
          return res.send('success')
        }

        res.send('error: reply not reported');
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })
  
  .delete((req, res) => {
    const board = req.params.board;
    const threadId = req.body.thread_id;
    const replyId = req.body.reply_id;
    const deletePassword = req.body.delete_password;

    threads.deleteReply(board, threadId, replyId, deletePassword)
      .then(result => {
        if (result) {
          return res.send('success');
        }

        res.send('incorrect password');
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  });

module.exports = router;