'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findMatchedCollectionName = findMatchedCollectionName;
exports.createDefinition = createDefinition;

var _immutable = require('immutable');

var _lodash = require('lodash.isequal');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.merge');

var _lodash4 = _interopRequireDefault(_lodash3);

var _lodash5 = require('lodash.mergewith');

var _lodash6 = _interopRequireDefault(_lodash5);

var _lodash7 = require('lodash.values');

var _lodash8 = _interopRequireDefault(_lodash7);

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _description2 = require('./description');

var _schemas = require('./schemas');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findMatchedCollectionName(collectionNames, pluralName) {
  return collectionNames.find(function (collectionName) {
    var matchedCollectionName = pluralName.slice(-collectionName.length);
    // we need to lower case the first letter
    // because it is supposed to be written in camelCase
    matchedCollectionName = matchedCollectionName[0].toLowerCase() + matchedCollectionName.slice(1);
    return matchedCollectionName === collectionName;
  });
}

function createDefinition() {
  var description = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!description.models) {
    return;
  }
  var _description = description.isSet ? description : (0, _description2.createDescription)(description);
  var models = _description.models;
  // We first do a loop to create all the collection Schema
  var collectionNames = [];
  var singleSchemasByCollectionName = {};
  var pluralSchemasByCollectionName = {};
  models.forEach(function (model) {
    var collectionName = model.collectionName,
        entityName = model.entityName,
        isAllJoins = model.isAllJoins,
        items = model.items;

    var types = {};
    collectionNames.push(collectionName);
    var pluralSchemaKey = collectionName + 'ById';
    // set the types
    items && items.forEach(function (_ref) {
      var key = _ref.key,
          type = _ref.type;

      types[key] = type;
    });
    // single Schema
    var singleSchema = new _schemas.SingleSchema(entityName, { model: model,
      types: types
    });
    singleSchemasByCollectionName[collectionName] = singleSchema;
    // plural Schema
    var pluralSchema = new _schemas.PluralSchema(entityName, { model: model,
      types: types
    });
    pluralSchemasByCollectionName[collectionName] = pluralSchema;
  });
  // then we do a second loop to determine which are the child schemas
  Object.keys(pluralSchemasByCollectionName).forEach(function (collectionName) {
    var singleSchema = singleSchemasByCollectionName[collectionName];
    var pluralSchema = pluralSchemasByCollectionName[collectionName];
    var isAllJoins = pluralSchema.isAllJoins;

    var subDefinition = {};
    Object.keys(pluralSchema.types).forEach(function (key) {
      var type = pluralSchema.types[key];
      var matchedCollectionName = void 0,
          matchedEntityName = void 0,
          pluralName = void 0,
          singleName = void 0;
      if (/w*Ids\b/.test(key)) {
        pluralName = (0, _pluralize2.default)(key.slice(0, -3), 2);
        var pluralTypeMatch = type.match(/Array\[String-(.*)\]/);
        if (pluralTypeMatch && pluralTypeMatch[1]) {
          matchedEntityName = pluralTypeMatch[1][0].toLowerCase() + pluralTypeMatch[1].slice(1);
          matchedCollectionName = (0, _pluralize2.default)(matchedEntityName, 2);
        } else if (isAllJoins) {
          matchedCollectionName = findMatchedCollectionName(collectionNames, pluralName);
        }
        if (matchedCollectionName) {
          subDefinition[pluralName + 'ById'] = pluralSchemasByCollectionName[matchedCollectionName];
        }
      } else if (/w*Id\b/.test(key)) {
        singleName = key.slice(0, -2);
        pluralName = (0, _pluralize2.default)(singleName, 2);
        var singleTypeMatch = type.match(/String-(.*)/);
        if (singleTypeMatch && singleTypeMatch[1]) {
          matchedEntityName = singleTypeMatch[1][0].toLowerCase() + singleTypeMatch[1].slice(1);
          matchedCollectionName = (0, _pluralize2.default)(matchedEntityName, 2);
        } else if (isAllJoins) {
          matchedCollectionName = findMatchedCollectionName(collectionNames, pluralName);
        }
        if (matchedCollectionName) {
          subDefinition[singleName] = singleSchemasByCollectionName[matchedCollectionName];
        }
      }
    });
    pluralSchema.define(subDefinition);
    singleSchema.define(subDefinition);
  });
  // define the total app Schema
  var definition = {};
  Object.keys(pluralSchemasByCollectionName).map(function (collectionName, index) {
    var pluralSchema = pluralSchemasByCollectionName[collectionName];
    definition[collectionName + 'ById'] = pluralSchema;
  });
  // redo a loop for deep join option
  Object.keys(definition).forEach(function (collectionKey) {
    var schema = definition[collectionKey];
    var items = schema.model.items,
        schemasByJoinKey = schema.schemasByJoinKey;

    items && items.forEach(function (item) {
      var isAllDeepJoins = item.isAllDeepJoins,
          key = item.key;

      if (isAllDeepJoins) {
        var _schema = schemasByJoinKey[key];
        if (_schema) {
          item.joins = _schema.allJoins;
        }
      }
    });
  });
  // return
  return definition;
}