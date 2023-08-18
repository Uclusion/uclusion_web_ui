import { Typography } from '@material-ui/core';
import React from 'react';

export default function DragImage(properties) {
  const { id, name } = properties;
  return (
    <div id={`dragImage${id}`} style={{display: 'block', minWidth: '10rem', width: '10rem',
      position: 'absolute', top: -10, right: -10, zIndex: 2}}>
      <Typography color='initial' variant="subtitle2">{name}</Typography>
    </div>
  );
}