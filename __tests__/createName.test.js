// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

import { convertDescription } from '../src/utils/stringFunctions'

it.each([["<p>Try for name. And then some.</p>", "Try for name.", "<p>...And then some.</p>"],
  ["<p>Try for name. <b>And</b> then some.</p>", "Try for name.", "<p>...And then some.</p>"],
  ["<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p>",
    "Try for name and then something really, really long to see how splits when...",
    "<p>...beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p>", "Try for name.", "<p>...And then some.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p><h2>What else?</h2>", "Try for name.",
    "<p>...And then some.</p><h2>What else?</h2>"],
  ["<h1>Try for <i>name</i>. <b>And</b> then some.</h1><p>What else?</p>", "Try for name.",
    "<h1>...And then some.</h1><p>What else?</p>"],
  ["<h1>Try for <i>name</i></h1><p>What else?</p>", "Try for name",
    "<p>What else?</p>"],
  ["<p>See if short code fixed.</p>", "See if short code fixed.", ""]])
('%p', (testDescription, expectedName, expectedDescription) => {
  const { name, description } = convertDescription(testDescription);
  expect(name).toBe(expectedName);
  expect(description).toBe(expectedDescription);
});