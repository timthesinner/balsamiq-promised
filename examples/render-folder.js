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
 
//Polyfill to add endsWith to String
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}
 
var Q = require('q'),
    _ = require('underscore'),
    path = require('path'),
    fs = require('fs');
    
var balsamiq = require('../index')();

var readdir = Q.denodeify(fs.readdir),
    folder = path.resolve(process.argv[2]);

readdir(folder).then(function(files) {
  var bmmls = _.compact(_.map(files, function(bmml) { 
    if(bmml.endsWith('.bmml')) {
      return path.join(folder, bmml);
    }
  }));
  
  console.log('Rendering the following mocks\n', bmmls);
  
  return Q.all(_.map(bmmls, function(bmml) {
    return balsamiq.render(bmml, path.resolve(path.join('./', '__data__', path.basename(bmml).replace('.bmml', '.png'))))
            .then(function(jpg) {
              console.log('Rendered:', jpg);
            });
  }));
}).fail(function(err) {
  throw err;
}).done(function() {
  console.log('Finished');
});
