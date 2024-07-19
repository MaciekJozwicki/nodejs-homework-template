const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const auth = require('./middleware/auth');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const contactsRouter = require('./routes/api/contacts');
const usersRouter = require('./routes/api/users');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

const tmpDir = path.join(__dirname, 'tmp'); 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tmpDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage });

app.use('/api/contacts', contactsRouter);
app.use('/api/users', upload.single('avatar'), usersRouter);
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
