| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| [Website feedback.](#f577ab3a-9234-4f4d-af83-ed7aa1b25fce)| 12/12| [Fix documentation for CLI - code todos, report markdown, and export.](#310a063e-441f-4412-9d89-0b07f8fc4627)| Deployed to production |
| [Button on the question that generates AI prompt onto the clipboard.](#436e8e41-b8c4-4c73-8818-4d563a81ca44)| | | [Python 3.9 end of life - problem is that layers and Lambda runtime must match...](#d7c2f7ff-b9b2-4241-8fc7-e724d6a544ec)| Deployed to production |
| | | | [CLI TODO fixes](#927f8039-c23a-427e-86e6-2f40100adc33)| Deployed to production |
| | | | [Import / Export strategy and script.](#8c6374e6-2b2c-4b08-abdd-b6bec66c4f69)| Deployed to production |
| | | | [See if React now supports a better way to keep a websocket open - otherwise...](#0119ab37-b6ed-432e-a05b-5a91e8e02393)| Deployed to production |
## Job <a name="f577ab3a-9234-4f4d-af83-ed7aa1b25fce"></a>
### Website feedback.
From various sources.

#### Task
[Same three use cases but present like https://www.brkaway.co/ does with their...](/dialog/dd56682c-9920-417b-be46-7a30d41bc905/f577ab3a-9234-4f4d-af83-ed7aa1b25fce#option92b659f9-03c1-4d6c-9f9b-1156ca37c770)




Cases are link job, link code Todo, and export data. Give AI a shot at copy style- make sure set model first and use @




<https://wanderlog.com/> also has features section with a grid of features that can be considered.

#### Task
Fix mobile images with Shots tool also.

#### Task
Fix margins at intermediate sizes.

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/aeb957b7-e349-40aa-8ea2-7255b9882949.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='544' />

> ##### Subtask
Mobile also needs margins.

## Job <a name="f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f"></a>
### Better archive.



1. Move archive to left nav and make it per workspace
2. Add a group drop down
3. Split out objects in tabs - Tasks Complete, Not Doing, Bugs, Discussion

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8120554f-18cb-4c1f-900a-966cb2d9bd8e.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='384' />

Some freaky text stuck in corner.

#### Task
Add to solo demo archived stuff in all categories so can test.

#### Task
Show tasks complete as paginated rows as with backlog.

#### Task
Also need counts from search on other views for anything not showing in the current view (when autonomous).

#### Task
Change sub text on archive to say archive instead of group archive.

## Job <a name="436e8e41-b8c4-4c73-8818-4d563a81ca44"></a>
### Button on the question that generates AI prompt onto the clipboard.
Probably skipping pictures and file attachments.

#### Task
This button should produce markdown as <https://github.com/microsoft/markitdown> claims it is native to LLMs. Furthermore need the same markdown with token included image URLs that getting for public status report.

#### Task
Button on the question that generates AI prompt onto the clipboard. Probably skipping pictures and file attachments.

## Job <a name="310a063e-441f-4412-9d89-0b07f8fc4627"></a>
### Fix documentation for CLI - code todos, report markdown, and export.
## Job <a name="d7c2f7ff-b9b2-4241-8fc7-e724d6a544ec"></a>
### Python 3.9 end of life - problem is that layers and Lambda runtime must match...
...so seems all or nothing.




html-to-markdown requires 3.10.

## Job <a name="927f8039-c23a-427e-86e6-2f40100adc33"></a>
### CLI TODO fixes

## Job <a name="8c6374e6-2b2c-4b08-abdd-b6bec66c4f69"></a>
### Import / Export strategy and script.
Users for this feature:

1. Need export not to be locked in
2. ~~Want to work mostly in their Idea~~ - if you finish a task then commit and then you have to refresh with CLI and then the task is gone - that's a ridiculous flow and no upside really as can't put in progress etc.
3. ~~Like having AI suck in this meta info~~ - for what? and could use a button that removes or not removes pictures from Uclusion anyway
4. Want to check in this file and provide status or get feedback that way instead of inviting an observer to Uclusion - for team they would choose some team view. -<https://mui.com/material-ui/discover-more/roadmap/> - so they do in fact share their project board <https://github.com/orgs/mui/projects/23/views/12> does this feature give us parity with that?





See <https://github.github.com/gfm/> for the Github version of markdown.

## Job <a name="0119ab37-b6ed-432e-a05b-5a91e8e02393"></a>
### See if React now supports a better way to keep a websocket open - otherwise...
...these changes outside the UI could bite.

