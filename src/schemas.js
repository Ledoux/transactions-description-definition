import merge from 'lodash.merge'
import pluralize from 'pluralize'

class TransactionsSchema {
  constructor (entityName, config) {
    // by default, all of our schemas are necessary with an id attribute,
    // that is a string type by default
    config = merge({
      defaults: {
        id: null
      },
      model: {
        items: []
      },
      types: {
        id: 'string'
      }
    }, config)
    // bind
    this.defaults = config.defaults
    this.model = config.model
    this.types = config.types
  }
  getDefaults () {
    return this.defaults
  }
  define (schemasByKey) {
    // check
    if (!schemasByKey) {
      console.warn('schemasByKey is not defined')
      return
    }
    const { items } = this.model
    // We create here an object that accumulates
    // what should be the key binding to the id / ids array
    // for each child schemas key
    this.allJoins = []
    this.itemsByKey = {}
    this.pluralSchemasByKey = {}
    this.pluralNamesBySingleName = {}
    this.pluralSchemasByIdsKey = {}
    this.schemasByJoinKey = {}
    this.singleNamesByPluralName = {}
    this.singleSchemasByKey = {}
    this.singleSchemasByIdKey = {}
    Object.keys(schemasByKey)
      .forEach(key => {
        // unpack and check
        const schema = schemasByKey[key]
        if (!schema) {
          console.warn(`did not find a proper schema for ${key} in ${this.pluralName}`)
          return
        }
        // schemas
        const name = schema.__proto__.constructor.transactionsName
        const lowerQuality = name.split('Schema')[0].toLowerCase()
        const setKey = `${lowerQuality}SchemasByKey`
        if (this[setKey]) {
          this[setKey][key] = schema
          let pluralName
          let singleName
          let joinKey
          if (lowerQuality === 'single') {
            singleName = key
            pluralName = pluralize(singleName, 2)
            joinKey = `${singleName}Id`
            this[`${lowerQuality}SchemasByIdKey`][joinKey] = schema
          } else {
            pluralName = key.slice(0, -4)
            singleName = pluralize(pluralName, 1)
            joinKey = `${singleName}Ids`
            this[`${lowerQuality}SchemasByIdsKey`][joinKey] = schema
          }
          this.itemsByKey[key] = items && items.find(item =>
            item.key === joinKey)
          this.schemasByJoinKey[joinKey] = schema
          this.pluralNamesBySingleName[singleName] = pluralName
          this.singleNamesByPluralName[pluralName] = singleName
        }
      })
    this.allJoins = Object.keys(this.schemasByJoinKey)
      .map(joinKey => { return { key: joinKey } })

    // default values for joined schemas
    Object.keys(this.pluralSchemasByKey)
      .forEach(key => {
        const pluralName = key.slice(0, -4)
        const singleName = this.singleNamesByPluralName[pluralName]
        this.defaults[`${singleName}Ids`] = []
      })
    Object.keys(this.singleSchemasByKey)
      .forEach(key => {
        this.defaults[`${key}Id`] = null
      })
  }
}

export class SingleSchema extends TransactionsSchema {
  constructor (entityName, config) {
    super(entityName, config)
    this.collectionName = pluralize(entityName, 2)
    this.entityName = entityName
  }
  define (schemasByKey) {
    TransactionsSchema.prototype.define.bind(this)(schemasByKey)
  }
}

export class PluralSchema extends TransactionsSchema {
  constructor (entityName, config) {
    const collectionName = pluralize(entityName, 2)
    super(entityName, config)
    this.collectionName = collectionName
    this.entityName = entityName
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
