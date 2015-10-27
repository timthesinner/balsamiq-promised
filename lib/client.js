//Copyright (c) 2015 TimTheSinner All Rights Reserved.
'use strict';

/**
 * Copyright (c) 2015 TimTheSinner All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 * 
 * @author TimTheSinner
 */
var Q = require('q'),
    _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    random = require('./balsamiq').random;
    
function BalsamiqClient(options) {
  this.options = _.extend({
    target:path.resolve('./target.bmml'),
    dest:path.resolve('./target.png')
  }, options);
  
  this.balsamiq = require('./balsamiq')(options.executable);
  this.rendering = false;
  
  //configure end-points
  this.options.listener.post('/balsamiq/render', this.render.bind(this));
  this.options.listener.post('/balsamiq/render/', this.render.bind(this));
  this.options.listener.get('/balsamiq/render', this.status.bind(this));
  this.options.listener.get('/balsamiq/render/', this.status.bind(this));
}
module.exports = function(options) {
  return new BalsamiqClient(options);
};

BalsamiqClient.prototype.setTimeout = function(timeout) {
  this.balsamiq.setTimeout(timeout);
}

BalsamiqClient.prototype.register = function(client, server) {
  var self = this;
  return Q.promise(function(resolve, reject) {
    client = _.extend({host:'localhost', port:80}, client);
    self.options.request({
      method: 'POST',
      json: true,
      body: client,
      uri:'http://' + server.host + ':' + server.port + '/balsamiq/client/'
    }, function (err, res) {
      if (err) { reject(err); }
      else { resolve(server); }
    });
  });
}

BalsamiqClient.prototype.status = function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.write(JSON.stringify({
    rendering: this.rendering
  }));
  res.end();
}

BalsamiqClient.prototype.release = function(cb, res) {
  this.rendering = false;
  cb(res);
}

BalsamiqClient.prototype.render = function(req, res, next) {
  var self = this;
  if (this.rendering) {
    return Q.delay(random(50, 250)).then(this.render.bind(this, req, res));
  } else {
    this.rendering = true;
    return Q.promise(function(resolve, reject) {
      function error(err) { self.release(reject, err); }
      try {
        req.pipe(fs.createWriteStream(self.options.target))
           .on('error', error)
           .on('finish', function() {
              self.balsamiq.render(self.options.target, self.options.dest)
                .then(function() { 
                  fs.createReadStream(self.options.dest).pipe(res)
                    .on('error', error);
                })
                .then(self.release.bind(self, resolve))
                .fail(self.release.bind(self, reject));
           });
      } catch (err) {
        self.release(reject, err);
      }
    });
  }
}
