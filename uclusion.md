| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [CLI TODO fixes](#cli-todo-fixes)| [Import / Export strategy and script.](#import-/-export-strategy-and-script.)| 11/29| [Python 3.9 end of life - problem is that layers and Lambda runtime must match...](#python-3.9-end-of-life---problem-is-that-layers-and-lambda-runtime-must-match...)|  |
| [Button on the question that generates AI prompt onto the clipboard.](#button-on-the-question-that-generates-ai-prompt-onto-the-clipboard.)| | | [See if React now supports a better way to keep a websocket open - otherwise...](#see-if-react-now-supports-a-better-way-to-keep-a-websocket-open---otherwise...)| Deployed to stage |
## Job
### CLI TODO fixes

#### Task
Have drop down for view selection on IntegrationPreferences.js. Just copy the one done for job side panel.

#### Task
viewId should be todoViewId as not used otherwise.

## Job
### Import / Export strategy and script.
Users for this feature:

1. Need export not to be locked in
2. ~~Want to work mostly in their Idea~~ - if you finish a task then commit and then you have to refresh with CLI and then the task is gone - that's a ridiculous flow and no upside really as can't put in progress etc.
3. ~~Like having AI suck in this meta info~~ - for what? and could use a button that removes or not removes pictures from Uclusion anyway
4. Want to check in this file and provide status or get feedback that way instead of inviting an observer to Uclusion - for team they would choose some team view. -<https://mui.com/material-ui/discover-more/roadmap/> - so they do in fact share their project board <https://github.com/orgs/mui/projects/23/views/12> does this feature give us parity with that?





See <https://github.github.com/gfm/> for the Github version of markdown.

#### Task
Have to be able to add a label from the UI cause could have multiple repos or just forget to check in with ticket code.




The label input shows up only in done and is always to create a new label from scratch - no edit. So call it "New label" and it always shows even when there is a label. 




Which means show label also on side panel as always should have - plenty of room.

#### Task
On CLI integration page correct the examples etc.

#### Task
In documentation explain how to use views and is public so that only what you want to show displays.

## Job
### <a name="tith"></a> Button on the question that generates AI prompt onto the clipboard.
Probably skipping pictures and file attachments.

#### Task
This button should produce markdown as <https://github.com/microsoft/markitdown> claims it is native to LLMs. Furthermore need the same markdown with token included image URLs that getting for public status report.

#### Task
Button on the question that generates AI prompt onto the clipboard. Probably skipping pictures and file attachments.

## Job
### Python 3.9 end of life - problem is that layers and Lambda runtime must match...
...so seems all or nothing.




html-to-markdown requires 3.10.

## Job
### See if React now supports a better way to keep a websocket open - otherwise...
...these changes outside the UI could bite.

