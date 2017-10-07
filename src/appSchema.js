import { createDefinition } from './definition'
import { createDescription } from './description'
import { SingleSchema } from './schemas'

export function createAppSchema (description) {
  const _description = description.isSet
  ? description
  : createDescription(description)
  const definition = createDefinition(_description)
  const appSchema = new SingleSchema('app')
  appSchema.define(definition)
  return appSchema
}
