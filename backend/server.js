const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.use(cors());
app.use(express.json());

app.post('/upload', upload.array('files'), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded or invalid file type' });
  }

  const results = [];

  for (const file of files) {
    const filePath = path.join(__dirname, file.path);
    const fileExtension = path.extname(file.originalname).toLowerCase();

    const pythonProcess = spawn('python3', [path.join(__dirname, 'process_file.py'), filePath]);

    let scriptOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'An error occurred while processing the file' });
      }
    });

    await new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        fs.unlinkSync(filePath);
        results.push({ fileName: file.originalname, text: scriptOutput, success: code === 0 });
        resolve();
      });
    });
  }

  res.json({ results });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
