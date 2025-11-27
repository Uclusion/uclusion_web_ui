| No Estimate | Estimated | Done |
|--------------|---------------|--------------|
| [CLI TODO fixes](#cli-todo-fixes)| [Import / Export strategy and script.](#import-/-export-strategy-and-script.)| [Python 3.9 end of life - problem is that layers and Lambda runtime must match...](#python-3.9-end-of-life---problem-is-that-layers-and-lambda-runtime-must-match...) |
| | 11-29-2025|  |
| [Website feedback.](#website-feedback.)| |  |
| [Should fix bugs.](#should-fix-bugs.)| |  |
| [Button on the question that generates AI prompt onto the clipboard.](#button-on-the-question-that-generates-ai-prompt-onto-the-clipboard.)| |  |
| [See if React now supports a better way to keep a websocket open - otherwise...](#see-if-react-now-supports-a-better-way-to-keep-a-websocket-open---otherwise...)| |  |
| [Mobile issues.](#mobile-issues.)| |  |
## Job
### CLI TODO fixes

#### Task
Have drop down for view selection on IntegrationPreferences.js. Just copy the one done for job side panel.

#### Task
viewId should be todoViewId as not used otherwise.


## Job
### Website feedback.
From various sources.

#### Task
Fix existing screen shots of planning investible that have this wrong.

#### Task
[Same three use cases but present like https://www.brkaway.co/ does with their...](/dialog/dd56682c-9920-417b-be46-7a30d41bc905/f577ab3a-9234-4f4d-af83-ed7aa1b25fce#option92b659f9-03c1-4d6c-9f9b-1156ca37c770)




Cases are link job, link code Todo, and export data. Give AI a shot at copy style- make sure set model first and use @




<https://wanderlog.com/> also has features section with a grid of features that can be considered.

#### Task
Fix mobile images with Shots tool also.

#### Task
Under collaboration tab on landing page the blocking screenshot is too large - include more of the tab on etc. to make reasonable size.

#### Task
Fix margins at intermediate sizes.

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/aeb957b7-e349-40aa-8ea2-7255b9882949.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='544' />
> ##### Subtask
Mobile also needs margins.


## Job
### Import / Export strategy and script.
Users for this feature:

1. Need export not to be locked in
2. ~~Want to work mostly in their Idea~~ - if you finish a task then commit and then you have to refresh with CLI and then the task is gone - that's a ridiculous flow and no upside really as can't put in progress etc.
3. ~~Like having AI suck in this meta info~~ - for what? and could use a button that removes or not removes pictures from Uclusion anyway
4. Want to check in this file and provide status or get feedback that way instead of inviting an observer to Uclusion - for team they would choose some team view. -<https://mui.com/material-ui/discover-more/roadmap/> - so they do in fact share their project board <https://github.com/orgs/mui/projects/23/views/12> does this feature give us parity with that?





See <https://github.github.com/gfm/> for the Github version of markdown.

#### Task
On CLI integration page correct the examples etc.

#### Task
In documentation explain how to use views and is public so that only what you want to show displays.


## Job
### Should fix bugs.

#### Task
For you menu must show search results when has them and not anything when doesn't and search.




Sidebar menus must open when have search results.

#### Task
Add and another does not clear if had previous draft task

1. Create a draft task so see pencil icon
2. Go back and edit it
3. Create and another has former draft

#### Task
After go to view from job action, go to the my work view if the user has one.

#### Task
When resolve minor but on return arrive in critical bugs section.




Also happening when move a bug to a job from a non critical section.

#### Task
From context menu can send an unassigned job to tasks complete without assigning it or resolving tasks - even though am only person in workspace.

#### Task
No up arrow when do search.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c047efba-47bc-4389-8a4f-858fa4f06772.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='703' />




Counts don't add up - 7 - 5 = 2 missing.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/36d21323-4f19-49d3-94e0-a52b3473f1c2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='849' />




Here have both the expand circle and the chevron to expand. So the collapsed comment should be blue and should link back to the comment instead of uncollapsing - except if hit chevron of course.

#### Task
Edit a subtask headers suck - should say subtask instead of reply and don't need author on either since only author of both can edit.




<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/a1320ce4-4200-434e-99e7-eda11fe4916d.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='957' />

#### Task
Getting re-renders caused by context updates even when the sync gets nothing new. If nothing new there should be no updating contexts.
> ##### Reply
Why do you think it's by context updates? I instrumented the code, it's not going to be pushing messages.

#### Task
Context menu for Not Ready backlog does not include Not Doing.

#### Task
Do the full context menu even if in swimlanes - no reason not to and now no stage header.


## Job
### Button on the question that generates AI prompt onto the clipboard.
Probably skipping pictures and file attachments.

#### Task
This button should produce markdown as <https://github.com/microsoft/markitdown> claims it is native to LLMs. Furthermore need the same markdown with token included image URLs that getting for public status report.

#### Task
Button on the question that generates AI prompt onto the clipboard. Probably skipping pictures and file attachments.


## Job
### See if React now supports a better way to keep a websocket open - otherwise...
...these changes outside the UI could bite.

#### Task
See if React now supports a better way to keep a websocket open - otherwise these changes outside the UI could bite.


## Job
### Mobile issues.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/da90ff1b-a4ad-482a-bbe7-7db577d17a1f.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='376' />

Still too much left padding to fit

#### Task
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c1fb4684-0181-4398-b875-e2bb38c3ae7b.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




After link option to task and resolve question have weird floating header

#### Task
Drop tool bar and drawer on mobile and just do exactly with menu as did for identity (which works on mobile). Make sure the color is okay - there is some weird white.

#### Task
Try again get rid of some of the floaty on mobile. Might be able to repro at intermediate sizes.




This is intermittent and does not repro at intermediate sizes.

#### Task
Need refresh button since reload doesn’t do refresh necessarily and not obvious. This button should run sync so spinning on and returns error if fails just like anything else.




Can have this button for desktop also if can find place to hide it but not required.


## Job
### Python 3.9 end of life - problem is that layers and Lambda runtime must match...
...so seems all or nothing.




html-to-markdown requires 3.10.

