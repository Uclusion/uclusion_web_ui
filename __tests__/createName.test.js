// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

import { convertDescription } from '../src/utils/stringFunctions'

it.each([["<p>Try for name. And then some.</p>", "Try for name. And then some.", ""],
  ["<p><a href=\"https://www.zdnet.com/home-and-office/home-entertainment/the-samsung-qled-tv-that-most-people-should-buy-is-up-to-2000-off-right-now/\" rel=\"noopener noreferrer\" target=\"_blank\">https://www.zdnet.com/home-and-office/home-entertainment/the-samsung-qled-tv-that-most-people-should-buy-is-up-to-2000-off-right-now/</a> - now something something.</p>", "https://www.zdnet.com/home-and-office/home-entertainment/the-samsung-qled-tv-...", "<p><a href=\"https://www.zdnet.com/home-and-office/home-entertainment/the-samsung-qled-tv-that-most-people-should-buy-is-up-to-2000-off-right-now/\" rel=\"noopener noreferrer\" target=\"_blank\">https://www.zdnet.com/home-and-office/home-entertainment/the-samsung-qled-tv-that-most-people-should-buy-is-up-to-2000-off-right-now/</a> - now something something.</p>"],
  ["<p><a href=\"https://en.wikipedia.org/wiki/Region-based_memory_management\" rel=\"noopener noreferrer\" target=\"_blank\">Region based memory management</a> for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.</p>", "Region based memory management for garbage collection.", "<p><a href=\"https://en.wikipedia.org/wiki/Region-based_memory_management\" rel=\"noopener noreferrer\" target=\"_blank\">Region based memory management</a> for garbage collection. That will still be useful even if we go with reference counting later as internal references won't have to be tracked.</p>"],
  ["<p>Ready for Approval => Evaluate, Started => Approved</p>", "Ready for Approval => Evaluate, Started => Approved", "<p></p>"],
  ["<p>Find an pitch to startups with 2+ technical founders. See <a href=\"https://www.reddit.com/r/startups/comments/1ghuh8b/from_garage_to_cloud_our_automotive_saas_journey/\">https://www.reddit.com/r/startups/comments/1ghuh8b/from_garage_to_cloud_our_automotive_saas_journey/</a></p>", "Find an pitch to startups with 2+ technical founders.", "<p>See <a href=\"https://www.reddit.com/r/startups/comments/1ghuh8b/from_garage_to_cloud_our_automotive_saas_journey/\">https://www.reddit.com/r/startups/comments/1ghuh8b/from_garage_to_cloud_our_automotive_saas_journey/</a></p>"],
  // Unfortunate but &gt etc. too much an edge case to code around
  ["<p>Ready for Approval =&gt; Evaluate, Started =&gt; Approved</p>", "Ready for Approval => Evaluate, Started => Approved", "<p>Ready for Approval =&gt; Evaluate, Started =&gt; Approved</p>"],
  ["<p>Demo headers must not mention demo and be helpful for invited also. </p><p><br></p><p>Just use a new notification activity count from async. </p>", "Demo headers must not mention demo and be helpful for invited also.","<p><br></p><p>Just use a new notification activity count from async. </p>"],
  ["<p>Added <a href=\"https://github.com/Uclusion/uclusion_backend_common/commit/bd931fe65dc8b82bb2b9c519a2d5aed6259f236d\">https://github.com/Uclusion/uclusion_backend_common/commit/bd931fe65dc8b82bb2b9c519a2d5aed6259f236d</a> but fixture precedence order is still wrong:</p>", "Added...", "<p>Added <a href=\"https://github.com/Uclusion/uclusion_backend_common/commit/bd931fe65dc8b82bb2b9c519a2d5aed6259f236d\">https://github.com/Uclusion/uclusion_backend_common/commit/bd931fe65dc8b82bb2b9c519a2d5aed6259f236d</a> but fixture precedence order is still wrong:</p>"],
  ["<p>Try for name and then some to see what happens. Maybe so but then try something else.</p>", "Try for name and then some to see what happens.", "<p>Maybe so but then try something else.</p>"],
  ["<p>Try for name and then some to see what happens! Maybe so but then try something else.</p>", "Try for name and then some to see what happens!", "<p>Maybe so but then try something else.</p>"],
  ["<p>Try for name and then some to see what happens? Maybe so but then try something else.</p>", "Try for name and then some to see what happens?", "<p>Maybe so but then try something else.</p>"],
  ["<p>Try for name and then some to see what happens.</p><p>Maybe so but then try something else.</p>", "Try for name and then some to see what happens.", "<p>Maybe so but then try something else.</p>"],
  ["<p>Try for name and then some to see what happens.</p><p><br></p><p>Maybe so but then try something else.</p>", "Try for name and then some to see what happens.", "<p><br></p><p>Maybe so but then try something else.</p>"],
  ["<p>What happens when there continues to be no estimate? From <a href=\"https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/Q-all-17\">Q-all-17</a>.</p>", "What happens when there continues to be no estimate? From Q-all-17.", "<p>What happens when there continues to be no estimate? From <a href=\"https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/Q-all-17\">Q-all-17</a>.</p>"],
  ["<p>Now will work jaguar. For instance:</p>", "Now will work jaguar.", "<p>For instance:</p>"],
  ["<p>Now will work jaguar. For instance:</p><ol><li data-list=\"bullet\"><span class=\"ql-ui\"></span>blah</li></ol>", "Now will work jaguar.", "<p>For instance:</p><ol><li data-list=\"bullet\"><span class=\"ql-ui\"></span>blah</li></ol>"],
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