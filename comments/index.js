const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const commentList = {};

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/posts/:id/comments', (req, res) => {
  res.send(commentList[req.params.id] || []);
});
app.post('/posts/:id/comments', async (req, res) => {
  const id = randomBytes(4).toString('hex');
  const { content } = req.body;

  const comments = commentList[req.params.id] || [];
  comments.push({ id, content, status: 'pending' });
  commentList[req.params.id] = comments;

  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id, content, postId: req.params.id, status: 'pending' },
  });

  res.status(201).send(comments);
});
app.post('/events', async (req, res) => {
  const { type, data } = req.body;

  if ((type = 'CommentModerated')) {
    const { postId, id, status } = data;
    const comments = commentList[postId];
    const comment = comments.find((c) => c.id === id);
    comment.status = status;

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        status,
        postId,
        content,
      },
    });
  }
  res.send({});
});
app.listen(4001, () => console.log(`listening on 4001`));
