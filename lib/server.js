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
    tilda = require('exec-promised').tilda,
    fs = require('fs'),
    path = require('path');
    
function BalsamiqServer(options) {
  this.options = _.extend({ clients: [], local:false }, options);
  this.__idx__ = 0;
  
  //configure registration end-points
  this.options.server.post('/balsamiq/client', this.register.bind(this));
  this.options.server.post('/balsamiq/client/', this.register.bind(this));
  
  if (this.options.local) {
    this.balsamiq = require('./balsamiq')(this.options.localExecutable);
    this.options.clients.push(this.balsamiq);
  }
}
module.exports = function(options) {
  return new BalsamiqServer(options);
};

BalsamiqServer.prototype.setTimeout = function(timeout) {
  if (this.balsamiq) {
    this.balsamiq.setTimeout(timeout);
  }
}

BalsamiqServer.prototype.register = function(req, res) {
  function done() {
    res.writeHead(200);
    res.end();
  }
  
  var self = this;
  if (res.body) {
    self.options.clients.push(JSON.parse(body));
    done();
  } else {
    var body = '';
    req.on('data', function(block) { body += block; });
    req.on('end', function() { 
      self.options.clients.push(JSON.parse(body)); 
      done();
    });
  }
}

BalsamiqServer.prototype.client = function() {
  var self = this;
  return Q.promise(function(resolve, reject) {
    if (! self.options.clients || self.options.clients.length === 0) {
      reject(new Error('No clients have registered with this server'));
    } else {
      self.__idx__ += 1;
      if (self.__idx__ === self.options.clients.length) {
        self.__idx__ = 0;
      }
      resolve(self.options.clients[self.__idx__]);
    }
  });
}

BalsamiqServer.prototype.render = function(bmml, jpg) {
  var self = this,
      request = this.options.request;
      
  return this.client().then(function(client) {
    if (!client.host || !client.port) {
      return client.render(bmml, jpg);
    }
    
    return Q.promise(function(resolve, reject) {
      function error(err) { reject(err); }
      try {
        fs.createReadStream(path.resolve(tilda(bmml)), {encoding: 'utf8'})
          .on('error', error)
          .pipe(request.post('http://' + client.host + ':' + client.port + '/balsamiq/render/'))
          .on('error', error)
          .pipe(fs.createWriteStream(path.resolve(tilda(jpg))))
          .on('error', error)
          .on('finish', function() { resolve(path.resolve(tilda(jpg))); });
      } catch (err) {
        reject(err);
      }
    });
  });
}
