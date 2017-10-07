'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAppSchema = createAppSchema;

var _definition = require('./definition');

var _description2 = require('./description');

var _schemas = require('./schemas');

function createAppSchema(description) {
  var _description = description.isSet ? description : (0, _description2.createDescription)(description);
  var definition = (0, _definition.createDefinition)(_description);
  var appSchema = new _schemas.SingleSchema('app');
  appSchema.define(definition);
  return appSchema;
}