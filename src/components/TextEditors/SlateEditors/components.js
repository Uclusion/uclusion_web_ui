/**
 * Shamelessly cribbed from https://github.com/ianstormtaylor/slate, Portions Copyright Uclusion Inc, 2018-Present. All rights reserved for Uclusion portions.
 * License for slate code as presented in slate's ;=license.md reproduced here
 *

 The MIT License

 Copyright © 2016–2017, Ian Storm Taylor

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

import React from 'react';
import styled from '@emotion/styled';

export const Button = styled('span')`
  cursor: pointer;
  color: ${props =>
  props.reversed
    ? props.active ? 'white' : '#aaa'
    : props.active ? 'blue' : '#00cccc'};
`

export const Icon = styled(({ className, ...rest }) => {
  return <span className={`material-icons ${className}`} {...rest} />
})`
  font-size: 18px;
  vertical-align: text-bottom;
`

export const Menu = styled('div')`
  & > * {
    display: inline-block;
  }

  & > * + * {
    margin-left: 8px;
  }
`

export const Toolbar = styled(Menu)`
  width: 100%;
  position: relative;
  padding-bottom: 8px;
  border-bottom: 1px solid #ccc;
`

/**
 * A styled image block component.
 *
 * @type {Component}
 */

export const Image = styled('img')`
  display: block;
  max-width: 100%;
  max-height: 20em;
  box-shadow: ${props => (props.selected ? '0 0 0 2px blue;' : 'none')};
`