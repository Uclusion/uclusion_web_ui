import React from 'react';

export function scrollToCommentAddBox() {
  const box = document.getElementById('cabox');
  if (box) {
    box.scrollIntoView();
  }
}