// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

import { convertDescription } from '../src/utils/stringFunctions'

it.each([["<p>Try for name. And then some.</p>", "Try for name.", "<p>...And then some.</p>"],
  ["<p>Try for name. <b>And</b> then some.</p>", "Try for name.", "<p>...<b>And</b> then some.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p>", "Try for name.", "<p>...<b>And</b> then some.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p><h>What else?</h>", "Try for name.",
    "<p>...<b>And</b> then some.</p><h>What else?</h>"],
  ["<h>Try for <i>name</i>. <b>And</b> then some.</h><p>What else?</p>", "Try for name.",
    "<h>...<b>And</b> then some.</h><p>What else?</p>"],
  ["<h>Try for <i>name</i></h><p>What else?</p>", "Try for name",
    "<p>What else?</p>"]])
('%p', (testDescription, expectedName, expectedDescription) => {
  const { name, description } = convertDescription(testDescription, 250);
  expect(name).toBe(expectedName);
  expect(description).toBe(expectedDescription);
});