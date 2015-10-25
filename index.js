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
    exec = require('exec-promised'),
    path = require('path'),
    fs = require('fs');
    
function checkExe(_path, file) {
  try {
    var _file = path.resolve(path.join(_path, file));
    fs.statSync(_file);
    return _file;
  } catch (e) {
    return false;
  }
}

function checkPaths(paths) {
  var exe;
  for (var i in paths) {
    if ((exe = checkExe(paths[i], 'Balsamiq Mockups'))) { return exe; }
    if ((exe = checkExe(paths[i], 'Balsamiq Mockups.exe'))) { return exe; }
  }
}
  
function Balsamiq(executable) {
 this.rendering = false;
 if (executable) {
    this.exe = executable;
  } else {
    this.exe = checkPaths([
      path.join('/', 'applications', 'Balsamiq Mockups.app', 'Contents', 'MacOS'),
      path.join('/', 'Program Files (x86)', 'Balsamiq Mockups')
    ]);
  }
}
module.exports = function(executable) { return new Balsamiq(executable); }

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Balsamiq.prototype.release = function(cb, res) {
  this.rendering = false;
  cb(res);
}

function stat(file) {
  try {
    var _file = path.resolve(file);
    fs.statSync(_file);
    return _file;
  } catch (e) {
    return false;
  }
}

Balsamiq.prototype.render = function(bmml, jpg) {
  var self = this;
  if (self.rendering) {
    return Q.delay(random(50, 250)).then(this.render.bind(this, bmml, jpg));
  } else {
    this.rendering = true;
    return Q.promise(function(resolve, reject, notify) {
      exec([self.exe, 'export', bmml, jpg])
        .timeout(20000, {msg:'Render took longer than 20 seconds.'})
        .then(function() {
          var _jpg = stat(jpg);
          if (_jpg) { 
            return _jpg; 
          } else {
            throw {
              err: 'Failed to render ' + jpg,
              bmml: bmml,
              jpg: jpg
            };
          }
        })
        .then(self.release.bind(self, resolve))
        .fail(self.release.bind(self, reject));
    });
  }
}
