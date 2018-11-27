import React from 'react'
import { Image } from './components'

export const renderBlocks = (node, children) => {
  if (node.object === 'block') {
    switch (node.type) {
      case 'paragraph':
        return <p>{children}</p>
      case 'block-quote':
        return <blockquote>{children}</blockquote>
      case 'bulleted-list':
        return <ul>{children}</ul>
      case 'heading-one':
        return <h1>{children}</h1>
      case 'heading-two':
        return <h2>{children}</h2>
      case 'list-item':
        return <li>{children}</li>
      case 'numbered-list':
        return <ol>{children}</ol>
      case 'image': {
        const src = node.data.get('src')
        return <Image src={src}/>
      }
      default:
        return undefined
    }
  }
}

export const renderMarks = (node, children) => {
  if (node.object === 'mark') {
    switch (node.type) {
      case 'bold':
        return <strong>{children}</strong>
      case 'code':
        return <code>{children}</code>
      case 'italic':
        return <em>{children}</em>
      case 'underlined':
        return <u>{children}</u>
      default:
        return undefined
    }
  }
}

export const renderInlines = (node, children) => {
  if (node.object === 'inline') {
    switch (node.type) {
      case 'link': {
        const href = node.data.get('href')
        return <a href={href}>{children}</a>
      }
      default:
        return undefined
    }
  }
}
