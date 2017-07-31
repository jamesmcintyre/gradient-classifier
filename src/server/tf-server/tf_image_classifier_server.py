import os, sys, json, base64

import tensorflow as tf

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import numpy as np
from PIL import Image
from flask import Flask, request
app = Flask(__name__)

#-----------tensorflow stuff ------------------

# Loads label file, strips off carriage return
label_lines = [line.rstrip() for line
                   in tf.gfile.GFile("/app/src/server/tf-server/retrained_labels.txt")]

# Unpersists graph from file
with tf.gfile.FastGFile("/app/src/server/tf-server/retrained_graph.pb", 'rb') as f:
    graph_def = tf.GraphDef()
    graph_def.ParseFromString(f.read())
    tf.import_graph_def(graph_def, name='')

#Read data from stdin
# def read_in():
#     lines = sys.stdin.readlines()
#     #Since our input would only be having one line
#     return json.loads(lines[0]);

def classifyImage(img_array):
    # change this as you see fit
    # image_path = sys.argv[1]
    # print('alive')
    # image_path = raw_input()
    # print(image_path)
    # Read in the image_data
    # image_data = tf.gfile.FastGFile(image_path, 'rb').read()
    with tf.Session() as sess:
        # Feed the image_data as input to the graph and get first prediction
        softmax_tensor = sess.graph.get_tensor_by_name('final_result:0')

        predictions = sess.run(softmax_tensor, \
                 {'DecodeJpeg/contents:0': img_array})
        # predictions = sess.run(softmax_tensor, \
        #          {'DecodeJpeg:0': img_array})

        resultArray = [];

        # Sort to show labels of first prediction in order of confidence
        top_k = predictions[0].argsort()[-len(predictions[0]):][::-1]
        for node_id in top_k:
            human_string = label_lines[node_id]
            score = predictions[0][node_id]
            resultObject = {}
            resultObject['upc'] = human_string
            resultObject['score'] = round(score, 5)
            resultArray.append(resultObject)
            # print('%s (score = %.5f)' % (human_string, score))

        responseBody = {}
        responseBody['results'] = resultArray
        jsonResponseBody = json.dumps(responseBody)
        print(jsonResponseBody)
        return jsonResponseBody

def base64_decode_op(x):
  return tf.py_func(lambda x: base64.decodestring(x), [x], [tf.string])[0]
# while True:
#     classifyImage()

#---------------- end of tensorflow stuff ------------------
@app.route("/")
def hello():
    return "Hello World!"

# @app.route("/classify", methods=["POST"])
# def home():
#     img = Image.open(request.files['file'])
#     image_array = np.array(img)[:, :, 0:3]
#     jsonResponse = classifyImage(image_array)
#     return jsonResponse
@app.route("/classify", methods=["POST"])
def home():
    # img = Image.open(request.files['file'])
    # image_array = np.array(img)[:, :, 0:3]
    # print(request.json)
    req = request.get_json(force=True)
    # print(req)
    img = request.get_json()['img']
    # img = req.img
    decodedImg = base64.decodestring(img)
    # image_array = np.array(img)[:, :, 0:3]
    jsonResponse = classifyImage(decodedImg)
    return jsonResponse
    # return 'jsonResponse'
