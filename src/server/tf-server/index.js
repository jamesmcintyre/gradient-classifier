const Q = require('q');
const Queue = require('promise-queue');
const spawn = require('child_process').spawn;

// var PythonShell = require('python-shell');
// var pyshell = new PythonShell('tf_image_classifier_server.py', {
//   pythonPath: 'app/src/server/tf-server'
// });

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

// let py;


// let globalStdoutListener = (data) => console.log(data.toString());
// const stdoutListener = (data) => globalStdoutListener(data);

// let globalStdoutEndListener = () => console.log(latestResult);
// const stdoutEndListener = () => globalStdoutEndListener();

// let inputCli = (input) => console.log('no stdin set!');

class TfImageClassifier {
  constructor() {
    this.instance = spawn('python', ['tf_image_classifier_server.py'], {
      cwd: '/app/src/server/tf-server'
    });
    // process.stdout.write('hello')
    // this.pyshell = new PythonShell('tf_image_classifier_server.py', {
    //   scriptPath: '/app/src/server/tf-server',
    //   mode: 'text'
    // });
    this.stdOutBuffer = '';
    this.instance.stdout.on('data', (data) => {
      console.log('raw output: ', data.toString());
      this.listener(null, data.toString())
    });
    this.instance.stdin.setEncoding('utf-8');
    // this.
    this.listener = (err, data) => {
      console.log('listener not set: ', data);
    };

    // this.pyshell.on('message', (message) => {
    //   this.listener(null, message);
    // });

    this.queue = new Queue(100000, 1);

    this.inProgress = false;
    // this.waitForStdOut = this.waitForStdOut.bind(this);
    // this.listener = this.listener.bind(this);
    // this.setListenerCallback = this.setListenerCallback.bind(this);
    this.executeClassification = this.executeClassification.bind(this);
    this.input = this.input.bind(this);
  }

  // setListenerCallback(cb) {
  //   this.listenerCallback = cb;
  // }
  // listener(data) {
  //   // this.stdOutBuffer += data.toString();
  //   // console.log(data.toString());
  //   this.listenerCallback(null, data);
  // }
  input(data) {
    console.log('received input:', data);
    // this.pyshell.send(data);
    // this.pyshell.send('\n');
    try {
      this.instance.stdin.write(data);
      this.instance.stdin.write('\n');

    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  // waitForStdOut(callback) {
  //   console.log('this.stdOutBuffer: ', this.stdOutBuffer);
  //   if(this.stdOutBuffer === '') {
  //     setTimeout(this.waitForStdOut, 1000);
  //     return;
  //   }
  //   const resultObject = JSON.parse(this.stdOutBuffer);
  //   this.stdOutBuffer = '';
  //   return callback(null, resultObject);
  // }
  executeClassification(imgPath, cb) {
    this.inProgress = true;

    this.listener = cb;
    // do {
    //   if (this.stdOutBuffer !== '') {
    //     const resultObject = JSON.parse(this.stdOutBuffer);
    //     this.stdOutBuffer = '';
    //     cb(null, resultObject);
    //   }
    // } while (this.stdOutBuffer === '');
    // this.waitForStdOut(cb);
    this.input(`${imgPath}`);
  };
  newClassification(imgPath) {
    return new Promise((resolve, reject) => {
      if (this.inProgress) {
        reject('classification already in progress');
      } else {
        this.executeClassification(imgPath, (err, resultsObject) => {
          this.inProgress = false;
          if (err) {
            reject(err);
          } else {
            resolve(resultsObject)
          }
        });
      }
    });
  }
  run(imgPath, cb) {
    this.queue.add(() => this.newClassification(imgPath))
      .then((resultObject) => {
        console.log('got result object!', resultObject);
        cb(null, resultObject);
      })
      .catch(cb);
  }
};


// Queue.configure(Promise);


// var inProgress = false;
// // var latestResult = '';
//
//
// const setListener = (cb) => {
//   globalStdoutListener = (data) => {
//     const result = data.toString();
//     console.log('from set global listener: ', result);
//     if (result.includes('results')) {
//       cb(null, JSON.parse(result));
//     } else {
//       cb('error at cmd listener: ' + result);
//     }
//   };
// };

// py.stdout.on('end', function(){
//   console.log('Sum of numbers=',dataString);
// });



// py.stdin.end();

// const executeClassification = (imgPath, cb) => {
//   inProgress = true;
//   // latestResult = '';
//   setListener(cb);
//
//   inputCli(`'${imgPath}'`);
//
// };
//
// const newClassification = (imgPath) => new Promise((resolve, reject) => {
//   if (inProgress) {
//     reject('classification already in progress');
//   } else {
//     executeClassification(imgPath, (err, resultsObject) => {
//       inProgress = false;
//       if (err) {
//         reject(err);
//       } else {
//         resolve(resultsObject)
//       }
//     });
//   }
// });
//
// const queueNewClassification = (imgPath, cb) => {
//   this.queue.add(() => newClassification(imgPath))
//     .then((resultObject) => {
//       console.log('got result object!', resultObject);
//       cb(null, resultObject);
//     })
//     .catch(cb);
// };

// module.exports = {
//   initializeTensorFlow,
//   queueNewClassification
// }

module.exports = TfImageClassifier;
