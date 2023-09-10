const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const taskSchema = new mongoose.Schema({
  taskName: String,
  date: { type: Date, default: Date.now },
  completed: Boolean,
});

const Task = mongoose.model('Task', taskSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = 10;

    const tasks = await Task.find({})
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ date: 'desc' });

    const totalTasks = await Task.countDocuments();
    const completedTasks = tasks.filter((task) => task.completed).length;
    const completionPercentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    res.render('index', { tasks, completionPercentage, page, totalTasks });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving tasks');
  }
});

app.post('/tasks', async (req, res) => {
  const { taskName } = req.body;
  const newTask = new Task({ taskName });

  try {
    await newTask.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating task');
  }
});

app.post('/update/:id', async (req, res) => {
  const taskId = req.params.id;

  try {
    await Task.findByIdAndUpdate(taskId, { completed: true });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating task');
  }
});

app.post('/delete/:id', async (req, res) => {
  const taskId = req.params.id;

  try {
    await Task.findByIdAndRemove(taskId);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting task');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
