import merge from 'lodash.merge'
import pluralize from 'pluralize'
import { Schema, valuesOf } from 'normalizr'

class TransactionsSchema extends Schema {
  constructor (name, config) {
    // by default, all of our schemas are necessary with an id attribute,
    // that is a string type by default
    config = merge({
      defaults: {
        id: null
      },
      types: {
        id: 'string'
      }
    }, config)
    super(name, config)
    this._assignEntity = config.assignEntity || this.assignSchemaKeys
    this.types = config.types
    this.model = config.model
    // let s do a first define to init things
    this.define({})
  }
  getTypes () {
    return this.types
  }
  assignSchemaKeys (output, key, value, input) {
    // we then return the function that sets in each element of a collection or in singles
    // the key binding key, instead of the old one defined by normalizr by default
    // For the other keys, then just set them into the output
    if (this.singleSchemasByKey && this.singleSchemasByKey[key]) {
      output[`${key}Id`] = value
      // we delete the output[key] because it is under the shape like myFoo: <id>
      // which means no sense
      if (key in output) { delete output[key] }
    } else if (this.pluralSchemasByKey && this.pluralSchemasByKey[key]) {
      output[`${this.pluralSchemasByKey[key].singleName}Ids`] = Object.keys(value)
      // we delete the output[key] because it is under the shape like { theFaasById: {<id>:<id>, <id>:<id>}]
      // which means no sense
      if (key in output) { delete output[key] }
    } else {
      output[key] = value
    }
  }
  define (schemasByKey) {
    // check
    if (!schemasByKey) {
      console.warn('schemasByKey is not defined')
      return
    }
    // We create here an object that accumulates
    // what should be the key binding to the id / ids array
    // for each child schemas key
    this.singleSchemasByKey = {}
    this.pluralSchemasByKey = {}
    this.singleSchemasByIdKey = {}
    this.pluralSchemasByIdsKey = {}
    this.schemasByJoinKey = {}
    this.allJoins = []
    this.pluralNamesBySingleName = {}
    Object.keys(schemasByKey)
      .forEach(key => {
        const schema = schemasByKey[key]
        if (!schema) {
          console.warn(`did not find a proper schema for ${key} in ${this.pluralName}`)
          return
        }
        const name = schema.__proto__.constructor.transactionsName
        const lowerQuality = name.split('Schema')[0].toLowerCase()
        const setKey = `${lowerQuality}SchemasByKey`
        if (this[setKey]) {
          this[setKey][key] = schema
          let collectionName
          let singleName
          let joinKey
          if (lowerQuality === 'single') {
            singleName = key
            collectionName = pluralize(singleName, 2)
            joinKey = `${singleName}Id`
            this[`${lowerQuality}SchemasByIdKey`][joinKey] = schema
          } else {
            collectionName = key.slice(0, -4)
            singleName = pluralize(collectionName, 1)
            joinKey = `${singleName}Ids`
            this[`${lowerQuality}SchemasByIdsKey`][joinKey] = schema
          }
          this.schemasByJoinKey[joinKey] = schema
          this.pluralNamesBySingleName[singleName] = collectionName
        }
      })
    this.allJoins = Object.keys(this.schemasByJoinKey)
      .map(joinKey => { return { key: joinKey } })
    // we use the Schema entities api to create a schema
    // we just here remodel a bit the way of setting the name
    // of the key, inside the schema because we want to have
    // keys like thingsIds: [2,4,...] or thingId: 2 better than
    // things: [2,4,...] and thing: 3 which is type misleading
    this._assignEntity = this._assignEntity.bind(this)

    // Then we define the nested keys inside the schema as arrayOf of this
    // children schemas
    const valuesOfsByKey = {}
    Object.keys(this.pluralSchemasByKey)
      .forEach(key => {
        // get
        const pluralSchema = this.pluralSchemasByKey[key]
        // set it as valuesOf
        valuesOfsByKey[key] = valuesOf(pluralSchema)
        // set also in the default an empty array of the corresponds joined ids
        this._defaults[`${pluralSchema.singleName}Ids`] = []
      })
    Object.keys(this.singleSchemasByKey)
      .forEach(key => {
        // set also in the default an null id value
        this._defaults[`${key}Id`] = null
      })
    const defineObject = Object.assign(valuesOfsByKey, this.singleSchemasByKey)
    Schema.prototype.define.bind(this)(defineObject)
  }
}

export class SingleSchema extends TransactionsSchema {
  constructor (name, config) {
    super(name, config)
    this.pluralName = pluralize(name, 2)
    this.singleName = name
  }
  define (schemasByKey) {
    TransactionsSchema.prototype.define.bind(this)(schemasByKey)
  }
}

export class PluralSchema extends TransactionsSchema {
  constructor (name, config) {
    const pluralName = pluralize(name, 2)
    super(`${pluralName}ById`, config)
    this.pluralName = pluralName
    this.singleName = name
  }
  define (schemasByKey) {
    TransactionsSchema.prototype.define.bind(this)(schemasByKey)
  }
}

// force actaully these classes to have a 'long' name,
// because you cannot account to schema.__proto__.constructor.name
// to stay the same when you bundle and minify... it
// is going to have a name like t () function...
SingleSchema.transactionsName = 'SingleSchema'
PluralSchema.transactionsName = 'PluralSchema'
