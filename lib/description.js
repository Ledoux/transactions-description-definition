'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDescription = undefined;

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createDescription = exports.createDescription = function createDescription(config) {
  // check
  if (!config) {
    return;
  }
  var isAllDeepJoins = config.isAllDeepJoins,
      isAllJoins = config.isAllJoins;
  // clone config

  var description = Object.assign({}, config);
  // check
  if (!description.models) {
    console.warn('Your description has no models !');
  }
  // complete
  description.models && description.models.forEach(function (model) {
    if (!model.entityName) {
      model.entityName = (0, _pluralize2.default)(model.collectionName, 1);
    }
    // special default join configuration
    model.items.forEach(function (item) {
      if (/w*Id\b/.test(item.key) || /w*Ids\b/.test(item.key)) {
        item.isAllJoins = isAllJoins;
        item.isAllDeepJoins = isAllDeepJoins;
      }
    });
  });
  // set
  description.isSet = true;
  // return
  return description;
};