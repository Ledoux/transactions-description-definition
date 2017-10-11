'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluralSchema = exports.SingleSchema = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TransactionsSchema = function () {
  function TransactionsSchema(entityName, config) {
    _classCallCheck(this, TransactionsSchema);

    // by default, all of our schemas are necessary with an id attribute,
    // that is a string type by default
    config = (0, _lodash2.default)({
      defaults: {
        id: null
      },
      model: {
        items: []
      },
      types: {
        id: 'string'
      }
    }, config);
    // bind
    this.defaults = config.defaults;
    this.model = config.model;
    this.types = config.types;
  }

  _createClass(TransactionsSchema, [{
    key: 'getDefaults',
    value: function getDefaults() {
      return this.defaults;
    }
  }, {
    key: 'define',
    value: function define(schemasByKey) {
      var _this = this;

      // check
      if (!schemasByKey) {
        console.warn('schemasByKey is not defined');
        return;
      }
      var items = this.model.items;
      // We create here an object that accumulates
      // what should be the key binding to the id / ids array
      // for each child schemas key

      this.allJoins = [];
      this.itemsByKey = {};
      this.pluralSchemasByKey = {};
      this.pluralNamesBySingleName = {};
      this.pluralSchemasByIdsKey = {};
      this.schemasByJoinKey = {};
      this.singleNamesByPluralName = {};
      this.singleSchemasByKey = {};
      this.singleSchemasByIdKey = {};
      Object.keys(schemasByKey).forEach(function (key) {
        // unpack and check
        var schema = schemasByKey[key];
        if (!schema) {
          console.warn('did not find a proper schema for ' + key + ' in ' + _this.pluralName);
          return;
        }
        // schemas
        var name = schema.__proto__.constructor.transactionsName;
        var lowerQuality = name.split('Schema')[0].toLowerCase();
        var setKey = lowerQuality + 'SchemasByKey';
        if (_this[setKey]) {
          _this[setKey][key] = schema;
          var pluralName = void 0;
          var singleName = void 0;
          var joinKey = void 0;
          if (lowerQuality === 'single') {
            singleName = key;
            pluralName = (0, _pluralize2.default)(singleName, 2);
            joinKey = singleName + 'Id';
            _this[lowerQuality + 'SchemasByIdKey'][joinKey] = schema;
          } else {
            pluralName = key.slice(0, -4);
            singleName = (0, _pluralize2.default)(pluralName, 1);
            joinKey = singleName + 'Ids';
            _this[lowerQuality + 'SchemasByIdsKey'][joinKey] = schema;
          }
          _this.itemsByKey[key] = items && items.find(function (item) {
            return item.key === joinKey;
          });
          _this.schemasByJoinKey[joinKey] = schema;
          _this.pluralNamesBySingleName[singleName] = pluralName;
          _this.singleNamesByPluralName[pluralName] = singleName;
        }
      });
      this.allJoins = Object.keys(this.schemasByJoinKey).map(function (joinKey) {
        return { key: joinKey };
      });

      // default values for joined schemas
      Object.keys(this.pluralSchemasByKey).forEach(function (key) {
        var pluralName = key.slice(0, -4);
        var singleName = _this.singleNamesByPluralName[pluralName];
        _this.defaults[singleName + 'Ids'] = [];
      });
      Object.keys(this.singleSchemasByKey).forEach(function (key) {
        _this.defaults[key + 'Id'] = null;
      });
    }
  }]);

  return TransactionsSchema;
}();

var SingleSchema = exports.SingleSchema = function (_TransactionsSchema) {
  _inherits(SingleSchema, _TransactionsSchema);

  function SingleSchema(entityName, config) {
    _classCallCheck(this, SingleSchema);

    var _this2 = _possibleConstructorReturn(this, (SingleSchema.__proto__ || Object.getPrototypeOf(SingleSchema)).call(this, entityName, config));

    _this2.collectionName = (0, _pluralize2.default)(entityName, 2);
    _this2.entityName = entityName;
    return _this2;
  }

  _createClass(SingleSchema, [{
    key: 'define',
    value: function define(schemasByKey) {
      TransactionsSchema.prototype.define.bind(this)(schemasByKey);
    }
  }]);

  return SingleSchema;
}(TransactionsSchema);

var PluralSchema = exports.PluralSchema = function (_TransactionsSchema2) {
  _inherits(PluralSchema, _TransactionsSchema2);

  function PluralSchema(entityName, config) {
    _classCallCheck(this, PluralSchema);

    var collectionName = (0, _pluralize2.default)(entityName, 2);

    var _this3 = _possibleConstructorReturn(this, (PluralSchema.__proto__ || Object.getPrototypeOf(PluralSchema)).call(this, entityName, config));

    _this3.collectionName = collectionName;
    _this3.entityName = entityName;
    return _this3;
  }

  _createClass(PluralSchema, [{
    key: 'define',
    value: function define(schemasByKey) {
      TransactionsSchema.prototype.define.bind(this)(schemasByKey);
    }
  }]);

  return PluralSchema;
}(TransactionsSchema);

// force actaully these classes to have a 'long' name,
// because you cannot account to schema.__proto__.constructor.name
// to stay the same when you bundle and minify... it
// is going to have a name like t () function...


SingleSchema.transactionsName = 'SingleSchema';
PluralSchema.transactionsName = 'PluralSchema';