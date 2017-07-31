const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Promise = require('bluebird');
const fetchFileAsync = require('fetch-file');

const fetchFile = (urlPath, savePath) => new Promise((resolve, reject) => {
  fetchFileAsync(urlPath, savePath, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve(savePath);
    }
  })
});

// const queueNewClassification = require('../cli').queueNewClassification;
// const initializeTensorFlow = require('../cli').initializeTensorFlow;
const tfImageClassifier = require('../tf-server');

const classifier = new tfImageClassifier();

const app = express();

// Normal express config defaults
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const fileNameRegex = /(\w+)(\.\w+)+(?!.*(\w+)(\.\w+)+)/;
const savePath = (url) => path.join(__dirname, `../../../temp/${url.match(fileNameRegex)[0]}`);

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/classify', function (req, res) {
  console.log('\n\n\n\nreq:', req.query);
  const { imgUrl, uuid } = req.query;
  const tempImgPath = savePath(imgUrl);

  fetchFile(imgUrl, tempImgPath)
    .then(() => classifier.run(tempImgPath, (err, resultObject) => {
      if (err) {
        console.log('classifier.run error: ', err);
        return res.status(400).send(err);
      }
      return res.send(Object.assign({}, resultObject, {test: 'test'}));
    }))
    .catch((err) => {
      console.log('error at route:', err);
      res.status(400).send(err);
    })

});

// initializeTensorFlow(() => {
app.listen(3000, function () {
  console.log('listening on port 3000!')
});
// })
