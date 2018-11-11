import React from 'react'

import { v4 } from 'uuid'
// You are obviously not limited to material-ui, but we really enjoy
// the material-ui svg icons!
import CropSquare from '@material-ui/icons/CropSquare'

const EditorBorder = (props) => {
  const {children} = props
  console.log('Editor Border Plugin', props)
  return (
    <div style={{border: '1px solid black', padding: '16px'}}>
      {children}
    </div>
  )
}


export default ({defaultPlugin}) => {
  console.log('Inited editor plugin')
  return ({
    Component: EditorBorder,
    IconComponent: <CropSquare/>,
    name: 'layout/editor/border',
    version: '0.0.1',
    text: 'Editor border',
    createInitialChildren: () => ({
      id: v4(),
      rows: [
        {
          id: v4(),
          cells: [
            {
              content: {
                plugin: defaultPlugin,
                state: defaultPlugin.createInitialState()
              },
              id: v4()
            }
          ]
        }
      ]
    }),
    handleFocusNextHotKey: () => Promise.reject(),
    handleFocusPreviousHotKey: () => Promise.reject()
  })
}