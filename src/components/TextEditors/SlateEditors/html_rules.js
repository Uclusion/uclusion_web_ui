import { renderBlocks, renderMarks } from './htmlRenderers'
import { parseBlocks, parseMarks } from './htmlParsers'

/**
 * These are the rules for the HTML serializer and deserializer
 * @type {Array}
 */
export const rules = [
  //the rules for blocks
  {
    deserialize: (el, next) => {
      return parseBlocks(el, next)
    },

    serialize: (obj, children) => {
      return renderBlocks(obj, children)
    }
  },
  // the rules for marks
  {
    deserialize: (el, next) => {
      return parseMarks(el, next)
    },

    serialize: (obj, children) => {
      return renderMarks(obj, children)
    }
  }
]