/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const router                      = require('express').Router();
const { check, validationResult } = require('express-validator/check');


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

  .post(check('text').escape().trim(), (req, res) => {
    console.log(req.body.text);
    const errors = validationResult(req);

    if (!errors.isEmpty) {
      return res.status(422).json({ errors: errors.array() });
    }

    const board = req.params.board;
    const { text, delete_password } = req.body;

    threads.createThread(board, text, delete_password)
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

  .put(check('report_id').isMongoId(), (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const board = req.params.board;
    const report_id = req.body.report_id

    threads.reportThread(board, report_id)
      .then(result => {
        if (result) {
          return res.send('success');
        }

        res.send('thread not found');
      })
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })
  
  .delete(check('thread_id').isMongoId(), (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const board = req.params.board;
    const { thread_id, delete_password } = req.body;

    threads.deleteThread(board, thread_id, delete_password)
      .then(result => {
        if (result) {
          return res.send('success');
        }

        res.send('incorrect password');
      })
      .catch(err => {
        console.log(err);
        res.status(422).send('error');
      });

  });

router.route('/replies/:board')
  .get(check('thread_id').isMongoId(), (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const board = req.params.board;
    const thread_id = req.query.thread_id;

    threads.getFullThread(board, thread_id)
      .then(result => res.json(result))
      .catch(err => {
        console.log(err);
        res.send('error');
      });
  })
  
  .post([
    check('thread_id').isMongoId(),
    check('text').escape().trim()
  ], (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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
  
  .put([
    check('thread_id').isMongoId(),
    check('reply_id').isMongoId()
  ], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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
  
  .delete([
    check('thread_id').isMongoId(),
    check('reply_id').isMongoId()
  ], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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