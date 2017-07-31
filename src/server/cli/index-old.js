const Q = require('q');
const Queue = require('promise-queue');
Queue.configure(function (handler) {
    const deferred = Q.defer();
    try {
        handler(deferred.resolve, deferred.reject, deferred.notify);
    } catch (e) {
        console.error('\n\npromise queue error: ', e);
        deferred.reject(e);
    }
    return deferred.promise;
});

let py;


let globalStdoutListener = (data) => console.log(data.toString());
const stdoutListener = (data) => globalStdoutListener(data);

// let globalStdoutEndListener = () => console.log(latestResult);
// const stdoutEndListener = () => globalStdoutEndListener();

let inputCli = (input) => console.log('no stdin set!');

const initializeTensorFlow = (cb) => {
  const spawn = require('child_process').spawn;
  py = spawn('python', ['tf_image_classifier_server.py'], {
    cwd: '/app/src/server/tf-server'
  });
  py.stdin.setEncoding('utf-8');
  py.stdout.on('data', stdoutListener);
  // py.stdout.on('end', stdoutEndListener);
  inputCli = (input) => {
    console.log('received input:', input);
    py.stdin.write(input);
    py.stdin.write('\n');
  }
  cb();
};


// Queue.configure(Promise);
const queue = new Queue(100000, 1);

var inProgress = false;
// var latestResult = '';


const setListener = (cb) => {
  globalStdoutListener = (data) => {
    const result = data.toString();
    console.log('from set global listener: ', result);
    if (result.includes('results')) {
      cb(null, JSON.parse(result));
    } else {
      cb('error at cmd listener: ' + result);
    }
  };
};

// py.stdout.on('end', function(){
//   console.log('Sum of numbers=',dataString);
// });



// py.stdin.end();

const executeClassification = (imgPath, cb) => {
  inProgress = true;
  // latestResult = '';
  setListener(cb);

  inputCli(`'${imgPath}'`);

};

const newClassification = (imgPath) => new Promise((resolve, reject) => {
  if (inProgress) {
    reject('classification already in progress');
  } else {
    executeClassification(imgPath, (err, resultsObject) => {
      inProgress = false;
      if (err) {
        reject(err);
      } else {
        resolve(resultsObject)
      }
    });
  }
});

const queueNewClassification = (imgPath, cb) => {
  queue.add(() => newClassification(imgPath))
    .then((resultObject) => {
      console.log('got result object!', resultObject);
      cb(null, resultObject);
    })
    .catch(cb);
};

module.exports = {
  initializeTensorFlow,
  queueNewClassification
}
