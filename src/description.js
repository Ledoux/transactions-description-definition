import pluralize from 'pluralize'

export const createDescription = config => {
  // check
  if (!config) {
    return
  }
  const { isAllDeepJoins,
    isAllJoins
  } = config
  // clone config
  const description = Object.assign({}, config)
  // check
  if (!description.models) {
    console.warn('Your description has no models !')
  }
  // complete
  description.models && description.models.forEach(model => {
    if (!model.entityName) {
      model.entityName = pluralize(model.collectionName, 1)
    }
    // special default join configuration
    model.items.forEach(item => {
      if (/w*Id\b/.test(item.key) || /w*Ids\b/.test(item.key) ) {
        item.isAllJoins = isAllJoins
        item.isAllDeepJoins = isAllDeepJoins
      }
    })
  })
  // set
  description.isSet = true
  // return
  return description
}
