import { fromJS,
  isImmutable
} from 'immutable'
import isEqual from 'lodash.isequal'
import merge from 'lodash.merge'
import mergeWith from 'lodash.mergewith'
import values from 'lodash.values'
import { normalize } from 'normalizr'
import pluralize from 'pluralize'

import { createDescription } from './description'
import { SingleSchema,
  PluralSchema
} from './schemas'

export function findMatchedCollectionName (collectionNames, pluralName) {
  return collectionNames.find(collectionName => {
    let matchedCollectionName = pluralName.slice(-collectionName.length)
    // we need to lower case the first letter
    // because it is supposed to be written in camelCase
    matchedCollectionName = matchedCollectionName[0].toLowerCase() + matchedCollectionName.slice(1)
    return matchedCollectionName === collectionName
  })
}

export function createDefinition (description = {}) {
  if (!description.models) {
    return
  }
  const _description = description.isSet
  ? description
  : createDescription(description)
  const models = _description.models
  // We first do a loop to create all the collection Schema
  const collectionNames = []
  const singleSchemasByCollectionName = {}
  const pluralSchemasByCollectionName = {}
  models.forEach(model => {
    const { collectionName,
      entityName,
      isAllJoins,
      items
    } = model
    const types = {}
    collectionNames.push(collectionName)
    const pluralSchemaKey = `${collectionName}ById`
    // set the types
    items && items.forEach(({ key, type }) => {
      types[key] = type
    })
    // single Schema
    const singleSchema = new SingleSchema(entityName, {
      model,
      types
    })
    singleSchemasByCollectionName[collectionName] = singleSchema
    // plural Schema
    const pluralSchema = new PluralSchema(entityName, {
      model,
      types
    })
    pluralSchemasByCollectionName[collectionName] = pluralSchema
  })
  // then we do a second loop to determine which are the child schemas
  Object.keys(pluralSchemasByCollectionName)
    .forEach(collectionName => {
      const singleSchema = singleSchemasByCollectionName[collectionName]
      const pluralSchema = pluralSchemasByCollectionName[collectionName]
      const { isAllJoins } = pluralSchema
      const subDefinition = {}
      Object.keys(pluralSchema.types)
        .forEach(key => {
          const type = pluralSchema.types[key]
          let matchedCollectionName, matchedEntityName, pluralName, singleName
          if (/w*Ids\b/.test(key)) {
            pluralName = pluralize(key.slice(0, -3), 2)
            const pluralTypeMatch = type.match(/Array\[String-(.*)\]/)
            if (pluralTypeMatch && pluralTypeMatch[1]) {
              matchedEntityName = pluralTypeMatch[1][0].toLowerCase() + pluralTypeMatch[1].slice(1)
              matchedCollectionName = pluralize(matchedEntityName, 2)
            } else if (isAllJoins) {
              matchedCollectionName = findMatchedCollectionName(collectionNames, pluralName)
            }
            if (matchedCollectionName) {
              subDefinition[`${pluralName}ById`] = pluralSchemasByCollectionName[matchedCollectionName]
            }
          } else if (/w*Id\b/.test(key)) {
            singleName = key.slice(0, -2)
            pluralName = pluralize(singleName, 2)
            const singleTypeMatch = type.match(/String-(.*)/)
            if (singleTypeMatch && singleTypeMatch[1]) {
              matchedEntityName = singleTypeMatch[1][0].toLowerCase() + singleTypeMatch[1].slice(1)
              matchedCollectionName = pluralize(matchedEntityName, 2)
            } else if (isAllJoins) {
              matchedCollectionName = findMatchedCollectionName(collectionNames, pluralName)
            }
            if (matchedCollectionName) {
              subDefinition[singleName] = singleSchemasByCollectionName[matchedCollectionName]
            }
          }
        })
      pluralSchema.define(subDefinition)
      singleSchema.define(subDefinition)
    })
  // define the total app Schema
  const definition = {}
  Object.keys(pluralSchemasByCollectionName)
    .map((collectionName, index) => {
      const pluralSchema = pluralSchemasByCollectionName[collectionName]
      definition[`${collectionName}ById`] = pluralSchema
    })
  // redo a loop for deep join option
  Object.keys(definition)
    .forEach(collectionKey => {
      const schema = definition[collectionKey]
      const { model: { items },
        schemasByJoinKey
      } = schema
      items && items.forEach(item => {
        const { isAllDeepJoins,
          key
        } = item
        if (isAllDeepJoins) {
          const schema = schemasByJoinKey[key]
          if (schema) {
            item.joins = schema.allJoins
          }
        }
      })
    })
  // return
  return definition
}
