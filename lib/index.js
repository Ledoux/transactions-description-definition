'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _definition = require('./definition');

Object.keys(_definition).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _definition[key];
    }
  });
});

var _description = require('./description');

Object.keys(_description).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _description[key];
    }
  });
});

var _schemas = require('./schemas');

Object.keys(_schemas).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _schemas[key];
    }
  });
});