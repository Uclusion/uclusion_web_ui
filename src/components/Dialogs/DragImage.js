import { Typography } from '@material-ui/core';
import React from 'react';

export default function DragImage(properties) {
  const { id, name } = properties;
  const useName = name?.substring(0, 100);
  return (
    <div id={`dragImage${id}`} key={`dragImage${id}`} style={{display: 'block', minWidth: '10rem', width: '10rem',
      position: 'absolute', top: -50, right: -10, zIndex: 2}}>
      <Typography color='initial' variant="caption">{useName}</Typography>
    </div>
  );
}