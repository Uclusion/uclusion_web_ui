| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| [Should fix UI bugs.](#3af2201b-8111-46e9-b746-2f33cf1312bd)| 01/17| [Finish what started in dehighlightMessage so floating message processing...](#35fcebca-c6de-4ea7-a850-6ae647dfbf91)|  |
| [Anything with tabs or left side panel now has different look - including the...](#9d810e3e-9f32-4f1b-b377-13aebd8fbb64)| [Mobile issues.](#c27ba80a-bc55-45b7-8dae-0bbae049e570)| 01/31| [Use Cursor to help fix all console warnings.](#a896d9fa-03bd-4f1d-aa18-48e6993fb1c2)| Deployed to production |
| [Button on the question that generates AI prompt onto the clipboard.](#436e8e41-b8c4-4c73-8818-4d563a81ca44)| | | [Subtask in progress and next button changes.](#c201bd90-f6d5-4bc4-ae93-eef22b6650d6)| Deployed to stage |
| [Substitute for the comparison section,](#283ed39c-2e32-4d70-9c99-a9aef975439a)| | | [More work on the landing page:](#7eac3364-a52a-47ac-8823-2be566506061)|  |
| | | | [Main page beautification.](#75ad865e-a3a7-4d48-9703-e9a900f8ff72)| Deployed to production |
## Job <a name="f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f"></a>
### Better archive.



1. Move archive to left nav and make it per workspace
2. Add a group drop down
3. Split out objects in tabs - Tasks Complete, Not Doing, Bugs, Discussion

#### Task <a name="bf1d3f46-f7ab-4213-8b02-81fb4af34e5b"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8120554f-18cb-4c1f-900a-966cb2d9bd8e.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Some freaky text stuck in corner - only on stage. Also double scroll bars doing nothing.

#### Task <a name="05c06cda-1c40-470a-8ca1-46d414a03d21"></a> 
Add to solo demo archived stuff in all categories so can test.

#### Task <a name="7d5d5a86-51c4-426d-a0cb-e8ffe45f5250"></a> 
Show tasks complete as paginated rows as with backlog.

#### Task <a name="dddc34c9-9309-4cd4-b112-8fd30e4e9106"></a> 
Also need counts from search on other views for anything not showing in the current view (when autonomous).

#### Task <a name="2fcd674f-7c8d-46cf-85e8-6f10a428863c"></a> 
Change sub text on archive to say archive instead of group archive.

## Job <a name="9d810e3e-9f32-4f1b-b377-13aebd8fbb64"></a>
### Anything with tabs or left side panel now has different look - including the...
...shot of estimating in messages section above the fold.

#### Task <a name="a495ccb2-6d43-41d3-8c76-8d8b5741a4ae"></a> 
Anything with tabs or left side panel now has different look - including the shot of estimating in messages section above the fold.

## Job <a name="3af2201b-8111-46e9-b746-2f33cf1312bd"></a>
### Should fix UI bugs.
#### Task <a name="6480fd0a-956c-44f4-a84f-ca0caa68c65b"></a> 
For you menu must show search results when has them and not anything when doesn't and search.




Sidebar menus must open when have search results.

#### Task <a name="8fef848b-0392-4584-ba8a-634ad14433a8"></a> 
Add and another does not clear if had previous draft task

1. Create a draft task so see pencil icon
2. Go back and edit it
3. Create and another has former draft

#### Task <a name="e3955751-12b8-4c03-ba7d-88dfbe2cf053"></a> 
After go to view from job action, go to the my work view if the user has one.

#### Task <a name="21781abb-865d-4327-8917-944b7025faf2"></a> 
When resolve minor but on return arrive in critical bugs section.




Also happening when move a bug to a job from a non critical section.

#### Task <a name="4eebebbb-a052-43e9-a492-d6474808fc1d"></a> 
Change "subtask" to "grouped task" in markdown generator Lambda.

#### Task <a name="87d078c7-9375-412a-9367-fb7509a8adc3"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/65826b2f-930a-42a1-863e-c24890e7db47.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Tab extends beyond rows weirdly.

#### Task <a name="8a4ee34b-6a80-4aa0-bfed-49825d42f892"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c047efba-47bc-4389-8a4f-858fa4f06772.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Counts don't add up - 7 - 5 = 2 missing.

#### Task <a name="83af94b4-f765-4d25-bf40-c87c0eda20ac"></a> 
When search resolved tasks must display on tasks page as well so that search works. Currently it shows resolved found as on tasks page but nothing there.

#### Task <a name="3671e2b8-0876-4e90-921c-49c1144345ad"></a> 
Getting re-renders caused by context updates even when the sync gets nothing new. If nothing new there should be no updating contexts.

> ##### Reply <a name="3ddbca75-8758-4552-9cd0-e3a663bf6772"></a> 
Why do you think it's by context updates? I instrumented the code, it's not going to be pushing messages.

#### Task <a name="5c9637a6-b94c-4a16-9aea-fe8bcc4d2cc0"></a> 
Do the full context menu even if in swimlanes - no reason not to and now no stage header.

#### Resolved Task <a name="b5ca7cbe-704b-4cce-9e50-77834334f474"></a> 
Count color not on bugs or backlog lists

#### Resolved Task <a name="d0c15bc9-9dbc-4a8f-a663-42c675f5995b"></a> 
Link from comment in subtask wizard, and presumably others, goes to the comment but does not turn yellow. There was a flag for turning off the yellow but absolutely currently no reason to use such a thing - see if can fix so yellows correctly.




Actually turning yellow broken for link from ticket code and inbox also - seems just broken.

#### Resolved Task <a name="b85b71e3-3eb8-4b69-9d35-1c486b2101ed"></a> 
Remove going to individual not new notifications other than critical bugs and outbox from navigation button.




Navigation will go to one of four places:

1. New notifications expanded
2. A critical bug notification
3. Swimlanes of all views that is member of
4. In progress tasks in assigned jobs

#### Resolved Task <a name="6f93efb0-f0a6-4bc0-a1b4-6b3327c22571"></a> 
Dragging a job directly from Assistance to Tasks Complete does not work for unassigned one (I think).

#### Resolved Task <a name="4e34416d-9b53-433a-a2d9-d1aaacc03d1d"></a> 
Simplify views.

> ##### Subtask <a name="b85b71e3-3eb8-4b69-9d35-1c486b2101ed"></a> 
Remove going to individual not new notifications other than critical bugs and outbox from navigation button.




Navigation will go to one of four places:

1. New notifications expanded
2. A critical bug notification
3. Swimlanes of all views that is member of
4. In progress tasks in assigned jobs

> ##### Subtask <a name="2d774af4-91ba-41a1-8b46-c5185eac71ed"></a> 
When choose add peers get this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/f8ed40e6-f4f2-465a-af22-e956e251d543.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

That's too confusing - second step in the wizard has to ask if the people you are adding are on the same team or observers. If same team just create new named view and if not then automatically create autonomous view.




**That means can't create the workspace till know as there must be at least one view.**




**================**




![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e5bf8cf9-020c-49d7-81ae-e8f3c85af7a6.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




This above is too confusing. How about just two choices "Single person view" or "Team view". Sub-text explains that a workspace must have at least one view. If choose team view you name it yourself with sub-text that explains what a view is - the finish button there creates the workspace.

> ##### Subtask <a name="395caf80-2822-43fd-ae11-1a4ca6b17957"></a> 
Remove view link to documentation and make collapsible section like all the rest and have collapsed by default when there is only one view.




**J**ust drop the whole weird sidebar language and do as one thing.

> ##### Subtask <a name="3e5e867f-97a0-4156-93d1-ba8dbe4319a9"></a> 
Remove explanation of views from intro to workspace screens.

> ##### Subtask <a name="6cff6d27-fbd1-455e-a1ab-4ad8aeb59e1b"></a> 
Make solo demo single view only.

#### Resolved Task <a name="da778633-d092-4486-b39c-0e9870887a7e"></a> 
Search text doesn't change when go into job - still says view name.

#### Resolved Task <a name="1cb3e171-26ec-47a6-bdd6-ae2267efa6ae"></a> 
Check box on tasks overview is red instead of green.

#### Resolved Task <a name="e60e9015-aa0c-49ed-abf4-0e58c1585873"></a> 
From context menu can send an unassigned job to tasks complete without assigning it or resolving tasks - even though am only person in workspace.

#### Resolved Task <a name="e80ece94-a27e-4f71-8849-554133591e00"></a> 
On the overview of a job the number of resolved tasks should be a plain number instead of inside an orange chip.

#### Resolved Task <a name="8806f87e-106e-41a7-a886-ab3f2e48e6a8"></a> 
Verify on production that no scroll bar on switch workspace even with many workspaces.

#### Resolved Task <a name="db65eb46-58dc-4078-86f2-5dd63694e1ce"></a> 
If drag job with open suggestion to Work Ready and choose Make Task then just spins forever and no action taken.




*Unable to repro any of this.*

> ##### Subtask <a name="528c8325-07e1-4366-9b2c-9d2ffcdf4a83"></a> 
If have reply on that suggestion then after make the suggestion a task and put it in progress and put reply in progress, the reply disappears.

#### Resolved Task <a name="395caf80-2822-43fd-ae11-1a4ca6b17957"></a> 
Remove view link to documentation and make collapsible section like all the rest and have collapsed by default when there is only one view.




**J**ust drop the whole weird sidebar language and do as one thing.

#### Resolved Task <a name="1e78582a-7193-4907-b060-85dad860e25a"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/80873630-89de-4414-8a96-9aad0098400c.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Don't display the view name in ticket code. It already displays on right nav under View and on left nav if in that view.

#### Resolved Task <a name="1ba98476-cd57-40f9-af2e-be2cacea2d05"></a> 
Put in debug log statements to figure out when search bar is re-rendering and flickering. Related to [Must fix bugs. - T-all-7](#3671e2b8-0876-4e90-921c-49c1144345ad) ?

> ##### Subtask <a name="2e922336-b81d-49cb-853a-0e7f89942d95"></a> 
Redo presentation of offline and have timer on it. See Gmail example - not nearly as big a message. Can simulate offline in Chrome devtools.

#### Resolved Task <a name="7a0e8e35-d10d-403e-aa5c-89cfe28fce04"></a> 
When move from in approval to work ready on job I don't own it does not ask for reassignment to me. (Instead asks for approval.)




**Actually can't ask for reassignment to me since if I dragged to their work ready - if I dragged to my work ready then it will reassign.**

#### Resolved Task <a name="bbe5eebd-10d3-4c1d-a4fa-cb7a75ae1538"></a> 
On resolved tasks in overview do not show buttons to move to bugs as must be open to do that.




Maybe don't show selector or anything as get "No open tasks" when try - either turn that off and allow or disallow any buttons that would arrive at that.

#### Resolved Task <a name="b019ffb1-7558-48ac-8916-3482485860d4"></a> 
When move job with question from assignee in regular view to Work Ready not prompted to resolve question and instead goes briefly till quick add wiped out.

#### Resolved Task <a name="6f802862-2a5e-428a-a3a7-530455d4b794"></a> 
Cannot link to resolved investible bugs - doesn't go to that section.

#### Resolved Task <a name="90f611ac-c888-44be-86f8-98d215ca64a1"></a> 
No navigation when do search. Instead make up a level the only one that shows.

#### Resolved Task <a name="3e5e867f-97a0-4156-93d1-ba8dbe4319a9"></a> 
Remove explanation of views from intro to workspace screens.

#### Resolved Task <a name="c545887b-8fe7-4fc3-ad4c-94b64005ff90"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/9ebd03f5-a012-4fd1-9980-a58c9379168e.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Doesn't look good and empty text is misleading. **Just make assist part of what prevents empty text from showing.**

#### Resolved Task <a name="0e5f6beb-60b8-4283-bf69-028bdedb5dbf"></a> 
Notes are somehow following the progress report logic and only showing the latest one - possibly even resolving older ones.

#### Resolved Task <a name="13375543-da18-4589-b826-948cf8968370"></a> 
Don't show poke icon on resolved comments.

#### Resolved Task <a name="c3fec27e-6465-4b09-b299-b4205f34d957"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/d06b3c63-0d12-4bb7-ac65-aa3577f134b8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Make In progress left most on both parent and child. Drop date on child - parent doesn't have both so why should it.

#### Resolved Task <a name="6cff6d27-fbd1-455e-a1ab-4ad8aeb59e1b"></a> 
Make solo demo single view only.

#### Resolved Task <a name="f9ce3d3e-7db4-42f6-9872-66a03e5e1729"></a> 
Make the search bar look more standard - use AI if necessary.

#### Resolved Task <a name="da760056-b86d-42ef-b830-97d1f17019b9"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/102fb8cb-439c-470d-bf57-02c62b3dae35.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




In a team view so should have Add with voting button available. **Plus errors out if hit Configure voting button.**

#### Resolved Task <a name="cb34dbe5-e22d-46aa-99f8-232cb75191ca"></a> 
Reply linking icon is in corner but for comment is in middle. Too confusing. Probably reply one should move to middle cause as it is looks like the avatar for the name which it isn't.

> ##### Subtask <a name="dd255c52-1d03-4c52-bc58-9abb4f2c2145"></a> 
For the jobs overview expansion the linker is to the right and nothing is on the left.

#### Resolved Task <a name="e6109310-9f42-4e46-b515-21e1c0bb62e7"></a> 
All empty text in support workspace must be support specific.

#### Resolved Task <a name="7e20ed91-4fc7-4419-ab9d-a4cb49d7e74f"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/36d21323-4f19-49d3-94e0-a52b3473f1c2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Here have both the expand circle and the chevron to expand. So the collapsed comment should be blue and should link back to the comment instead of uncollapsing - except if hit chevron of course.

#### Resolved Task <a name="e3452cea-2ea2-4feb-b46d-482c136193e4"></a> 
Colors have to match the status screen - red for new and orange for not.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8ac27cc5-e4af-40f1-ab1d-8745c7c31a73.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




If orange doesn't work then change it in both places but must match - no new colors for the same info.

#### Resolved Task <a name="5aaf01ec-a15e-4732-8c23-6c15c05b6dee"></a> 
Edit a subtask header - should say subtask instead of reply and don't need author on either since only author of both can edit.




![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/a1320ce4-4200-434e-99e7-eda11fe4916d.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task <a name="61a70e37-6cc3-41d4-9c64-6df09d309c8c"></a> 
Context menu for Not Ready backlog does not include Not Doing.

#### Resolved Task <a name="b3ac8ea4-c96a-480a-98fb-c5f7a6a07815"></a> 
Leader thing with two tabs seems broken - got:




    Not refreshing with is leader undefined

#### Resolved Task <a name="537c9d78-ca5e-4976-81d4-bbec1412667b"></a> 
Have an upgrade script that removes all notifications associated with unused older demo versions.




**Or maybe just fully cleans them up as the script that does that cleans up a planning market (including notifications) should exist.**

## Job <a name="436e8e41-b8c4-4c73-8818-4d563a81ca44"></a>
### Button on the question that generates AI prompt onto the clipboard.
Probably skipping pictures and file attachments.

#### Task <a name="17c54d09-22e8-4b03-a8bf-f59463c1ab1b"></a> 
This button should produce markdown as <https://github.com/microsoft/markitdown> claims it is native to LLMs. Furthermore need the same markdown with token included image URLs that getting for public status report.

#### Task <a name="c37e86d4-1efc-4dea-ae23-1fd0171f3175"></a> 
Button on the question that generates AI prompt onto the clipboard. Probably skipping pictures and file attachments.

## Job <a name="283ed39c-2e32-4d70-9c99-a9aef975439a"></a>
### Substitute for the comparison section,

#### Task <a name="6d550fb7-e7d7-4985-bd2b-75ca88df6f2e"></a> 
See if can find substitute for the comparison section or way to make it reasonable - get kid's help.




Video explaining in progress/ navigation / subtask is possible.

## Job <a name="c27ba80a-bc55-45b7-8dae-0bbae049e570"></a>
### Mobile issues.
#### Task <a name="39bf8c1f-32bc-46a5-a58d-0ecf3ad36233"></a> 
On mobile when open collaborators get white instead of blue.

#### Task <a name="38481d49-e8b4-4ce3-ba3b-d915f090b07b"></a> 
Details section on mobile needs to default to open.

#### Task <a name="4b3c9ca4-7326-4271-82de-803ef5e16876"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/da90ff1b-a4ad-482a-bbe7-7db577d17a1f.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Still too much left padding to fit

#### Task <a name="aad2b51c-2d4f-4b6c-b404-6a59999ae994"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c1fb4684-0181-4398-b875-e2bb38c3ae7b.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




After link option to task and resolve question have weird floating header

#### Task <a name="acf05f3f-b694-40f7-8cd9-e846823909f4"></a> 
Drop tool bar and drawer on mobile and just do exactly with menu as did for identity (which works on mobile). Make sure the color is okay - there is some weird white.

#### Task <a name="21c29a24-a2c5-4809-a8cd-4d60de64b362"></a> 
Try again get rid of some of the floaty on mobile. Might be able to repro at intermediate sizes.




This is intermittent and does not repro at intermediate sizes.

#### Task <a name="42ce409a-ce4d-468a-ae2a-4a0bf4c5560c"></a> 
Need refresh button since reload doesn’t do refresh necessarily and not obvious. This button should run sync so spinning on and returns error if fails just like anything else.




Can have this button for desktop also if can find place to hide it but not required.

## Job <a name="35fcebca-c6de-4ea7-a850-6ae647dfbf91"></a>
### Finish what started in dehighlightMessage so floating message processing...
...logic kludge in notifications reducer can be removed.

#### Resolved Task <a name="d116227c-d046-40c1-bbf3-b4dc8cd1d9a9"></a> 
Next button takes too long and so will some of the other buttons.




Would putting the promise into a timer help?




The context update runs synchronous so the problem is just that the back end call can end up not happening at all unless make it securely.




**The other problem is can end up redisplaying the Next message notification before the context propagates - this might be the actual problem hit originally.**




HAVE STATE IN NAVIGATION SO COULD GUARD AGAINST SEEING SAME NOTIFICATION AGAIN.

> ##### Subtask <a name="f9f579c7-0f42-44d9-8029-208a4441e230"></a> 
Add guard against seeing the same message that just saw a short while ago again.

#### Resolved Task <a name="6e3dc469-2240-473e-a12c-542966738f52"></a> 
Try the timeout 0 wait way to avoid delaying the navigation.




**Actually then why not just use this inside of notifications context and drop the whole promise true thing altogether?**







    const newState = computeNewState(state, action);

    if (!isDehighilightRemove) {

    storeStatePromise(action, newState);

    }

    return newState;




Actually above has a floating promise also IE the store state is not guaranteed to happen - should we put that in to a setTimer also or can we return a promise from a reducer?

## Job <a name="a896d9fa-03bd-4f1d-aa18-48e6993fb1c2"></a>
### Use Cursor to help fix all console warnings.
## Job <a name="c201bd90-f6d5-4bc4-ae93-eef22b6650d6"></a>
### Subtask in progress and next button changes.
#### Resolved Task <a name="c47affe1-3a1c-4927-8fc9-a79fc7c99764"></a> 
Don't disable in progress on subtask and instead automatically control exactly as if each subtask is a regular task. The parent does not have to be in progress - this is just a logical grouping.




Where there is logic that checks the parent before counting the subtask as in progress just remove it.

> ##### Subtask <a name="7605bac1-a958-4340-80be-c7cd05aa1132"></a> 
Rename subtask to "grouped task" in general and "Group" on the create button. That in all ways is what was implemented. Then instead of Move to task just "ungroup".




There should be no specific logic in the wizard for a grouped task - just asks about all others.




If they don't want parent to be its own task they can just not have it in progress.

#### Resolved Task <a name="be876ed1-f63b-4a2b-9406-cc5e869bf329"></a> 
If in a back log job Next view is always what next button says and does.

> ##### Subtask <a name="6d4aff4d-0419-402d-bedc-a2fa656b2379"></a> 
No that won't work as could have arrive in back log job from next button.

#### Resolved Task <a name="60500869-1d54-42f3-b30e-2b8112668540"></a> 
Test next button.

> ##### Subtask <a name="4bbf352b-04d1-4a88-8aa6-950268fbc647"></a> 
Not going through all in approval investibles - just two of them.

#### Resolved Task <a name="94af12b6-2781-4ac6-b560-783df8c35935"></a> 
 Go to Next job where Next job is the one due next. If no due dates pick the first one in Work Ready. If nothing in Work Ready pick the first in Assistance. If nothing in Assistance go to the first in pause / approval.




If no status at all and inbox has something read go there.




If no status jobs and no inbox at all go to Next bug IE the section in order of priority. If no bugs either go to not ready jobs if exist. If none of that go to Compose button.

#### Resolved Task <a name="a172bd76-c03f-463b-9362-441a68dc1007"></a> 
Don't disable the Next button.

#### Resolved Task <a name="b536c03f-6891-4a46-ab34-042a8b8bf34a"></a> 
The display of grouped tasks in swimlanes still not seeing the child ones.

## Job <a name="7eac3364-a52a-47ac-8823-2be566506061"></a>
### More work on the landing page:
[More work](https://www.reddit.com/r/roastmystartup/comments/1dyncmb/comment/lcbfdnp/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) on the landing page:




Right off the bat, the website is painfully slow. It gets a performance score of 49 from Google's website performance test, which is a terrible result. A lot of people are going to just exit the website while it is still loading.

On the over the fold area of the landing page, there are three moving elements, making the first impression busy and chaotic.

Using light blue font over a white background for "sandbox demo" is awkward. The text is difficult to read and looks like a text link, while it's not.

"Better than tickets" also looks like a text link with its underline effect, but again this is not a link. It's very confusing what elements here are clickable and which are not.

There are so many font styles and effects that the entire thing looks very amateurish. For example, in the "Better than tickets" section, I can count 10 different font styles on one view. It looks like a collage kid who just learned CSS and realized the can use different font styles on a html page.

The landing page keeps referring to a sandbox demo, but there is no link to it anywhere that I can see. And without it, I cannot really see how this thing works.

This needs a lot of work.

#### Resolved Task <a name="4e9f3a05-3203-42d8-b564-1bb2684727c2"></a> 
Remove the bouncing arrow above Pricing section.

#### Resolved Task <a name="42763b68-54e7-4e2f-879a-037d50f3e077"></a> 
Fix all pictures in messages section of above the fold.

#### Resolved Task <a name="c3843400-5f48-4b2e-891b-a03be98e3bc8"></a> 
Change docs to explain keystrokes but no buttons for other two operations.

#### Resolved Task <a name="26f396f9-08bb-41d8-99cc-d20e6155325c"></a> 
Add LogRocket to landing page.

#### Resolved Task <a name="0c2035aa-3206-4261-9d2a-77447a5b5759"></a> 
Try to fix Google performance score on load time. <https://pagespeed.web.dev/?utm_source=psi&utm_medium=redirect>

#### Resolved Task <a name="999a2acc-3dbc-4c96-ae86-39794cb6ed86"></a> 
Remove all usage of fades and zooms.

#### Resolved Task <a name="4e18dca1-c75e-434c-900c-f6e911dc8fd0"></a> 
Re-enforce sandbox demo on sign up page.

#### Resolved Task <a name="d7351d08-bbd4-4aec-bfb2-58c53df7de59"></a> 
Change landing page and docs to say grouped tasks instead of subtasks.

#### Resolved Task <a name="1b3f95cc-57b3-4372-a184-54a047673335"></a> 
Reduce number of fonts per comment.

## Job <a name="75ad865e-a3a7-4d48-9703-e9a900f8ff72"></a>
### Main page beautification.
#### Resolved Task <a name="1cac1e19-a591-49c9-be0d-7896ee471946"></a> 
Icon only Next button on mobile IE arrow with white button around it.

#### Resolved Task <a name="5b1d137b-58d6-428e-8861-ef3473cdf57d"></a> 
Next button lines up outside of last tab IE Notes / Discussion - not on top of it - until page shrinks to where forced.

#### Resolved Task <a name="178dd41e-49f2-449a-bb3e-5baeb5e5ef28"></a> 
Consider making action buttons match Next button IE more rounded and no blue edge - but not a bleeder.

#### Resolved Task <a name="0ae5f3cf-f132-4572-bfc4-afdeb01bfcf6"></a> 
Get horizontal and vertical aligning of all stage investible headers correct. Can use AI if put them in their own component and specify.




Also add a bit more space above the stage investible header.

#### Resolved Task <a name="3ac6ee70-f8a0-4ca7-8d55-00aa6e565962"></a> 
Plus signs on side nav line up with count numbers. Drop expand collapse and just do More + like Google does if more than five - for Views and Other workspaces. That More and Less will connect with the same state used now so that it is permanent.

> ##### Subtask <a name="32410979-285e-44f0-8009-81d5b140b607"></a> 
Integrations and Messages continue to work the way they currently do as they have no plus button.

> ##### Subtask <a name="fa3699e0-77f3-435d-b445-eb02299375f7"></a> 
 For Collaborators just drop the expand collapse altogether.

#### Resolved Task <a name="e6ba299a-e8d0-4139-b3f4-ff17f5316e65"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/92f32e1d-a31b-4c53-a869-3a80d59b789a.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

When there are no in progress tasks there is not enough space below the title.




Also not enough space above the title when have open tasks - add bottom margin to the chips.

#### Resolved Task <a name="fcd02a0a-8c94-4ae2-aa4d-9879162edb48"></a> 
Search bar moves flush left.

#### Resolved Task <a name="fbd9a7ea-c03b-44cb-b164-8f2976209c8a"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e3491e33-1b41-4f4f-8408-8b0fb5caa645.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Schedule icon somehow outside the centering.

#### Resolved Task <a name="6ae08120-9ca6-421a-8dab-4a1a4737f9eb"></a> 
In complete section either be half length or full length.

#### Resolved Task <a name="9263512a-c051-4526-b327-b3625e905435"></a> 
Navigation arrows should be just one text one that says where you are going to go and keep the key strokes the same.

> ##### Subtask <a name="cb254bd4-3d53-4b32-8ffb-c1a7ec76ecb9"></a> 
The hover text explains all three key strokes (may need to do HTMl hover to do that).

#### Resolved Task <a name="0465fa3f-292e-4bc0-b239-b04275a4888b"></a> 
Add color to the words paused, complete, and assistance in the swimlanes - orange, green, and red.

#### Resolved Task <a name="388ff458-9b2d-443f-a97f-e94cfc9f8bd5"></a> 
When go to new message and don't process then dehighlighting not happening until press the Next button again.

#### Resolved Task <a name="f889e5ef-36e8-4622-a944-e92dd91f5c60"></a> 
Change this button to look like Add job.

#### Resolved Task <a name="0ab75904-4bcc-466a-8dee-83ea9f5ca97f"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/3a8aee4c-ece1-4595-ab2c-96b6c83c7d74.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Messed up here.

