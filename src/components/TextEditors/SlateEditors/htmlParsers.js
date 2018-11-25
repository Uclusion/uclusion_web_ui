const BLOCK_TAGS = {
  'blockquote' : 'block-quote',
  'ul' : 'bulleted-list',
  'h1' : 'heading-one',
  'h2' : 'heading-two',
  'li' : 'list-item',
  'ol' : 'numbered-list',
  'image' : 'image',
  'p' : 'paragraph'
}

export const parseBlocks = (el, next) => {
  const type = BLOCK_TAGS[el.tagName.toLowerCase()]
  if(type){
    return {
      object: 'block',
      type: type,
      data: {
        className: el.getAttribute('class'),
        src: el.getAttribute('src')
      },
      nodes: next(el.childNodes)
    }
  }
}

const MARK_TAGS = {
  'strong' : 'bold',
  'code' : 'code',
  'em' : 'italic',
  'u' : 'underlined'
}

export const parseMarks = (el, next) => {
  const type = MARK_TAGS[el.tagName.toLowerCase()]
  if(type){
    return {
      object: 'mark',
      type: type,
      nodes: next(el.childNodes)
    }
  }
}
