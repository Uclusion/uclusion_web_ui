| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| [More work on the landing page:](#7eac3364-a52a-47ac-8823-2be566506061)| 01/02| [Finish what started in dehighlightMessage so floating message processing...](#35fcebca-c6de-4ea7-a850-6ae647dfbf91)|  |
| [Should fix UI bugs.](#3af2201b-8111-46e9-b746-2f33cf1312bd)| [Mobile issues.](#c27ba80a-bc55-45b7-8dae-0bbae049e570)| 01/03| [More landing page fixes](#c0f0c729-a4bf-4ee0-b0ba-5a7199cc754b)|  |
| [Button on the question that generates AI prompt onto the clipboard.](#436e8e41-b8c4-4c73-8818-4d563a81ca44)| | | [Website feedback.](#f577ab3a-9234-4f4d-af83-ed7aa1b25fce)|  |
| [Use Cursor to help fix all console warnings.](#a896d9fa-03bd-4f1d-aa18-48e6993fb1c2)| | | [Main page beautification.](#75ad865e-a3a7-4d48-9703-e9a900f8ff72)| Deployed to stage |
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

#### Task <a name="da778633-d092-4486-b39c-0e9870887a7e"></a> 
Search text doesn't change when go into job - still says view name.

#### Task <a name="7a0e8e35-d10d-403e-aa5c-89cfe28fce04"></a> 
When move from in approval to work ready on job I don't own it does not ask for reassignment to me. (Instead asks for approval.)

#### Task <a name="90f611ac-c888-44be-86f8-98d215ca64a1"></a> 
No up arrow when do search.

#### Task <a name="8a4ee34b-6a80-4aa0-bfed-49825d42f892"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c047efba-47bc-4389-8a4f-858fa4f06772.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Counts don't add up - 7 - 5 = 2 missing.

#### Task <a name="83af94b4-f765-4d25-bf40-c87c0eda20ac"></a> 
When search resolved tasks must display on tasks page as well so that search works. Currently it shows resolved found as on tasks page but nothing there.

#### Task <a name="7e20ed91-4fc7-4419-ab9d-a4cb49d7e74f"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/36d21323-4f19-49d3-94e0-a52b3473f1c2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Here have both the expand circle and the chevron to expand. So the collapsed comment should be blue and should link back to the comment instead of uncollapsing - except if hit chevron of course.

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

#### Resolved Task <a name="bbe5eebd-10d3-4c1d-a4fa-cb7a75ae1538"></a> 
On resolved tasks in overview do not show buttons to move to bugs as must be open to do that.




Maybe don't show selector or anything as get "No open tasks" when try - either turn that off and allow or disallow any buttons that would arrive at that.

#### Resolved Task <a name="b019ffb1-7558-48ac-8916-3482485860d4"></a> 
When move job with question from assignee in regular view to Work Ready not prompted to resolve question and instead goes briefly till quick add wiped out.

#### Resolved Task <a name="6f802862-2a5e-428a-a3a7-530455d4b794"></a> 
Cannot link to resolved investible bugs - doesn't go to that section.

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

## Job <a name="a896d9fa-03bd-4f1d-aa18-48e6993fb1c2"></a>
### Use Cursor to help fix all console warnings.
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

#### Task <a name="c3843400-5f48-4b2e-891b-a03be98e3bc8"></a> 
Change existing landing, blog, and docs screenshots with swimlanes to new look.




Change docs to explain keystrokes but no buttons for other two operations.




Also on landing page have the screenshot be area instead of whole page.

#### Resolved Task <a name="0c2035aa-3206-4261-9d2a-77447a5b5759"></a> 
Try to fix Google performance score on load time. <https://pagespeed.web.dev/?utm_source=psi&utm_medium=redirect>

#### Resolved Task <a name="4e18dca1-c75e-434c-900c-f6e911dc8fd0"></a> 
Re-enforce sandbox demo on sign up page.

#### Resolved Task <a name="1b3f95cc-57b3-4372-a184-54a047673335"></a> 
Reduce number of fonts per comment.

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

## Job <a name="c0f0c729-a4bf-4ee0-b0ba-5a7199cc754b"></a>
### More landing page fixes
1. Smaller pictures on above the fold so doesn't look low res and so that on mac the button and text can be put back on the side - MAKE SURE the top menu doesn't disappear when click on it as now after do that
2. Open documentation and blog inside a frame so that don't leave main website - remove links on those that go to each other or main website OR remove header on those altogether

#### Resolved Task <a name="66ac8010-9450-44a3-9ff6-854500efd572"></a> 
Remove outer scrolling on a frame.

#### Resolved Task <a name="94730e8c-2015-4a5f-841c-769e9530a994"></a> 
If click pricing first then hash #pricing stays on URL when go to documentation.

#### Resolved Task <a name="272c8e36-1b46-4e63-b5ff-0f02ac067ac4"></a> 
{iframeUrl && (

        <**IframeContainer** *headerHeight*={headerHeight}>

          <iframe

            *src*={iframeUrl}

            *title*="Embedded Content"

            *allow*="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

/>

        </**IframeContainer**>

)}




That's a dumb architecture - have an iFrame for both blog and documentation and just display none when state set by clicking on header urls is not matching.

#### Resolved Task <a name="0c39c6f1-3ce4-4048-8a6d-d884d47bd9b7"></a> 
See if there is a way to produce a higher quality screenshot - SVG?




Current statusAutonomous.png: PNG image data, 1647 x 936, 8-bit/color RGBA, non-interlaced




New statusShot.jpeg: JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, baseline, precision 8, 3840x2160, components 3




So literally not enough pixels in the existing and must redo.

> ##### Subtask <a name="0f33ab5f-ab12-4908-9a36-c8d6c13a51c0"></a> 
Try higher screen resolution in dev tools like this says <https://docshound.com/blog/capturing-premium-product-screenshots> - now after setup:




CTRL+Shift+P and then type screenshots and choose node one.




Using zoom at 117 for most.

#### Resolved Task <a name="821677c6-e682-4471-b219-9c14295f2d36"></a> 
Smaller pictures on above the fold so doesn't look low res and so that on mac the button and text can be put back on the side - MAKE SURE the top menu doesn't disappear when click on it as now after do that

#### Resolved Task <a name="f2960e96-c14c-4d98-b0e6-8537ef55de28"></a> 
On documentation change:




<div *id*="iframe-not-allowed-notice-kludge" *style*='margin-top: -50px;'></div>




to be a class that only happens when not mobile.

#### Resolved Task <a name="636997c6-c6bb-4bd1-919d-6ef63ba0a421"></a> 
On mac when click the above the fold tab menu still snapping into place and screen jerks.




**Might be the built in back to top on tab click - just remove logic if is.**

#### Resolved Task <a name="60f7d932-b70d-4868-882b-7828ab6affe9"></a> 
In iframe when click into blog have no way back - need to put back button somewhere (can show in both is fine).

#### Resolved Task <a name="7565a128-9705-4112-97d7-aae0689d0a8c"></a> 
May need to zoom in more to avoid being so small and unreadable- not sure how to do that with dev tools.




From dev tools command menu select: Capture area screenshot

#### Resolved Task <a name="3eed9c51-60f0-4cf3-ab9c-2bb2fd482d6a"></a> 
Pictures in tip of spear blog must be hi res.

#### Resolved Task <a name="6426369e-cbee-4f77-8ce8-f32a207321cd"></a> 
Open documentation and blog inside a frame so that don't leave main website - remove links on those that go to each other or main website OR remove header on those altogether

> ##### Subtask <a name="6ff29b3b-71be-4139-9f42-13d645659e75"></a> 
Remove header and footer inside blog when in iframe.

#### Resolved Task <a name="3de4278a-58ef-4109-959e-e984af2a36be"></a> 
Since not showing header "All posts" no longer makes any sense in i-frame - drop it when in i-frame.

#### Resolved Task <a name="d28876b3-3cd3-4f9e-8215-d95b68cbb881"></a> 
Another go at fixing the space above search in iframe.




However when click on some links like My work its not there and fix will mess up.




**Not seeing this div when inspect - weird. Problem could be need more than -50px for above search or need padding -50px or something.**




Could add div with color or words so can see what going on.

#### Resolved Task <a name="b75d75b5-12fe-420e-b26b-32a34b92ab8f"></a> 
On mobile break above the fold sentences so looks better

## Job <a name="f577ab3a-9234-4f4d-af83-ed7aa1b25fce"></a>
### Website feedback.
From various sources.

#### Resolved Task <a name="782226dd-97a6-4dcd-9dd7-72dbcb6b91b7"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/26c15d5b-1c91-4f1d-9c77-12b975ceaaae.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Update the action.yml to have an check in square icon and a color.

#### Resolved Task <a name="2ff102c0-8ae7-4fc0-a09d-5983ee734724"></a> 
YouTube (probably) video showing hooking up and using the CLI after landing on demo.

#### Resolved Task <a name="20e6df71-e029-4236-a8f3-2d599bfbf099"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/2ae68ccb-efdd-48e8-a891-aa13b2b1dd42.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Graphically show the Uclusion object structure like they do and explain why better:




Workplaces

Views Collaborators




Views

Members Jobs Bugs Question Suggestion Notes




Jobs

Assignees Stages Tasks Approvals Reports Questions Suggestions Blockers Due date




Tasks <=> Bugs

Subtasks Replies In Progress




Approvals

Certainty Expiration




Reports

Replies Older ones auto resolve




Suggestion <=> Tasks

Votes (same as approval but for or against) Replies




Questions

Options Replies




Options => Task with link

Approvals Stages Comments




Replies => Tasks

Mentions (can also be used on any comment)




Each different type of comment backed by opinionated notifications / wizard help and status display.

> ##### Subtask <a name="21c4d986-5984-4107-8413-88c02a8af0cd"></a> 
Put this picture and explanation as first slide under organization tab and drop crappy third slide.

#### Resolved Question <a name="af1c0020-7d85-40c3-8bc1-5a2932114d33"></a> 
## How to sell/explain Github actions feature?




Video won't work as code in Idea, switch to Uclusion to copy job info, paste in commit back in Idea is not sexy.

### Option<a name="92b659f9-03c1-4d6c-9f9b-1156ca37c770"></a>
### Same three use cases but present like https://www.brkaway.co/ does with their...
Same three use cases but present like <https://www.brkaway.co/> does with their cards of info and pictures.

### Option<a name="ab94add0-093e-42ce-9a26-4645cfe21205"></a>
### Just close up on the job labels on one side and the Github action simple...
...config to setup on the other. Then same left and right thing for both TODO sync and data export.

#### Resolved Task <a name="c910b6dc-6b34-4da5-b797-6e16f987e151"></a> 
Fix existing screen shots of planning investible that have this wrong.

#### Resolved Task <a name="ff4ae7d5-8369-4c08-bbba-ad1db6d3f28a"></a> 
Show before and after for Github actions issue to show how much better in Uclusion.

1. Open tasks
2. Overview
3. Github issue version

> ##### Subtask <a name="78dca463-9987-4b5a-b2cb-249fbc45211d"></a> 
Can use a fade transition to sell this.

#### Resolved Task <a name="914d66fe-bf5a-4017-9567-63217ad334f9"></a> 
Add and use release-job action on stage.

#### Resolved Task <a name="ea1fa292-e212-4765-ac48-d66e7fae9ddd"></a> 
Check for market place examples from competitors to give a hint.

#### Resolved Task <a name="15a6f145-aa28-4b9c-b7f3-ceec88eab35a"></a> 
Setup the scroll locking for this new section.

#### Resolved Task <a name="11ad6748-cd6c-41c6-9839-e9dae9f37632"></a> 
<https://www.brkaway.co/> - very similar to Uclusion maybe can learn from their site. **Note the effort they put into proving that they are specific to their audience:**

1. Asana for creator management
2. Years in the industry before building this solution
3. Explanation of extra features like approvals in terms of the flow they are supporting
4. Their why section better than your comparison section as they maintain they are a whole different product - not apples to apples





**Consider replace comparison with their why section - including copying their widgets. People who innovate are their own market and need a different tool from project management like Asana / Jira (which they hate).**




**Might be able to keep the comparison but have it be lower.**




Everything below the demo button goes in this new section and move changing text below the button

#### Resolved Task <a name="0f273011-6015-4848-88cd-16aaa404d77a"></a> 
Compare to some of <https://saassy-board.com/leaderboard>

#### Resolved Task <a name="f50b1c72-6ce0-4552-965b-da1a7d787672"></a> 
Fix mobile for this new section.

#### Resolved Task <a name="07acd291-ca63-4423-b667-75a4995f6905"></a> 
Fix point of spear blog. Make this founder to founder - hey trust me style as Ben was mentioning - we're not those guys.

#### Resolved Task <a name="0124c37a-aeb0-45b3-afd1-061482be00e5"></a> 
Release latest check in to update-job and test with a short code that has a space in it.

#### Resolved Task <a name="8f4be1e7-005a-4c6b-9f92-f726a83eb39b"></a> 
Do job-label.

#### Resolved Task <a name="9e9cca6d-da9c-44c7-92cf-ce09ba561d1d"></a> 
See <https://www.teamcamp.app/> which doesn't even have pricing on main page - Uclusion landing just not enough sections.




They did video and tabbed pictures (their pictures are larger but that's not better) and click through for details.




Maybe have some larger pictures available from links on comparison? Maybe throw in a video also?

#### Resolved Task <a name="83d7f1c1-c168-4e11-9c8f-064efa70c0dc"></a> 
[Same three use cases but present like https://www.brkaway.co/ does with their...](#92b659f9-03c1-4d6c-9f9b-1156ca37c770)




Cases are code TODOs, generate report, and Github actions. Give AI a shot at copy style- make sure set model first and use @




<https://wanderlog.com/> also has features section with a grid of features that can be considered.

> ##### Subtask <a name="b9830f99-a4f5-4c22-8b34-635f91ce3123"></a> 
Add a CTA below as Wanderlog did - copy the blue one above.

#### Resolved Task <a name="732ae43a-77ae-4744-9536-ab21e54de809"></a> 
Setup for the action - needs its own public repository - <https://docs.github.com/en/actions/how-tos/create-and-publish-actions/manage-custom-actions>




Also Readme with instructions etc.

#### Resolved Task <a name="583810de-af44-4ddb-83c8-77bf7d211c3e"></a> 
Fix mobile images with Shots tool also.

#### Resolved Task <a name="706bffdc-8737-4cd8-b847-d8fad243a9ac"></a> 
Check out what Github did <https://github.com/marketplace/actions/add-to-github-projects>

#### Resolved Task <a name="3c3e84c7-b545-4447-ac1c-ecef30b156d9"></a> 
See <https://github.com/actions/add-to-project> - so would be Uclusion/update-job etc. However this is TypeScript. For Python they have <https://github.com/cicirello/python-github-action-template/blob/main/entrypoint.py>




Unless going to rewrite the CLI Python makes more sense as can share code and so can anyone changing the action.




**However choices are Javascript or Docker - so either need a way for Docker to be ubuntu-latest or have to use Javascript - see** <https://docs.github.com/en/actions/concepts/workflows-and-actions/custom-actions> - composite just means runs on the users runner.




    # Dockerfile

    FROM ubuntu:latest



    # Install any necessary dependencies for your action

    RUN apt-get update && apt-get install -y \

    git \

    curl \

    # Add other tools/packages your action needs

    && rm -rf /var/lib/apt/lists/*



    # Copy your action's script into the container

    COPY entrypoint.sh /entrypoint.sh



    # Set execute permissions for the script

    RUN chmod +x /entrypoint.sh



    # Define the entrypoint for the action

    ENTRYPOINT ["/entrypoint.sh"]

#### Resolved Task <a name="641caf8d-6a5b-4c41-be70-cf3f04aec216"></a> 
1. Redo website starting from scratch with asking AI to copy a site - provide the screenshots and video to the AI also. **Actually no need to be so dramatic - can have AI create section by section in classes it creates from scratch.**
2. ~~Move Uclusion to Github Actions~~
3. ~~Expand CLI to allow easily moving tickets to completion based on build reaching production - make this flexible so they can track dev, stage, prod - maybe is already tasks complete and just entering a new label~~
4. CLI and UI as peers on landing page
5. ~~Risk free in pricing section talks about ability to use CLI to export and so not trapped (not price)~~
6. ~~Consider dropping the above the fold subtext altogether.~~
7. ~~Change team price to $5.99 (Teamcamp and Google Workspace are 6) as $1 looks weird~~

> ##### Subtask <a name="0a87decf-1127-498d-86fd-4bf65a7aa1a8"></a> 
Comparison section is too much reading.

#### Resolved Task <a name="70886cd4-e7e5-485d-b4d9-676a1344d1e0"></a> 
Toy with shades of grey where have two colors of blue in the main app - again like Teamcamp - to see how does.




**Note Github projects is the same grey and white.**




**The third color for the job nav is jarring so either way it must go - can make it the same as left nav.**

#### Resolved Task <a name="ff53a35c-eabd-4d15-9b43-438e110eda91"></a> 
First one picture of TODO in code with | and then comment becomes and the one with ticket code filled out.

#### Resolved Task <a name="f5b9bd50-a8fa-442e-8b2c-d3de1c25db8d"></a> 
Drop the floating Suggestion thing on above the fold.

#### Resolved Task <a name="1801d8e0-c3b5-4971-9ea3-ea39db69ffdc"></a> 
Examine <https://github.com/marketplace/actions/todo-actions>

#### Resolved Task <a name="ec6357f1-db79-4b1f-b080-0d6501892bee"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8f82d609-4a2b-4a2c-92b6-dc37fa2d9723.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




List on <https://shipahe.ad/> - maybe can use one of these somehow.

#### Resolved Task <a name="033abfe8-7098-4978-97eb-5551b1fd6c34"></a> 
Change the demos to include labels for where the completed tasks jobs are - dev, stage, or prod.

> ##### Subtask <a name="e65e9989-298a-4f5f-913c-8485f428b83c"></a> 
Remove usage of label for review from the demo scripts.

#### Resolved Task <a name="6ea858c5-528b-47e5-8bc4-01c4f89b45e9"></a> 
Need to pay attention to date of commit versus date of current label so don't overwrite.




**Model change - store label_list as string, date pairs and only display the latest. Change API to only add labels not existing already and always add to the existing labels instead of overwriting them.**

#### Resolved Task <a name="0fe21b27-9887-43a6-8d65-07fa74974225"></a> 
    import requests



    # Replace with your GitHub access token and repository details

    ACCESS_TOKEN = "YOUR_GITHUB_ACCESS_TOKEN"

    REPO_OWNER = "YOUR_REPO_OWNER"

    REPO_NAME = "YOUR_REPO_NAME"

    SEARCH_TEXT = "your_search_term"



    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}



    # 1. Get the latest release

    releases_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/latest"

    response = requests.get(releases_url, headers=headers)

    response.raise_for_status() # Raise an exception for bad status codes

    latest_release = response.json()

    latest_release_commit_sha = latest_release["target_commitish"] # or tag_name, depending on your release setup



    # 2. (Optional) Get the previous release's commit SHA for a range

    # If you want to search commits *since* the last release, you'd find the previous release's SHA here.

    # For simplicity, this example will search all commits up to the latest release.



    # 3. Fetch commits up to the latest release

    # You might need to paginate if there are many commits

    commits_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/commits?sha={latest_release_commit_sha}"

    response = requests.get(commits_url, headers=headers)

    response.raise_for_status()

    commits = response.json()



    found_commits = []

    for commit in commits:

    commit_sha = commit["sha"]

    commit_message = commit["commit"]["message"]



    # Fetch detailed commit information to get diff (if needed for searching within code changes)

    # commit_detail_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/commits/{commit_sha}"

    # detail_response = requests.get(commit_detail_url, headers=headers)

    # detail_response.raise_for_status()

    # commit_detail = detail_response.json()

    # commit_files = commit_detail.get("files", []) # List of files changed in the commit



    # 4. Search for the text

    if SEARCH_TEXT.lower() in commit_message.lower():

    found_commits.append({"sha": commit_sha, "message": commit_message})

    # You could also search within the content of changed files if you fetched commit_detail and processed the diffs.



    if found_commits:

    print(f"Found '{SEARCH_TEXT}' in the following commits associated with the latest release:")

    for commit in found_commits:

    print(f"- {commit['sha']}: {commit['message']}")

    else:

    print(f"'{SEARCH_TEXT}' not found in commits associated with the latest release.")




without PyGithub seems much better than with. Unless <https://pygithub.readthedocs.io/en/latest/github_objects/Repository.html#github.Repository.Repository.get_commits> gets just commits for that release when give it sha and below is wrong?

    from github import Github



    # Replace with your GitHub personal access token

    GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"

    # Replace with the owner and repository name

    REPO_OWNER = "owner_username"

    REPO_NAME = "repository_name"



    try:

    # Authenticate with GitHub

    g = Github(GITHUB_TOKEN)



    # Get the repository

    repo = g.get_user(REPO_OWNER).get_repo(REPO_NAME)



    # Get the latest release

    latest_release = repo.get_latest_release()



    print(f"Latest Release: {latest_release.title} (Tag: {latest_release.tag_name})")



    # Determine the commit SHA for the current release tag

    release_commit_sha = latest_release.commit.sha



    # Find the previous release to determine the commit range

    # This example assumes a linear history between releases.

    # More complex scenarios (e.g., merges, rebase) might require

    # more sophisticated commit history analysis.

    all_releases = sorted(repo.get_releases(), key=lambda r: r.created_at, reverse=True)

    previous_release_commit_sha = None

    for i, release in enumerate(all_releases):

    if release.tag_name == latest_release.tag_name and i + 1 < len(all_releases):

    previous_release_commit_sha = all_releases[i+1].commit.sha

    break



    if previous_release_commit_sha:

    print(f"Commits included in '{latest_release.title}' (from {previous_release_commit_sha} to {release_commit_sha}):")

    # Get commits between the previous release and the latest release

    # This will fetch commits on the default branch between the two SHAs

    commits = repo.get_commits(sha=repo.default_branch, since=repo.get_commit(previous_release_commit_sha).commit.author.date)



    for commit in commits:

    # Only include commits up to the latest release commit

    if commit.sha == release_commit_sha:

    print(f"- {commit.commit.message}")

    break # Stop after reaching the latest release commit

    print(f"- {commit.commit.message}")

    else:

    print("Could not find a previous release to determine the commit range.")

    print("Displaying commits from the latest release commit backwards until a suitable stopping point (e.g., initial commit).")

    # If no previous release, iterate backwards from the latest release commit

    commits = repo.get_commits(sha=release_commit_sha)

    for commit in commits:

    print(f"- {commit.commit.message}")



    except Exception as e:

    print(f"An error occurred: {e}")

#### Resolved Task <a name="b98521f0-9a17-49c6-a897-eac81f584615"></a> 
Follow <https://docs.github.com/en/actions/how-tos/create-and-publish-actions/publish-in-github-marketplace>

#### Resolved Task <a name="ef42f18a-dab8-4955-ade0-f15c1d1a39d7"></a> 
Just look at project management verified <https://github.com/marketplace?verification=verified_creator&category=project-management&type=actions>

#### Resolved Task <a name="ff2db5a5-4e5f-4096-be40-60d23beeaefb"></a> 
Script for the video:




1. Action that triggers on commit and moves forward jobs based on commit descriptions - **No point in doing this for tasks as no advantage.**
2. Action that triggers on release and creates labels based on commit descriptions.
3. Run the CLI as now if want to update TODOs and Uclusion text files in your repo - **otherwise too messy as would have to update files for you without you getting a chance to stop.**
4. **Also the export runs from command line - can just show the CSV file it produces if don't want to wait for it in real time.**





**That's already a long movie so have to skip the demo part and just show what was already setup working. Include the files that make it work to show simple.**

#### Resolved Task <a name="7c606879-1357-4583-bcbb-c2ef59b27c64"></a> 
Examine <https://github.com/marketplace/actions/attach-pull-request-to-asana-task> which is marked verified by Github - also useless similar to below




<https://github.com/marketplace/actions/add-comment-to-asana-task> - official Asana but is about pull request notifications to collaborators - fairly useless as you can do this in Github better

#### Resolved Task <a name="d24cc702-daa6-4c07-9f82-4a9da99568e5"></a> 
Under collaboration tab on landing page the blocking screenshot is too large - include more of the tab on etc. to make reasonable size.

#### Resolved Task <a name="014c9173-30c6-4f51-b3f4-fb15ba6dcf03"></a> 
Integrations should be open by default for a real market - just not for support or demo.

> ##### Subtask <a name="0c6f6870-cda5-4a87-af70-d3b3d7d438c2"></a> 
 State should be dependent on market id. True for Views and Collaborators folders also.

#### Resolved Task <a name="4c424859-c0b8-44c5-a9ca-599ee577f67e"></a> 
Fix margins at intermediate sizes.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/aeb957b7-e349-40aa-8ea2-7255b9882949.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task <a name="c61faa39-3f76-4d8f-9539-ddab028b66a5"></a> 
Problem: if it's the last task do you have to put job and task in commit?




Problem: if you show copy task by clicking number and putting into commit isn't that awkward enough to mess up the video? **Could have just hit resolve at this point - then the only real advantage is the labels that show the release? - though that is cool.**

#### Resolved Task <a name="8e1df7b0-cbe9-4fb4-8c9b-f25e942e1f00"></a> 
Try out Zenhub.

#### Resolved Task <a name="3849f0b1-fa75-497c-96c4-d09e497afb97"></a> 
Drop the Organization tab diagram or figure out a way to make it nice or something.

> ##### Subtask <a name="f8b5f66b-1b19-4668-8317-1d7a04347db8"></a> 
See if can do an animation to show the logical data model. Maybe even Powerpoint can handle it.

#### Resolved Task <a name="862145a1-a796-4296-b2f9-a26edf1434e0"></a> 
S**top using labels for showing progress report** (which is dumb anyway). Use comment as done with in progress task.

> ##### Subtask <a name="1b7a2afb-cf97-42ca-8ceb-493b35600569"></a> 
There will also have to be activity logs / labels for each comment that display below them.

#### Resolved Task <a name="34286b40-ee3e-4e6d-b8ed-e80aedcc756f"></a> 
UI important cause Github bugs already has all of this <https://timheuer.com/blog/use-github-actions-for-bulk-resolve-issues/>




So have to look very hard at why a maker shouldn't just use Github projects.




**Try using them yourself on developer stuff repo and see how goes.** <https://github.com/orgs/Uclusion/projects/2> **Also see if can use straight issues on a private repo.**




Github projects and built in like Zenhub are the competition for single user - see comparison section there <https://www.zenhub.com/> and maybe redo ours to be more like that.

#### Resolved Task <a name="0c8728fe-e15b-42c0-a898-abe7fa20f256"></a> 
Either like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/704cb9f6-8e30-44c6-9aea-122ad3c536b1.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

or like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/5558150b-5bdc-4232-a915-bbb520b34a66.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Search for term Chromium window and make the above the fold screenshots use them.

> ##### Subtask <a name="d9cd8d64-8521-4b19-8a9d-8cd2f8a35aad"></a> 
Use <https://shots.so/> with Chrome, 3:2, url production.uclusion.com, background the same as landing page, and crop screenshot from that of 1647:936 size.

#### Resolved Task <a name="1bd62d16-af9c-4d39-8b4a-601034fa9d95"></a> 
So layout can be like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/65f894a5-33f2-470b-a2ee-cf548acf61b7.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




with title "The CLI you never knew but always wanted" and subtitles, "Job and bug creation from code TODOs", "Status report in Github flavored markdown", "Github actions that track feature deployment".




First one picture of TODO in code with | and then comment becomes and the one with ticket code filled out.

Second one picture of report table of contents and in verbiage below subtitle have link to Uclusion's report.

Third one showing snippet of how easy to use Github action is with link to the action repos.

#### Resolved Task <a name="cf171b90-8012-42b3-a06e-83bcd119cdf4"></a> 
Explain only goes as far back as tasks complete age show in readme and docs.




**Link the docs into the readme in the Github actions. Make sure form of commit message obvious and that can click button to get.**

#### Resolved Task <a name="5eddccf3-0a06-4b4d-8d0a-e71065277034"></a> 
Third one showing snippet of how easy to use Github action is with link to the action repos.

#### Resolved Task <a name="0ef8dcf9-5cec-4520-8936-049ffd1e1118"></a> 
Easy to have action on initial commit that resolves the task or job. Not easy to know which commits are in a release. According to AI "github actions know all commits in a release" - you have to know the previous release and then find all commits between that release and the one being promoted. In this case you search all since that release **assuming that is cheaper than just searching all for ticket codes. Cause finding the previous release for a particular environment requires some searching also.**




**Teamcamp got around this by using the release description only but that is lame.**




**There is all sorts of stuff like this in Github actions** <https://github.com/WyriHaximus/github-action-get-previous-tag> so let them worry about it though you can of course give an example from what Uclusion does.




Then just

# List commits between the previous release and the current release tag

git log --pretty=format:"%h - %s" $PREVIOUS_RELEASE_TAG..${{ github.event.release.tag_name }}




and search that for ticket codes.

#### Resolved Task <a name="5ff25c14-f257-4d75-af9e-c06cf043ca64"></a> 
Make the link one button and the short code display a different button and have the latter put in a full commit description with job name and short code. **Remove or escape any " marks.**

#### Resolved Task <a name="d1322194-7d84-430b-abcc-a545d1dae833"></a> 
Mobile also needs margins.

#### Resolved Task <a name="abca59df-c0e4-42fe-8afa-916eb4140ed2"></a> 
Second one picture of report table of contents and in verbiage below subtitle have link to Uclusion's report.

#### Resolved Task <a name="12720958-8305-495b-9781-056282c5a1a2"></a> 
Fix documention.

## Job <a name="75ad865e-a3a7-4d48-9703-e9a900f8ff72"></a>
### Main page beautification.
#### Resolved Task <a name="1cac1e19-a591-49c9-be0d-7896ee471946"></a> 
Icon only Next button on mobile IE arrow with white button around it.

#### Resolved Task <a name="178dd41e-49f2-449a-bb3e-5baeb5e5ef28"></a> 
Consider making action buttons match Next button IE more rounded and no blue edge - but not a bleeder.

#### Resolved Task <a name="0ae5f3cf-f132-4572-bfc4-afdeb01bfcf6"></a> 
Get horizontal and vertical aligning of all stage investible headers correct. Can use AI if put them in their own component and specify.




Also add a bit more space above the stage investible header.

#### Resolved Task <a name="e6ba299a-e8d0-4139-b3f4-ff17f5316e65"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/92f32e1d-a31b-4c53-a869-3a80d59b789a.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

When there are no in progress tasks there is not enough space below the title.




Also not enough space above the title when have open tasks - add bottom margin to the chips.

#### Resolved Task <a name="fbd9a7ea-c03b-44cb-b164-8f2976209c8a"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e3491e33-1b41-4f4f-8408-8b0fb5caa645.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Schedule icon somehow outside the centering.

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

