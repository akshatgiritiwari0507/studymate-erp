const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    text: String,
    done: { type: Boolean, default: false }
  });
  return conn.models.Todo || conn.model('Todo', schema, 'todo');
};
