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

var _normalizr = require('normalizr');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TransactionsSchema = function (_Schema) {
  _inherits(TransactionsSchema, _Schema);

  function TransactionsSchema(name, config) {
    _classCallCheck(this, TransactionsSchema);

    // by default, all of our schemas are necessary with an id attribute,
    // that is a string type by default
    config = (0, _lodash2.default)({
      defaults: {
        id: null
      },
      types: {
        id: 'string'
      }
    }, config);

    var _this = _possibleConstructorReturn(this, (TransactionsSchema.__proto__ || Object.getPrototypeOf(TransactionsSchema)).call(this, name, config));

    _this._assignEntity = config.assignEntity || _this.assignSchemaKeys;
    _this.types = config.types;
    _this.model = config.model;
    // let s do a first define to init things
    _this.define({});
    return _this;
  }

  _createClass(TransactionsSchema, [{
    key: 'getTypes',
    value: function getTypes() {
      return this.types;
    }
  }, {
    key: 'assignSchemaKeys',
    value: function assignSchemaKeys(output, key, value, input) {
      // we then return the function that sets in each element of a collection or in singles
      // the key binding key, instead of the old one defined by normalizr by default
      // For the other keys, then just set them into the output
      if (this.singleSchemasByKey && this.singleSchemasByKey[key]) {
        output[key + 'Id'] = value;
        // we delete the output[key] because it is under the shape like myFoo: <id>
        // which means no sense
        if (key in output) {
          delete output[key];
        }
      } else if (this.pluralSchemasByKey && this.pluralSchemasByKey[key]) {
        output[this.pluralSchemasByKey[key].singleName + 'Ids'] = Object.keys(value);
        // we delete the output[key] because it is under the shape like { theFaasById: {<id>:<id>, <id>:<id>}]
        // which means no sense
        if (key in output) {
          delete output[key];
        }
      } else {
        output[key] = value;
      }
    }
  }, {
    key: 'define',
    value: function define(schemasByKey) {
      var _this2 = this;

      // check
      if (!schemasByKey) {
        console.warn('schemasByKey is not defined');
        return;
      }
      // We create here an object that accumulates
      // what should be the key binding to the id / ids array
      // for each child schemas key
      this.singleSchemasByKey = {};
      this.pluralSchemasByKey = {};
      this.singleSchemasByIdKey = {};
      this.pluralSchemasByIdsKey = {};
      this.schemasByJoinKey = {};
      this.allJoins = [];
      this.pluralNamesBySingleName = {};
      Object.keys(schemasByKey).forEach(function (key) {
        var schema = schemasByKey[key];
        if (!schema) {
          console.warn('did not find a proper schema for ' + key + ' in ' + _this2.pluralName);
          return;
        }
        var name = schema.__proto__.constructor.transactionsName;
        var lowerQuality = name.split('Schema')[0].toLowerCase();
        var setKey = lowerQuality + 'SchemasByKey';
        if (_this2[setKey]) {
          _this2[setKey][key] = schema;
          var collectionName = void 0;
          var singleName = void 0;
          var joinKey = void 0;
          if (lowerQuality === 'single') {
            singleName = key;
            collectionName = (0, _pluralize2.default)(singleName, 2);
            joinKey = singleName + 'Id';
            _this2[lowerQuality + 'SchemasByIdKey'][joinKey] = schema;
          } else {
            collectionName = key.slice(0, -4);
            singleName = (0, _pluralize2.default)(collectionName, 1);
            joinKey = singleName + 'Ids';
            _this2[lowerQuality + 'SchemasByIdsKey'][joinKey] = schema;
          }
          _this2.schemasByJoinKey[joinKey] = schema;
          _this2.pluralNamesBySingleName[singleName] = collectionName;
        }
      });
      this.allJoins = Object.keys(this.schemasByJoinKey).map(function (joinKey) {
        return { key: joinKey };
      });
      // we use the Schema entities api to create a schema
      // we just here remodel a bit the way of setting the name
      // of the key, inside the schema because we want to have
      // keys like thingsIds: [2,4,...] or thingId: 2 better than
      // things: [2,4,...] and thing: 3 which is type misleading
      this._assignEntity = this._assignEntity.bind(this);

      // Then we define the nested keys inside the schema as arrayOf of this
      // children schemas
      var valuesOfsByKey = {};
      Object.keys(this.pluralSchemasByKey).forEach(function (key) {
        // get
        var pluralSchema = _this2.pluralSchemasByKey[key];
        // set it as valuesOf
        valuesOfsByKey[key] = (0, _normalizr.valuesOf)(pluralSchema);
        // set also in the default an empty array of the corresponds joined ids
        _this2._defaults[pluralSchema.singleName + 'Ids'] = [];
      });
      Object.keys(this.singleSchemasByKey).forEach(function (key) {
        // set also in the default an null id value
        _this2._defaults[key + 'Id'] = null;
      });
      var defineObject = Object.assign(valuesOfsByKey, this.singleSchemasByKey);
      _normalizr.Schema.prototype.define.bind(this)(defineObject);
    }
  }]);

  return TransactionsSchema;
}(_normalizr.Schema);

var SingleSchema = exports.SingleSchema = function (_TransactionsSchema) {
  _inherits(SingleSchema, _TransactionsSchema);

  function SingleSchema(name, config) {
    _classCallCheck(this, SingleSchema);

    var _this3 = _possibleConstructorReturn(this, (SingleSchema.__proto__ || Object.getPrototypeOf(SingleSchema)).call(this, name, config));

    _this3.pluralName = (0, _pluralize2.default)(name, 2);
    _this3.singleName = name;
    return _this3;
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

  function PluralSchema(name, config) {
    _classCallCheck(this, PluralSchema);

    var pluralName = (0, _pluralize2.default)(name, 2);

    var _this4 = _possibleConstructorReturn(this, (PluralSchema.__proto__ || Object.getPrototypeOf(PluralSchema)).call(this, pluralName + 'ById', config));

    _this4.pluralName = pluralName;
    _this4.singleName = name;
    return _this4;
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