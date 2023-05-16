// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

import { convertDescription } from '../src/utils/stringFunctions'

it.each([["<p>Try for name. And then some.</p>", "Try for name. And then some.", ""],
  ["<p>Once your free trial expires you will lose access to creating new workspaces, groups, and inviting further collaborators. Your existing collaborations will continue to work.</p>",
  "Once your free trial expires you will lose access to creating new workspaces,...", "<p>...groups, and inviting further collaborators. Your existing collaborations will continue to work.</p>"],
  ["<p>Free trial ends and we disable creating new workspaces, groups, and <b>viewing your inbox</b>. After all everything still works without an inbox.</p>",
    "Free trial ends and we disable creating new workspaces, groups, and viewing...", "<p>Free trial ends and we disable creating new workspaces, groups, and <b>viewing your inbox</b>. After all everything still works without an inbox.</p>"],
  ["<p>Try for name. <b>And</b> then some.</p>", "Try for name. And then some.", "<p>Try for name. <b>And</b> then some.</p>"],
  ["<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p>",
    "Try for name and then something really, really long to see how splits when...",
    "<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p>"],
  ["<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p><p> Plus now tempt with second sentence.</p>",
    "Try for name and then something really, really long to see how splits when...",
    "<p>Try for name <b>and</b> then something really, really long to see how splits when beyond eighty characters and again something really, really long to see how splits when beyond eighty characters and even more something really, really long to see how splits when beyond eighty characters.</p><p> Plus now tempt with second sentence.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p>", "Try for name. And then some.", "<p>Try for <i>name</i>. <b>And</b> then some.</p>"],
  ["<p>Try for <i>name</i>. <b>And</b> then some.</p><h2>What else?</h2>", "What else?",
    "<p>Try for <i>name</i>. <b>And</b> then some.</p><h2>What else?</h2>"],
  ["<h1>Try for <i>name</i>. <b>And</b> then some.</h1><p>What else?</p>", "Try for name. And then some.",
    "<h1>Try for <i>name</i>. <b>And</b> then some.</h1><p>What else?</p>"],
  ["<p>We should extend praise points to everything. The progress report will then be in Uclusion so it can get praise but more subtlety no one will answer your suggestion or question outside of Uclusion cause you can't earn praise points.</p>",
    "We should extend praise points to everything.",
    "<p>The progress report will then be in Uclusion so it can get praise but more subtlety no one will answer your suggestion or question outside of Uclusion cause you can't earn praise points.</p>"],
  ["<h1>Try for <i>name</i></h1><p>What else?</p>", "Try for name", "<h1>Try for <i>name</i></h1><p>What else?</p>"],
  ["<p><img src=\"https://dev.imagecdn.uclusion.com/5250067a-5553-4b52-8233-bb7b019b7a97/5e77cc70-fdc1-4c87-97a7-8d91a6f57a98.png\"></p><p>Start with an image.</p>", "Start with an image.", "<p><img src=\"https://dev.imagecdn.uclusion.com/5250067a-5553-4b52-8233-bb7b019b7a97/5e77cc70-fdc1-4c87-97a7-8d91a6f57a98.png\"></p><p>Start with an image.</p>"]])
('%p', (testDescription, expectedName, expectedDescription) => {
  const { name, description } = convertDescription(testDescription);
  expect(name).toBe(expectedName);
  expect(description).toBe(expectedDescription);
});