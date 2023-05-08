// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

import { convertDescription } from '../src/utils/stringFunctions'

it.each([["<p>Try for name. And then some.</p>", "Try for name.", "<p>And then some.</p>"],
  ["<p>Once your free trial expires you will lose access to creating new workspaces, groups, and inviting further collaborators. Your existing collaborations will continue to work.</p>",
  "Once your free trial expires you will lose access to creating new workspaces,...", "<p>...groups, and inviting further collaborators. Your existing collaborations will continue to work.</p>"],
  ["<p>Try for name. <b>And</b> then some.</p>", "Try for name.", "<p>And then some.</p>"],
  ["<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p>",
    "Try for name and then something really, really long to see how splits when...",
    "<p>...beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p>"],
  ["<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p><p> Plus now tempt with second sentence.</p>",
    "Try for name and then something really, really long to see how splits when...",
    "<p>...beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p><p> Plus now tempt with second sentence.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p>", "Try for name.", "<p>And then some.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p><h2>What else?</h2>", "Try for name.",
    "<p>And then some.</p><h2>What else?</h2>"],
  ["<h1>Try for <i>name</i>. <b>And</b> then some.</h1><p>What else?</p>", "Try for name.",
    "<h1>And then some.</h1><p>What else?</p>"],
  ["<h1>Try for <i>name</i></h1><p>What else?</p>", "Try for name",
    "<p>What else?</p>"],
  ["<p>See if short code fixed.</p>", "See if short code fixed.", ""],
  ["<p><img src=\"https://dev.imagecdn.uclusion.com/5250067a-5553-4b52-8233-bb7b019b7a97/5e77cc70-fdc1-4c87-97a7-8d91a6f57a98.png\"></p><p>Start with an image.</p>", "Start with an image.", "<p><img src=\"https://dev.imagecdn.uclusion.com/5250067a-5553-4b52-8233-bb7b019b7a97/5e77cc70-fdc1-4c87-97a7-8d91a6f57a98.png\"></p>"]])
('%p', (testDescription, expectedName, expectedDescription) => {
  const { name, description } = convertDescription(testDescription);
  expect(name).toBe(expectedName);
  expect(description).toBe(expectedDescription);
});