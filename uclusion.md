| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [ Backend issues](#j-all-195)| [Handling of notes](#j-all-318)| 07/18| [When Claude comes up it checks for new work.](#j-all-327)|  |
| [AI ready tech debt.](#j-all-315)| | | [CLI multi-line comment support.](#j-all-214)| Deployed to production |
| [Fix support workspace stuff:](#j-all-189)| | | [Bugs B-all-446](#j-all-317)| Deployed to production |
| [Search issues](#j-all-328)| | | [Front end AI ready](#j-all-310)| Deployed to production |
| [Other technical debt.](#j-all-30)| | | [Better drag and drop on swimlanes.](#j-all-322)| Deployed to production |
| [Uclusion memory hogging part two](#j-all-116)| | | [Bugs B-all-454, B-all-453, B-all-452, B-all-451, B-all-450, T-all-2104,...](#j-all-323)|  |
| | | | [Bugs B-all-440, B-all-439, B-all-438](#j-all-313)| Deployed to production |
| | | | [More with notes.](#j-all-308)| Deployed to production |
| | | | [Better install](#j-all-320)| Deployed to production |
| | | | [Better UI.](#j-all-321)| Deployed to production |
| | | | [Has to be a way to tell users to run install again for the AI stuff.](#j-all-314)| Deployed to production |
| | | | [AI ready front end.](#j-all-326)|  |
| | | | [Marketing feedback.](#j-all-319)|  |
| | | | [Some critical bugs for AI](#j-all-316)| Deployed to production |
| | | | [More AI integration issues.](#j-all-311)|  |
| | | | [Opening certain wizards inside their containers.](#j-all-325)| Deployed to production |
| | | | [More AI integration stuff.](#j-all-312)|  |
#### Tasks 
#### Bug B-all-341<a name="b-all-341"></a>  
The drag and drop image is sometimes far away from the hand mouse icon.

#### Bug T-all-1852<a name="t-all-1852"></a>  
After go to view from job action, go to the my work view if the user has one and the job is in it.

#### Bug B-all-121<a name="b-all-121"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/5777fd87-78b0-4266-86d0-6c496d1ccec6.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Don't show inactive groups (by UI definition of inactive) and only shows actions that had some affect - maybe when you call markets service it tells you if the operation did anything or maybe screen out by doing get first and comparing.

#### Bug T-all-2194<a name="t-all-2194"></a>  
When lists existing options while creating a new one can't open them - that's just frustrating and not how it works for other stuff.

#### Bug T-all-1344<a name="t-all-1344"></a>  
Currently no notification if you are removed from a view.

#### Bug B-all-195<a name="b-all-195"></a>  
[mention:USER] doesn't work because we store this way:

```
<p><span class="mention" data-denotation-char="@" data-external-id="0cddb21a-5a77-47c5-8cc9-f8f39337ff08" data-id="7a259d50-add2-452e-bd3f-1f9ca4527c71" data-index="0" data-value="John Doe">﻿<span><span class="ql-mention-denotation-char">@</span>John Doe</span>﻿</span> show me what this looks like when stored.</p>
```

That could be fixed as there is already some post processing in uclusion_investible_api/handlers/get_market_comments.py

```
def post_validation_function(event, data, context, validation_context):
```

```
market_capability = validation_context['market_capability']
```

```
comment_ids = validation_context['comment_ids']
```

```
comments = invoke_lambda(marketsServicePrefix + 'comments_get', market_capability, {'comment_ids': comment_ids})
```

```
for comment in comments:
```

```
updated_by = comment.get('updated_by')
```

```
comment['updated_by_you'] = updated_by == validation_context['user_id']
```

```
return comments
```

That would also fix the very small non demo bug that would happen if someone mentioned a pending user or a user name changes.

#### Bug B-all-212<a name="b-all-212"></a>  
```
export function poll(dispatch, accountVersion, userVersion) {
```

```
// TODO: need to try again after interval if this doesn't work but also needs to respond to await so tough
```

```
return getLogin(true, accountVersion, userVersion).then((loginInfo) => {
```

```
if (loginInfo) {
```

```
console.log('In poll after login');
```

```
const { account, user } = loginInfo;
```

```
const { version: founderUserVersion } = user;
```

```
const { version: founderAccountVersion } = account;
```

```
if ((accountVersion === undefined || accountVersion <= founderAccountVersion)
```

```
&& (userVersion === undefined || userVersion <= founderUserVersion)) {
```

```
dispatch(accountAndUserRefresh(fixDates(account), user));
```

Need to review how get past needs onboarding in case of an error or something. Preferably keep polling at some rate till reach demo created or first market joined. **Also unclear why demo market not being loaded anyway when still in needs onboarding - is that turned off somewhere for that state?**

#### Bug B-all-190<a name="b-all-190"></a>  
Recovery of suggestion or question there if aborted previously but not delete if don't want to continue. Also should extend using is_sent to other types of comments instead of just using local storage for them.

Lack of ability to cancel out a question you hit add options on but didn't add any options is annoying.

#### Bug B-all-425<a name="b-all-425"></a>  
GLOBAL_CAPABILITY_SECRET_KEY is apparently too small and is producing warnings.

#### Bug B-all-314<a name="b-all-314"></a>  
```
modules.mention = {
```

```
isolateCharacter: true,
```

```
dataAttributes: ['id', 'value', 'denotationChar', 'link', 'target', 'externalId'],
```

```
positioningStrategy: 'fixed',
```

```
renderItem: function (item) {
```

```
// we want an html string here which gets slammed into inner html, so we have to do some trickery
```

```
// to let react render the result
```

```
return ReactDOMServer.renderToString(<MentionListItem mentionResult={item}/>);
```

```
},
```

This trick results in mentions not having the circled initials form avatar when there is no configured gravatar.

#### Bug T-all-884<a name="t-all-884"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c0b8b72a-8527-49d5-952e-e9f36d1f458a.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Still issues with scrolling implementation plus not supported on Firefox.

#### Bug B-all-322<a name="b-all-322"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/5223543a-b019-4aba-a5e3-0e1e10369e04.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Make sure this cannot happen.

#### Bug B-all-396<a name="b-all-396"></a>  
Make tab ids not depend on tab title.

#### Bug B-all-150<a name="b-all-150"></a>  
Addressed logic is messed up in async:

if old_quantity == new_quantity:

object_type = 'addressed'

    if new_record.get('abstain', False):

market_capability = get_machine_capability(market_id)

market, investible, market_investible = get_market_and_investible(market_id,

market_investible_id)

        if investible is not None:

comments = get_investible_comments(market_capability, investible['id'])

remove_investible_notifications(market_id, investible['id'], comments)

    elif new_record.get('deleted', False):

handle_investible_addressed(user_id, market_id, market_investible_id)

At a minimum that should not be removing investible notifications for everyone - just the user but nothing here seems to make sense.

#### Bug T-all-1821<a name="t-all-1821"></a>  
When already have a demo and accept invite the demos are not quick removed. See logic with use of changeBanStatus.

**Also** when invited to demo market and create a new workspace the demo market invited to is not removed on back end.

#### Bug T-all-1825<a name="t-all-1825"></a>  
Editing a view name sends a job edited notification <http://localhost:3000/inbox/UNREAD_NAME_ddd3de50-d1a3-45c3-977e-780802642d12> and shouldn't send anything.

#### Bug T-all-2211<a name="t-all-2211"></a>  
Spacing on buttons fills so remove all large and xLarge from wizards except where actually worth it.

#### Bug B-all-392<a name="b-all-392"></a>  
Mouse stops changing from arrow when hover after a while. Then even reload doesn't fix - have to start over in fresh tab to restore mouse changing.

#### Bug T-all-2193<a name="t-all-2193"></a>  
Reducing the size of the Quill editor makes getting Wiziwig with the created comment harder. That is the same for GMail but at least consider making edit existing comment the same size.

**See what Gmail does with picture size and copy.**

#### Bug T-all-437<a name="t-all-437"></a>  
We are suffering <http://www.menucool.com/McMenu/prevent-page-content-zooming-on-mobile-orientation-change> but when tried their page on my iPhone it still had the issue. We can revisit maybe if iPhone doesn't fix.

#### Bug B-all-330<a name="b-all-330"></a>  
When move to backlog for any reason, including banning, make sure estimate changed notification removed:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/fc30585e-4f44-4326-a833-268742cdba63.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Assistance 
#### Suggestion T-all-1704<a name="t-all-1704"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/1598dba0-a83d-4a6b-8439-e2584770dac8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Task is resolved but no strikethrough on link name. This was either never there or removed in a way that can't find it. If wanted to do it probably the code goes in MyLink.

## Job J-all-195<a name="j-all-195"></a>
###  Backend issues
Otherwise async spins forever and costs money. No schedule investible for demo markets was supposedly done but seems not (see schedule table).


This job is in stage Further Work.
#### Tasks 
#### Task T-all-1632<a name="t-all-1632"></a>  
Over 30K investible infos on stage - they are not getting deleted.

#### Task T-all-1633<a name="t-all-1633"></a>  
Notifications table is also not getting cleaned - over 50K.

#### Task T-all-2099<a name="t-all-2099"></a>  
```
4212:/aws/lambda/uclusion-websockets-dev-subscribeHandler 2026/05/24/[$LATEST]2aaec6c659064b87a56026d1027d2c5d [ERROR] ExpiredSignatureError: Signature has expired
```

```
4371-Traceback (most recent call last):
```

```
4406-  File "/var/task/handlers/subscribe.py", line 20, in subscribe
```

```
4472-    if not begin_connection_tracking(connection_info, payload):
```

```
4540-  File "/var/task/utils/websocket_utils.py", line 55, in begin_connection_tracking
```

```
4625-    external_id = get_external_id(payload)
```

```
4672-  File "/var/task/utils/websocket_utils.py", line 73, in get_external_id
```

```
4747-    return get_external_id_for_token(identity_token)
```

```
4804-  File "/opt/python/lib/python3.10/site-packages/ucommon/capabilities/capability_marshaller.py", line 63, in get_external_id_for_token
```

```
4941-    claims = parse_capability(id_token)
```

```
4985-  File "/opt/python/lib/python3.10/site-packages/ucommon/capabilities/capability_marshaller.py", line 46, in parse_capability
```

```
5113-    raise e
```

```
5129-  File "/opt/python/lib/python3.10/site-packages/ucommon/capabilities/capability_marshaller.py", line 38, in parse_capability
```

```
5257-    decoded = jwt.decode(capability_string, secret_key, algorithms=capability_algorithm)
```

```
5350-  File "/opt/python/lib/python3.10/site-packages/jwt/api_jwt.py", line 368, in decode
```

```
5438-    decoded = self.decode_complete(
```

```
5478-  File "/opt/python/lib/python3.10/site-packages/jwt/api_jwt.py", line 275, in decode_complete
```

```
5575-    self._validate_claims(
```

```
5606-  File "/opt/python/lib/python3.10/site-packages/jwt/api_jwt.py", line 408, in _validate_claims
```

```
5704-    self._validate_exp(payload, now, leeway)
```

```
5753-  File "/opt/python/lib/python3.10/site-packages/jwt/api_jwt.py", line 511, in _validate_exp
```

```
5848:    raise ExpiredSignatureError("Signature has expired")
```

Getting this on uclusion-websockets-dev-subscribeHandler in production which should be impossible since code should check state of token before using it.

#### Task T-all-2127<a name="t-all-2127"></a>  
Stage notifications table has 47,991 entries - most likely test data not getting cleared. Can confirm by checking the number on production - if it is high then the problem is demo and if not it is test data.

71,662 comments so likely its not just notifications - things are not getting deleted.

#### Task T-all-1711<a name="t-all-1711"></a>  
The bundle size is significantly larger than recommended.

Consider reducing it with code splitting: <https://goo.gl/9VhYWB>

You can also analyze the project dependencies: <https://goo.gl/LeUzfb>

#### Task T-all-1565<a name="t-all-1565"></a>  
Seems demos are invalidated before creation cause get 404 on get demo till first demo created.

#### Task B-all-418<a name="b-all-418"></a>  
Clear notification_configs of demo users and don't create them to begin with. Tricky though unless we are going to disable changing configs in demo?

#### Task T-all-1564<a name="t-all-1564"></a>  
Demo markets not in use must be archived or not have async schedules.

## Job J-all-315<a name="j-all-315"></a>
### AI ready tech debt.

This job is in stage Accepted.
#### Reports 
#### Report R-all-271<a name="r-all-271"></a>  
Screenshots + archive cleanup are done and ready to look at. Captured via Playwright (installed locally, outside the build) against localhost:3000, logged in as disrael+01, in the demo workspace "UScript (demo solo)" / view "Testing".

**T-all-2229 — screenshots refreshed (content/en/):** - single-swimlane.png — dark mode (per Q-all-168), Job Progress swimlane, full window 3840×2160.
- select-bugs.png — Normal filter with two rows selected so the eject icon shows.
- after-search.png — search "backend" showing the "2 match" count on the Job Progress tab + the two results. Per Q-all-167 the Search page text now reads "Counts show for the views and tabs that contains search results." and the archive sentence is dropped.
- swimlane-configuration.png — intentionally NOT updated, per your call (config page differs only by color and may change again).

**C-all-1037 — archive section removed (per Q-all-166 / O-4):** - Deleted content/en/Views/archive.md (drops it from the Views nav).
- Re-shot view-outset.png so the three-dots view popup no longer shows the Archive link.
- Found and de-linked a now-dead [archive](/views/archive) reference in Views/Jobs/stages.md → plain-text "archive" (the statement is still true; only the page is gone).

**Verification:**`hugo` build passes (exit 0; only pre-existing config-deprecation warnings, unrelated). Archive page is no longer built, the Search text is updated, and there are no remaining links/refs to the old archive page or sentence.

**Not done (your call):** did not rebuild/redeploy the live docs site, and did not commit.

T-all-2229 and C-all-1037 are complete and safe to resolve. T-all-2155 (duplicate-key warnings) was left untouched — separate task I wasn't asked to do.

#### Tasks 
#### Task T-all-2155<a name="t-all-2155"></a>  
Various warnings in the dev logs.

> ##### Grouped task C-all-1039<a name="c-all-1039"></a> 


installHook.js:1 Warning: [JSS] Could not find the referenced rule "checked" in "PlanningAdd". Error Component Stack

at StageInvestible (PlanningIdeas.js:619:1)

at Stage (PlanningIdeas.js:445:1)

at VotingStage (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at PlanningIdeas (PlanningIdeas.js:111:1)

at div (<anonymous>)

at InvestiblesByPerson (InvestiblesByPerson.js:116:1)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at Screen (Screen.js:325:1)

at PlanningDialog (PlanningDialog.js:118:1)

at Dialog (Dialog.js:31:1)

at div (<anonymous>)

at div (<anonymous>)

at Root (Root.js:65:1)

at ThemeModeProvider (ThemeModeContext.js:11:1)

at AppConfigProvider (AppConfigProvider.js:4:1)

at WebSocketProvider (WebSocketContext.js:103:1)

at OnlineStateProvider (OnlineStateContext.js:7:1)

at LeaderProvider (LeaderContext.js:46:1)

at GroupMembersProvider (GroupMembersContext.js:15:1)

at MarketPresencesProvider (MarketPresencesContext.js:16:1)

at InvestiblesProvider (InvestiblesContext.js:48:1)

at CommentsProvider (CommentsContext.js:42:1)

at MarketsProvider (MarketsContext.js:23:1)

at CognitoUserProvider (CongitoUserContext.js:8:1)

at App (App.js:21:1)

at div (<anonymous>)

at IntlGlobalProvider (IntlGlobalProvider.js:13:1)

at injectIntl(IntlGlobalProvider) (<anonymous>)

at AppWithAuth (AppWithAuth.js:52:1)

at LocaleProvider (LocaleContext.js:9:1)

at MarketGroupsProvider (MarketGroupsContext.js:15:1)

at MarketStagesProvider (MarketStagesContext.js:16:1)

at NotificationsProvider (NotificationsContext.js:15:1)

at ScrollProvider (ScrollContext.js:23:1)

at OperationInProgressGlobalProvider (OperationInProgressG…balProvider.js:12:1)

at OperationInProgressProvider (OperationInProgressContext.js:30:1)

at DiffProvider (DiffContext.js:11:1)

at SearchResultsProvider (SearchResultsContext.js:11:1)

at SearchIndexProvider (SearchIndexContext.js:10:1)

at TicketIndexProvider (TicketIndexContext.js:21:1)

at AccountProvider (AccountContext.js:15:1)

at div (<anonymous>)

at Main (<anonymous>)

at A2HSComponent (<anonymous>)

> ##### Grouped task C-all-1041<a name="c-all-1041"></a> 


installHook.js:1 Warning: Transition uses the legacy childContextTypes API which is no longer supported and will be removed in the next major release. Use React.createContext() instead

.Learn more about this warning here: https://reactjs.org/link/legacy-context Error Component Stack

at AttachedFilesList (AttachedFilesList.js:148:1)

at PlanningInvestibleNav (PlanningInvestibleNav.js:89:1)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at div (<anonymous>)

at Screen (Screen.js:325:1)

at PlanningInvestible (PlanningInvestible.js:357:1)

at Investible (Investible.js:24:1)

at div (<anonymous>)

at div (<anonymous>)

at Root (Root.js:65:1)

at ThemeModeProvider (ThemeModeContext.js:11:1)

at AppConfigProvider (AppConfigProvider.js:4:1)

at WebSocketProvider (WebSocketContext.js:103:1)

at OnlineStateProvider (OnlineStateContext.js:7:1)

at LeaderProvider (LeaderContext.js:46:1)

at GroupMembersProvider (GroupMembersContext.js:15:1)

at MarketPresencesProvider (MarketPresencesContext.js:16:1)

at InvestiblesProvider (InvestiblesContext.js:48:1)

at CommentsProvider (CommentsContext.js:42:1)

at MarketsProvider (MarketsContext.js:23:1)

at CognitoUserProvider (CongitoUserContext.js:8:1)

at App (App.js:21:1)

at div (<anonymous>)

at IntlGlobalProvider (IntlGlobalProvider.js:13:1)

at injectIntl(IntlGlobalProvider) (<anonymous>)

at AppWithAuth (AppWithAuth.js:52:1)

at LocaleProvider (LocaleContext.js:9:1)

at MarketGroupsProvider (MarketGroupsContext.js:15:1)

at MarketStagesProvider (MarketStagesContext.js:16:1)

at NotificationsProvider (NotificationsContext.js:15:1)

at ScrollProvider (ScrollContext.js:23:1)

at OperationInProgressGlobalProvider (OperationInProgressG…balProvider.js:12:1)

at OperationInProgressProvider (OperationInProgressContext.js:30:1)

at DiffProvider (DiffContext.js:11:1)

at SearchResultsProvider (SearchResultsContext.js:11:1)

at SearchIndexProvider (SearchIndexContext.js:10:1)

at TicketIndexProvider (TicketIndexContext.js:21:1)

at AccountProvider (AccountContext.js:15:1)

at div (<anonymous>)

at Main (<anonymous>)

at A2HSComponent (<anonymous>)

> ##### Grouped task C-all-1040<a name="c-all-1040"></a> 
```
installHook.js:1 Warning: Encountered two children with the same key, `inboxGroupHeaderKey0fdff0fc-962b-41cf-ada4-1e32ae49dfe3`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. Error Component Stack
```

```
at div (<anonymous>)
```

```
at Inbox (Inbox.js:53:1)
```

#### Task T-all-2237<a name="t-all-2237"></a>  
The count of notifications on the bugs tab does not show notifications for replies to bugs.

#### Resolved 
#### Resolved Question Q-all-166<a name="q-all-166"></a>  
Grouped task C-all-1037 says "Remove the views/archive section as it no longer works that way." How much should I remove? Note that the archive is also documented on the **Search** page (uclusion-search.md), and the screenshot the Archive page uses (view-outset.png) is also reused by the Views index page's "Members" section — so I don't want to over-delete. Which scope do you want?

#### Option O-2<a name="o-2"></a>
#### Rewrite to current behavior
Keep Views/archive.md but replace the stale 'reachable from the three dots next to the view on the left nav' description (and its view-outset.png image) with however the archive is actually reached now. Requires you to tell me the new access path.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Trim the stale access bit only
Keep the page and its intro sentence about what shows in the archive, but remove just the part that says it's reached from the three dots on the left nav, plus the view-outset.png image on that page.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Remove the section and you will have to redo the view-outset.png also.

This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
The archive is no longer a link on the view outset so we don't want it to show that.

#### Option O-1<a name="o-1"></a>
#### Delete the archive page
Remove content/en/Views/archive.md entirely (drops it from the Views nav). The archive concept then remains documented only on the Search page, which already covers clicking through to the archive. The shared view-outset.png stays because the Views index Members section still uses it. This matches the literal 'remove the section' instruction.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
C-all-1037 literally says "Remove the views/archive section," and the archive concept is still documented on the Search page (clicking through to the archive), so deleting Views/archive.md loses no real information. view-outset.png stays because the Views index Members section still uses it. I'd only prefer a rewrite (O-2) if the archive page is meant to keep standalone documentation of a new access path — if so, tell me that path.

#### Resolved Task B-all-201<a name="b-all-201"></a>  
Tags not deleted problem is making builds incredibly slow. When create a new tag for an environment need to delete the older ones in that environment.

#### Resolved Report R-all-162<a name="r-all-162"></a>  
B-all-182 is done and resolved: the CI build now refreshes the browserslist database. `.github/workflows/reusableBuild.yml` runs `npx -y update-browserslist-db@latest` between `yarn install` and the build, which covers both stage and production deploys since both delegate to that reusable workflow. Details are in R-all-161. Verification on the next stage release is filed as S-all-70. B-all-201 (tag cleanup) was not started — it is not ready yet.

#### Resolved Question Q-all-168<a name="q-all-168"></a>  
For T-all-2229: the swimlane screenshot (single-swimlane.png) is the only one of the four in dark mode — bugs, search, and the view-outset popup are all light mode. When I refresh single-swimlane.png, should I keep it dark (a faithful refresh of the existing image) or switch it to light so all four Views screenshots share one theme?

#### Option O-2<a name="o-2"></a>
#### Switch to light mode
Re-shoot the swimlane in light mode so all four Views screenshots share one consistent theme. A small visual departure from the current doc, but more uniform.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Keep it dark mode
Reproduce single-swimlane.png in dark mode, matching the existing image. Most faithful to 'update the screenshot'; the swimlane stays a visually distinct hero shot while bugs/search/view-outset remain light.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Leaning keep-dark: "update the screenshot" most naturally means a faithful refresh, and the dark swimlane reads as a deliberate hero shot. But it's a genuine tradeoff — if you value one consistent theme across all four Views images more than fidelity to the old shot, light (O-2) is the better pick. The deciding factor is whether the dark swimlane was an intentional accent or just incidental.

> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
If switching to dark mode ends up being difficult then light mode will be fine also.

#### Resolved Task T-all-2229<a name="t-all-2229"></a>  
Update the swimlanes, bugs, and search screenshots in the documentation using login

disrael+01@uclusion.com / testing

on the already running server on localhost 3000.

> ##### Grouped task C-all-1037<a name="c-all-1037"></a> 
Remove the views/archive section as it no longer works that way.

#### Resolved Question Q-all-167<a name="q-all-167"></a>  
For the Search screenshot in T-all-2229: the Search page currently says "For the archive a panel opens showing the archive count as well and allowing clicking through to the archive." Since the archive "no longer works that way" (per C-all-1037), is this archive-via-search behavior — the panel, the archive count, and clicking through — still accurate, or did it change too? I want the refreshed after-search.png and its surrounding text to match the current app rather than just re-shooting the old framing.

> ##### Reply C-all-1038<a name="c-all-1038"></a> 
It should just say "Counts show for the views and tabs that contains search results." The sentence about the archive can be dropped.

#### Resolved Task S-all-70<a name="s-all-70"></a>  
On the next stage release, verify B-all-182 in the "Deploy UI" workflow log: the "Install dependencies & Deploy" step should show `update-browserslist-db` running after `yarn install`, and the subsequent `react-scripts build` output should no longer print the "Browserslist: caniuse-lite is outdated" warning.

#### Resolved Task T-all-2165<a name="t-all-2165"></a>  
Figure out if we should be living in agents.md <https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9> and fix if so.

#### Resolved Note R-all-161<a name="r-all-161"></a>  
Added `npx -y update-browserslist-db@latest` to `.github/workflows/reusableBuild.yml`, right after `yarn install` and before `npm run-script build`. Since both stage.yml and production.yml delegate to reusableBuild.yml, this single line covers both deploy environments. The command updates the caniuse-lite database in the runner's yarn.lock/node_modules so `last 1 chrome versions` in package.json resolves against current browser data at build time (the runner is ephemeral, so the lock file change does not need to be committed). The `-y` flag prevents any npx install prompt in CI. Local builds are intentionally unchanged — the issue was only in the CI build.

#### Resolved Task B-all-182<a name="b-all-182"></a>  
<https://github.com/browserslist/update-db#readme> - should just make this part of the web build.

## Job J-all-189<a name="j-all-189"></a>
### Fix support workspace stuff:
1. Suggestions just pile up in outbox as do switch to workspaces
2. Split across support + number scheme not easy for logging into correct one when want to reach a customer


This job is in stage Further Work.
#### Tasks 
#### Task T-all-2162<a name="t-all-2162"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/65ec5678-3e98-4e15-9b2a-05090a9bb585.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Need a naming scheme for Support like Support [First name] and also a way they don't pile up this much.

#### Task T-all-1369<a name="t-all-1369"></a>  
Split across support + number scheme not easy for logging into correct one when want to reach a customer

#### Task T-all-1370<a name="t-all-1370"></a>  
Suggestions just pile up in outbox as do switch to workspaces

## Job J-all-328<a name="j-all-328"></a>
### Search issues


This job is in stage Accepted.
#### Reports 
#### Report R-all-274<a name="r-all-274"></a>  
Both search bugs are fixed and ready to look at. Three files changed; lint passes.

T-all-2234 - short code did not navigate (src/utils/marketIdPathFunctions.js): getUrlForTicketCode uppercased the typed code but matched it against ticket keys that keep the original mixed-case (e.g. .../J-all-247), so codes with a lowercase segment like "all" never matched and fell through to text search. Now it compares case-insensitively. Proven with a standalone repro. Details in R-all-272.

T-all-2233 - counts right, items not displayed: the counts were already correct; matching items just weren't rendered during search.
- View level (Backlog.js): the Backlog search list now includes Not Doing matches, which the badge already counted.
- Job level (PlanningInvestible.js): the Open Tasks body now shows resolved matches during search, which the badge already counted (its countUnresolved search branch deliberately counts all). Details and the count-vs-display decision are in R-all-273.

These are UI behaviors with no automated tests, so I filed the manual verification steps as S-all-91 (job code navigation, Not Doing in backlog search, resolved tasks in a job's Open Tasks). Once those check out the two tasks are safe to resolve.

#### Tasks 
#### Task T-all-2235<a name="t-all-2235"></a>  
All notes show regardless of matching or not.

#### Task T-all-2236<a name="t-all-2236"></a>  
Jobs results need to be ordered by the date shown so that most recent is top.

#### Notes 
#### Note R-all-273<a name="r-all-273"></a>  
Per Q-all-170 the counts were already correct - the matching items simply were not rendered during search. Two display fixes:

View level (src/pages/Dialog/Planning/Backlog.js): the Backlog search badge counts furtherWorkReadyToStart + furtherWorkInvestibles + notDoingInvestibles (PlanningDialog.js:352-353), but during search the combined list deliberately excluded Not Doing. Now the search list also includes notDoingInvestibles, so the displayed list matches the badge.

Job level (src/pages/Investible/Planning/PlanningInvestible.js): the Open Tasks tab badge uses countUnresolved(todoCommentsSearched, search), whose search branch intentionally counts ALL matching todos including resolved, but the tab body rendered only the unresolved ones (openTodoCommentsSearched). Now during search the Open Tasks body shows all matching todos including resolved, matching its badge. Outside search the body is unchanged (open tasks only).

On the job-level fix I aligned the display to the count (show resolved) rather than the count to the display (drop resolved), because you described the count as correct and the countUnresolved search branch is a deliberate count-all design.

#### Note R-all-272<a name="r-all-272"></a>  
Fixed in src/utils/marketIdPathFunctions.js (getUrlForTicketCode).

Root cause: the function uppercased the typed code (J-all-247 -> J-ALL-247) but the ticket index keys preserve the code's original casing (`${marketId}/J-all-247`). The `endsWith('/J-ALL-247')` comparison therefore never matched any code with a mixed-case market segment like "all", so every short code fell through to the index text search instead of navigating to the job.

Fix: compare case-insensitively by uppercasing both the typed code and the candidate key. Verified with a standalone repro of the matching logic - J-all-247, j-all-247 and J-ALL-247 now all resolve to the job; before, all three returned no match.

Note this affected comment short codes too (same keying), but only jobs were reported.

#### Note R-all-275<a name="r-all-275"></a>  
Correction to the job-level fix (supersedes the approach in R-all-273). The earlier change made the Open Tasks tab body display resolved matches during search, but resolved tasks should not appear in Open Tasks at all - they belong only in the Overview tab's resolved (Closed) section, where CondensedTodos already shows and counts them.

Revised fix in src/pages/Investible/Planning/PlanningInvestible.js:
- Reverted the Open Tasks body to open tasks only (openTodoCommentsSearched), so resolved matches no longer show there.
- Changed the Open Tasks tab badge to count only open matches: countUnresolved(openTodoCommentsSearched, search) instead of todoCommentsSearched. Previously the search branch of countUnresolved counted resolved matches too, which is what made a resolved task appear to belong in Open Tasks.

Net: during search a matching resolved task is counted and displayed only in the Overview tab's resolved section. The view-level Not Doing fix in Backlog.js is unchanged.

#### Note R-all-276<a name="r-all-276"></a>  
Correction to verification step 3: when searching a term that matches a resolved task, that task should appear ONLY in the Overview tab's resolved (Closed) section - it should NOT show in the Open Tasks tab, and the Open Tasks badge should not count it. (Earlier wording implied it should show under Open Tasks; that was the wrong direction.)

#### Resolved 
#### Resolved Task S-all-91<a name="s-all-91"></a>  
Manual verification before resolving (there are no automated tests for these search UI paths, and they need real data - a Not Doing job, a resolved task, and a known job code):

1. T-all-2234: type a job short code such as J-all-247 into the stage search box and press Enter - it should navigate straight to that job rather than running a text search. Try mixed/lower/upper case (j-all-247, J-ALL-247) too.

2. T-all-2233 (view level): search a term that matches a job in stage Not Doing (e.g. "mobile") - the Backlog tab badge count and the Backlog search list should now agree, with the Not Doing matches visible.

3. T-all-2233 (job level): open a job and search a term that matches a resolved task - the Open Tasks tab badge and the Open Tasks body should now agree, with the resolved matches visible.

#### Resolved Question Q-all-169<a name="q-all-169"></a>  
For T-all-2234: when you typed J-all-247 into the search box on the stage view and it didn't go to that job, what happened instead? Also, was J-all-247 in the same workspace/view you were currently looking at, or a different one?

> ##### Reply C-all-1045<a name="c-all-1045"></a> 
It was supposed to have logic that goes directly to the job (added by you) but is just searching instead.

#### Option O-2<a name="o-2"></a>
#### Showed text-search results in place
Instead of jumping to the job, it filtered the current view as a text search for the string 'J-all-247'.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Navigated somewhere wrong
It navigated, but to the wrong job/page rather than J-all-247.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Did nothing
The search ran but the page stayed where it was — no navigation and no obvious result.


This option is in stage In Dialog.
#### Resolved Question Q-all-170<a name="q-all-170"></a>  
For T-all-2233: searching "mobile" on the stage view gives wrong counts at both the view-level tabs and the job level, and you noted resolved tasks seem involved. Can you walk me through what you actually saw — which specific tab/badge showed a wrong number, what number it showed, and what you expected it to be? Concrete examples (even one) will let me pin the bug to the right place instead of guessing.

> ##### Reply C-all-1044<a name="c-all-1044"></a> 
At the view level I think the problem is that jobs in stage Not Doing show counts correctly but they do not display.

At the job level I think it is the same problem for resolved tasks.

#### Resolved Task T-all-2234<a name="t-all-2234"></a>  
J-all-247 search on stage did not go to that job

#### Resolved Task T-all-2233<a name="t-all-2233"></a>  
Search on "mobile" on stage and counts are all wrong. This both on the view level tabs and the job level. On the job level part of the problem seems to be with resolved tasks.

## Job J-all-30<a name="j-all-30"></a>
### Other technical debt.


This job is in stage Further Work.
#### Tasks 
#### Task T-all-568<a name="t-all-568"></a>  
<https://github.com/Uclusion/uclusion_market_api/blob/9fccdcd29098309262d9e2934d6ef6e6ba980231/handlers/list_stages.py#L3> - can't follow stage so don't need that code there

#### Task T-all-47<a name="t-all-47"></a>  
Remove use of change_notification_for_everyone everywhere - KISS.

#### Task B-all-61<a name="b-all-61"></a>  
Deleted true notifications pile up on disk.

#### Task T-all-217<a name="t-all-217"></a>  
Not doing role based permissions so get rid of MarketsRequestValidator usage.

#### Task B-all-289<a name="b-all-289"></a>  
Fix the test api to return after fixture is loaded and give the log in names. Make the rest API call an async function that completes because **the gateway times out after 30s.**

#### Task T-all-1343<a name="t-all-1343"></a>  
```
export function dehighlightMessage(message, messagesDispatch) {
```

```
if (message.type !== UNASSIGNED_TYPE) {
```

```
// Handle unassigned on the triage page after render or else default open row breaks
```

```
messagesDispatch(dehighlightMessages([message.type_object_id]));
```

```
}
```

```
}
```

Fix - need unique key access instead of this crap. **If the object_id is the user then that won't be unique across workspaces in the same account.**

**Is the object id ever the user?**

Only for USER_POKED where the market is 'upgrade_reminder' so for now still works.

#### Task T-all-230<a name="t-all-230"></a>  
Deleting market should remove notification_configs for that market.

#### Task T-all-2151<a name="t-all-2151"></a>  
Some wrong with developer_stuff deployment on dev - tries to deploy layers even though no change or one change back and then fails even at that.

#### Task T-all-1720<a name="t-all-1720"></a>  
If create two demos and then a workspace so banned from both, further demo creation will fail on uclusion_users.placeholder id trick.

Could fix up several ways including get existing account user and update its ID. However that is messy - could also have a flag so they are done with demos.

#### Task T-all-384<a name="t-all-384"></a>  
tabs that should realyl be rendered by screen, if we want them to be sticky at the top

#### Task B-all-180<a name="b-all-180"></a>  
Integration tests should not send emails.

> ##### Grouped task C-all-351<a name="c-all-351"></a> 
The bug is that we don't want to get marked as a spammer - every time we send to some account where it gets ignored I think it counts against some trust score somewhere. I don't think it's any work - you already added object types and we already use it to control email sending.

> ##### Grouped task C-all-343<a name="c-all-343"></a> 
We have testing of email sending capability with the Cypress tests. I don't want to also have to build that into the integration tests as no easy way to accomplish.

> ##### Reply C-all-346<a name="c-all-346"></a> 
So the bug is then they shouldn't send because we're getting spammed or something? If that's the problem just null route them with a filter. Too much work otherwise.

> ##### Reply C-all-352<a name="c-all-352"></a> 
Ah yeah, that would do it too.

> ##### Reply C-all-341<a name="c-all-341"></a> 
.... why? Do you not like testing our email sending?

#### Task T-all-474<a name="t-all-474"></a>  
```
getMarketInvestibles
```

and the similar

```
const values = Object.values(investiblesState);
```

```
inv = values.find((inv) => {
```

```
const marketInfo = getMarketInfo(inv, marketId);
```

```
return marketInfo?.id === marketInvestibleId;
```

```
});
```

in notification sync check are horribly indexed.

In the forseeable future that could be a real performance problem.

#### Task T-all-224<a name="t-all-224"></a>  
Remove [uclusion-summaries-dev-summary-time-series](https://us-west-2.console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=uclusion-summaries-dev-summary-time-series) - still there on stage at least.

#### Task T-all-1285<a name="t-all-1285"></a>  
Use multipart <https://flaviocopes.com/fix-formdata-multipart-fetch/> or find library to do it rather than one big upload as this guy <https://www.reddit.com/r/webdev/comments/1icvxxx/library_for_multipart_uploads_to_presigned_urls/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button> says its error prone. See <https://github.com/Uclusion/uclusion_web_ui/blob/b74194135fa445b9a1f9e8e7b7ab5e4d0313ca56/src/api/files.js#L12>

Backend see <https://dev.to/traindex/multipart-upload-for-large-files-using-pre-signed-urls-aws-4hg4>

#### Task T-all-218<a name="t-all-218"></a>  
check_notification.py - remove all of the unused code that used to create notification reports in emails. Also same idea all links that are created for link maps are no longer used by our emails.

#### Task T-all-393<a name="t-all-393"></a>  
Fix flakey integration tests - there are a number of them including some of the billing and the versions test.

#### Task T-all-71<a name="t-all-71"></a>  
State change on investible API must validate the move to stage and if appears_in_context and planning then make sure assignments present.

#### Task T-all-48<a name="t-all-48"></a>  
Get rid of alert_type stored in notification ~~and ASSIGNED_UNREVIEWABLE notification~~ - not using any of that anymore.

#### Task B-all-208<a name="b-all-208"></a>  
Investible table not getting deleted in dev by scripts. Maybe because was thinking it could be shared.

#### Task T-all-212<a name="t-all-212"></a>  
<https://slack.com/blog/developers/slack-app-directory-review-process>

#### Task T-all-377<a name="t-all-377"></a>  
The APIs that are passing in a account token on the URL should be using headers like all the rest.

#### Task T-all-183<a name="t-all-183"></a>  
allowed_investibles - no longer being used.

#### Task T-all-110<a name="t-all-110"></a>  
Remove investibles_accept and the usage of accept on front end out of market info. Should just be looking for non-deleted approval instead and the backend doesn't delete accepted on deletion or other approval removal **or moving into started as accepting**.

#### Resolved 
#### Resolved Task T-all-326<a name="t-all-326"></a>  
Remove field children of comment - it's being used once on the front end and twice on the back end and can in all cases be replaced by:

```
const replies = comments.filter(comment => comment.reply_id === id);
```

> ##### Grouped task C-all-446<a name="c-all-446"></a> 
No that filter would slow down the UI on render as searches too many comments.

#### Resolved Task B-all-177<a name="b-all-177"></a>  
Build blessed can't access uclusion_test_api. For now I just caught the exception. I think it's because the token it is using is me and I'm lacking some sort of API access or something.

#### Resolved Task T-all-50<a name="t-all-50"></a>  
const [inboxState, inboxDispatch] = *useReducer*(*getReducer*(messagesHash),

{page: 1, tabIndex: 0, expansionState: {}, pageState: {}, defaultPage: 1});

Gets you a reducer based on the current messages - what happens if the messages change?

#### Resolved Task T-all-594<a name="t-all-594"></a>  
An invite to existing user / email to the a workspace does not send an email. **Debatable whether or not this should be auto adding instead of just sending the usual invite email anyway. Just cause I am in one of your workspaces doesn't mean I want to be auto added to others.**

This requires UI change also if decide not to auto add.

#### Resolved Task T-all-362<a name="t-all-362"></a>  
Make backend_common etc. use around the world instead of lambda by lambda to deploy - parallel means former is much faster.

#### Resolved Task T-all-392<a name="t-all-392"></a>  
Limit Uclusion build tools to looking at Uclusion's repos instead of everything my Github user can see.

## Job J-all-116<a name="j-all-116"></a>
### Uclusion memory hogging part two
Part one cuts off comments that are in archived jobs older than a date. Doesn't fix search of older stuff or handle market level comments or job context itself getting too large to store in memory.


This job is in stage Further Work.
#### Tasks 
#### Task B-all-198<a name="b-all-198"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/7caf3d11-2a75-4adf-af0f-de60c99571bc.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Uclusion memory hogging being reclaimed by latest Chrome chrome://settings/performance and then white screen. Also can we drop the dedicated worker?

**The way we do contexts means everything but pictures is in memory and nothing loads from disk. Archived should be coming from disk - that's easy to do as that page can load from disk and just have back end add a archived flag to comments that is maintained by async. For investibles fast enough to mark an archived field in investible update as stage has already been resolved in the validator. Investible page will have to be able to load from disk also in case archived and investibles context will have to load max swimlanes visible archived so that page works.**

Possibly the white screen could be avoided if we check if memory has been erased from an event and then reload.

> ##### Grouped task C-all-503<a name="c-all-503"></a> 
Do not add an archived flag to comments - just use resolved or not.

#### Task T-all-2156<a name="t-all-2156"></a>  
Once working make getting to your older stuff as part of the pricing like Slack does.

#### Task T-all-1393<a name="t-all-1393"></a>  
Back end search - otherwise older comments now not included.

#### Task T-all-1483<a name="t-all-1483"></a>  
```
function doAddMarketsComments(state, action) {
```

```
const { commentDetails, existingCommentIds } = action;
```

```
const newState = {...state};
```

```
const now = Date.now();
```

```
Object.keys(commentDetails).forEach((marketId) => {
```

```
const transformedComments = fixupItemsForStorage(commentDetails[marketId]);
```

```
const oldCommentsRaw = state[marketId] || [];
```

```
const oldComments = !_.isEmpty(existingCommentIds) ? oldCommentsRaw.filter((oldComment) => {
```

```
const updatedAt = new Date(oldComment.updated_at);
```

```
if (now - updatedAt.getTime() < 90*86400000) {
```

```
// Archived algorithm checks if archived 3 months ago before screening out
```

```
return true;
```

```
}
```

```
// If this comment screened because of archiving then remove from disk to conserve memory
```

```
return !_.isEmpty(existingCommentIds.find((commentId) => commentId === oldComment.id));
```

```
}) : oldCommentsRaw;
```

```
newState[marketId] = addByIdAndVersion(transformedComments, oldComments);
```

```
});
```

```
return removeInitializing(newState);
```

```
}
```

Had to remove this after malfunctioned when moved old bugs into a backlog investible. Logging in and out again fixed it. The malfunction was that all but recent comments disappeared both inside the investible and on the bugs. Refreshing temporarily restored and then they disappeared again.

#### Task T-all-1389<a name="t-all-1389"></a>  
Make archived investibles go back to the server for their comments. *Cause eventually local search will be limited by size or time and archive will be from server and paginated.*

#### Task T-all-871<a name="t-all-871"></a>  
You shouldn't be getting the full list of all object versions to check each time either. Need a way for archived to not be checked after the initial move to archive.

#### Task T-all-1033<a name="t-all-1033"></a>  
Upgrade script - the new archived field on investible should not ever result in a new version, object version, or push from async. That will be handled by stage change normally and so for the upgrade script there will not be any version changes or production churn.

#### Task T-all-1419<a name="t-all-1419"></a>  
Bump the back end and front end hard coded 90 days to a higher number and put the remaining task into part two. Front end is in:

```
if (now - updatedAt.getTime() < 90*86400000) {
```

```
// Archived algorithm checks if archived 3 months ago before screening out
```

```
return true;
```

```
}
```

Half a year maybe? Keep in mind that sign in or sign up on invite to a large market are impacted still by size.

#### Resolved 
#### Resolved Suggestion S-all-48<a name="s-all-48"></a>  
Better if cache like that does not kick in until over some amount of memory - and so only advanced users affected by this code.

#### Resolved Suggestion S-all-47<a name="s-all-47"></a>  
Just remove body text for now and if need you hydrate from disk. Search still loads all though so unclear if saves much unless make search not load archived and search archived is it's own thing that does from disk or something.

#### Resolved Suggestion S-all-42<a name="s-all-42"></a>  
Can this be accomplished purely at the context level? No DB change and just have context dependencies and different methods for retrieval that know what being filtered on - investible for instance.

## Job J-all-318<a name="j-all-318"></a>
### Handling of notes
Can expose all the note flags on the CLI. Then don't show a default value on the UI at the note level and call the field "Force visible" instead.


This job is in stage Accepted.
#### Tasks 
#### Task T-all-2161<a name="t-all-2161"></a>  
Decide on the interaction between reply and is_visible - does replying set is_visible to true? That seems like the cleanest way.

#### Task T-all-2159<a name="t-all-2159"></a>  
Make md utils honor is_visible on a note. MCP defaults to not showing notes that do not have is_visible set.

#### Task T-all-2157<a name="t-all-2157"></a>  
Also need button to create a sub note on other's notes, like AI, instead of just reply.

#### Task T-all-2158<a name="t-all-2158"></a>  
Fix the documentation for the new way.

#### Task T-all-2216<a name="t-all-2216"></a>  
Rename the field at the note level - "Include in MD". A note included shows on the job for MCP and CLI regardless of other flags. Include in MD does not change whether the job is visible of not.

#### Task T-all-2228<a name="t-all-2228"></a>  
Expose all the note flags on the CLI so notes show by default or not is up to the flag and the flag defaults to they show.

#### Resolved 
#### Resolved Task T-all-2227<a name="t-all-2227"></a>  
Must be a way to convert a note to a task. Very easy to confuse the two types.

## Job J-all-327<a name="j-all-327"></a>
### When Claude comes up it checks for new work.

This job is in stage Complete.
#### Resolved 
#### Resolved Task T-all-2230<a name="t-all-2230"></a>  
Visible flag is just at the view level. You have stuff you don't want to be in status put it in another view. AI doesn't care about views so that works.

The view level visible flag is CLI not visible for a report.

Job level flag now becomes called "AI able" and works even if the view is not visible.

View level is already called "Public when creating a report." so that's correct.

#### Resolved Task T-all-2232<a name="t-all-2232"></a>  
Fix documentation and hover text.

#### Resolved Task T-all-2231<a name="t-all-2231"></a>  
New tool find_work or something like that. Include directions for when to call it in CLAUDE.md. It returns a list of short code, name combinations where the name of a bug is extracted just as front end does it by removing the html and truncating.

Then the agent should present the short code name combinations as a list of options inside chat.

## Job J-all-214<a name="j-all-214"></a>
### CLI multi-line comment support.

This job is in stage Complete.
#### Reports 
#### Report R-all-159<a name="r-all-159"></a>  
Multi-line TODO support is implemented and ready to test. What was built: uclusionCLI.py now captures the full text of a block-comment TODO — / *TODO | ...* / in all C-style languages (detection extended to Java, JS, TS, C#, Go, Rust, Swift, Kotlin, PHP) and in HTML/XML — from the | to the closing marker, with javadoc-style leading * stripped from continuation lines. The sync rewrite touches only the first line (ticket code inserted), leaving the block structure intact in the code. One-line // TODOs no longer leak the trailing */ into the ticket body. As decided in Q-all-101, consecutive single-line comments (# / //) and Python """ docstrings are intentionally not captured, and languages with only single-line comments stay single-line. Documentation: a new "Multi-line TODOs" section in syncing-code-todos.md spells out exactly what is and is not supported, with before/after examples. Verified with a mock-network harness (no real tickets created) covering multi-line .c/.java/.js/.html, job keywords in multi-line form, one-line block comments, .py single-line, non-capture cases, and the DONE-marking pass. T-all-1605 is resolved. To try it for real: add a /* TODO | ... */ spanning lines to a scanned source dir and run uclusion sync against dev. The TODO J-all-214 marker in the script was kept so the next sync flips it to DONE once this job completes.

#### Notes 
#### Note R-all-158<a name="r-all-158"></a>  
Tested and implemented. Testing (mocked network, no real tickets) showed multi-line was NOT handled: block comments only sent their first line, / *TODO was undetected in Java/JS/TS, and consecutive // lines were dropped. Implementation per the decision in Q-all-101/C-1: (1) is_todo now recognizes /* for all C-style languages (.java, .js, .ts, .cs, .go, .rs, .swift, .kt, .php — .c/.cpp/.css/.scss already did); (2) process_code_file gathers a block comment (// or ) from the | to the closing marker and sends the full text as the description, stripping optional javadoc-style leading * on continuation lines; (3) the rewrite puts the ticket code on the first line only and leaves the rest of the block untouched, so code structure is preserved; (4) side-effect fix: a one-line / *TODO | x* / no longer sends the trailing */ into the ticket body, and the* / is preserved in the rewritten line. Not supported as decided: consecutive single-line comments (#, //) and Python """ docstrings. Documentation updated in uclusion-documentation syncing-code-todos.md with a new "Multi-line TODOs" section showing the supported block format, the rewrite behavior, and the exclusions. The TODO J-all-214 marker in uclusionCLI.py was kept so sync flips it to DONE when this job resolves. Verified by a mock-network harness covering .c/.java/.js/.html multi-line, one-line block, job keywords (JOB READY) in multi-line, .py single-line, non-capture of continuation // and # lines, and the DONE-marking pass on a block first line — all pass.

#### Resolved 
#### Resolved Task T-all-1605<a name="t-all-1605"></a>  
Try a multi-line comment and see if handled correctly. Also add to documentation that if want multi-line use proper multi-line format for the TODO comment IE /* */ in java etc.

#### Resolved Question Q-all-101<a name="q-all-101"></a>  
I tested multi-line TODO comments against the current CLI (mocked network, no real tickets created). Results: (1) for block comments like / *TODO | line1 \n line2* / only the first line is sent to Uclusion — continuation lines are silently dropped from the created bug/job; (2) in Java/JS/TS a / *TODO isn't detected at all, because is_todo only recognizes // for those extensions (only .c, .cpp, .css, .scss recognize /*); (3) consecutive // TODO continuation lines are also dropped. T-all-1605 says to document "use proper multi-line format IE // in java etc." — but documenting that without a code change would be misleading, since the CLI neither detects /* in Java nor captures continuation lines anywhere. What scope do you want?

#### Option O-1<a name="o-1"></a>
#### Implement block-comment support + document
Change the CLI so a TODO opening a block comment (/* or ) and sends the full text as the bug/job description. Also extend is_todo so /* TODO is detected for Java, JS, TS, and the other C-style languages. The processed rewrite keeps the block structure: ticket code goes on the first line, continuation lines stay untouched. Then document: a // TODO captures one line only; use /* */ (or ) when you want a multi-line description.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The job title is "CLI multi-line comment support" and the in-code TODO J-all-214 marker sits exactly at the split that drops continuation lines, both pointing at an implementation fix. Documenting "// for multi-line" only makes sense if the CLI actually captures the whole block; otherwise the docs would promise behavior that doesn't exist. The change is contained: gather lines until the closing marker, extend the detection patterns for C-style languages, keep the rewrite on the first line.

##### Suggestion S-1<a name="s-1"></a> (under Q-all-101 ▸ option O-1) 
This is fine if you make clear exactly what is handled and what is not. For instance in Python you can do

```
"""
```

```
This is my
```

```
multiline comment
```

```
"""
```

or you can also do

```
# This is my
```

```
# multiline comment
```

decide exactly what will be supported.

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
Here is exactly what will be supported. SUPPORTED for multi-line capture: only true block comments with explicit open/close delimiters — / *TODO | ...* / for C-style languages (.c, .cpp, .java, .js, .ts, .cs, .go, .rs, .swift, .kt, .php, .css, .scss) and for .html/.xml. The description is captured from the | until the closing marker; continuation lines may optionally start with * (javadoc style) and that prefix is stripped. The rewrite keeps the block structure: the ticket code is written into the first line and continuation lines are left untouched in the file. NOT SUPPORTED: (1) consecutive single-line comments (# or // on following lines) — there is no terminator, so the CLI cannot know where the TODO ends versus an unrelated comment, those TODOs stay single-line; (2) Python """ triple-quote blocks — these are string literals (docstrings), not comments, and rewriting inside string literals could change runtime behavior, so they are not scanned. Languages with only single-line comments (.py, .rb, .sh, .pl, .lisp, .clj) therefore remain single-line TODO only. The documentation will state all of this explicitly with examples.

#### Option O-2<a name="o-2"></a>
#### Documentation only
No code change. Document the current limitation: only the first line of any TODO is captured, so keep the TODO text on one line. Remove or reword the /* */ recommendation in the task accordingly, and resolve the in-code TODO J-all-214 marker at the split as won't-fix.


This option is in stage In Dialog.
## Job J-all-317<a name="j-all-317"></a>
### Bugs B-all-446


This job is in stage Complete.
#### Reports 
#### Report R-all-175<a name="r-all-175"></a>  
The dropped-refresh bug from your two-tab test (C-all-963) is fixed and ready to retest. Root cause was pre-existing: the origin-wide REFRESH_LOCK with ifAvailable silently discarded a tab's refresh whenever another tab was refreshing, and websocket pushes make all tabs refresh at the same instant — so with two tabs the watching tab lost its refresh nearly every time. Per Q-all-111, src/api/versionedFetchUtils.js now coalesces refreshes per tab (in-memory flags, one queued follow-up so a push arriving mid-refresh is never lost) and tabs no longer share any refresh lock. Also fixed: refreshVersions was passing true as the dispatchers argument, so the leader's direct-dispatch path had been dead code — it now runs as designed.

To retest, repeat the failed scenario from S-all-71 item 3 / C-all-963: with both tabs open, create a comment in one and it should appear in the other within a few seconds of the websocket push. The rest of S-all-71 is unchanged and still applies. Three files changed in total now: LeaderContext.js, Root.js, versionedFetchUtils.js — all lint clean. Ready to commit as J-all-317 once testing passes.

#### Notes 
#### Note R-all-170<a name="r-all-170"></a>  
Implemented B-all-446 and T-all-2153 in src/contexts/LeaderContext/LeaderContext.js:

**B-all-446 (new tab grabs leadership):** Tab messages are now typed — 'logout' and 'claimLeadership' constants — instead of treating any message as logout (per Q-all-107); unknown messages are ignored so future message types cannot hurt older tabs. On sign-in a tab queues for leadership (waitForLeadership) and then broadcasts 'claimLeadership'. Tabs receiving the claim dispatch updateLeader(false) and call waitForLeadership again — tab-election relinquishes any held or queued leadership before re-requesting, so every existing tab drops behind the new tab in the Web Locks queue and the new tab becomes leader. Because old tabs re-queue rather than drop out, leadership falls back to them if the new tab closes. The election setup is guarded by a ref so effect re-runs cannot double-register listeners or re-claim.

**T-all-2153 (new tab promptly fetches):** In the normal case the claim lands in milliseconds, so by the time the user is loaded the new tab is leader and runs the existing refreshVersions(dispatchers) — fresh fetch persisted to disk. For the wedged case (an unresponsive old leader never processes the claim, and a frozen tab holds its Web Lock indefinitely), the non-leader branch now schedules a memory-only refreshVersions() 3 seconds after user load, canceled if leadership arrives first. So a new tab gets fresh data within seconds either way.

**Rollout note (Q-all-107):** currently-deployed tabs treat any tab message as logout, so during the deploy transition an old-code tab will sign out when a new-code tab broadcasts its claim — one-time, self-healing.

T-all-2154 (fast poll for URLs requesting missing data) is pending answers on Q-all-109 (extend the 2-second poll to /dialog URLs with missing investible/comment?) and Q-all-110 (should missing-data polls back off?).

#### Note R-all-173<a name="r-all-173"></a>  
Root cause found, and it is pre-existing rather than from the leadership change: matchErrorHandlingVersionRefresh wraps doVersionRefresh in navigator.locks.request("REFRESH_LOCK", {ifAvailable: true}). Web Locks are origin-wide — shared across ALL tabs — and with ifAvailable the loser gets a null lock and silently does nothing. A websocket push lands in every tab at virtually the same instant, every tab calls refreshVersions(), one tab wins the lock, and every other tab's refresh is DROPPED. Since pushMessage data is per-tab memory, the dropped tab never gets the new comment until the 5-minute interval or the next push. In your test the creating tab (which already had the comment) raced the watching tab for the lock and the watching tab lost — websocket message in console, no comment, exactly as reported. This is also very likely the real mechanism behind the original B-all-446 "old tab missed the sync notification": the notification arrived, the refresh was skipped.

Two contributing notes: (1) the misleading 'Refreshed versions from push' console message logs even when the refresh was skipped, because the skip resolves normally; (2) a pre-existing argument bug at versionedFetchUtils.js:109 — matchErrorHandlingVersionRefresh(true, dispatchers) passes true AS the dispatchers parameter, so the leader's dispatchers are never actually used (data flows through the pushMessage path instead; works because reducers gate disk on isLeader, but the parameter is dead).

Fix choice is in the new question on this job — the options differ on whether tabs keep sharing one refresh lock.

#### Note R-all-174<a name="r-all-174"></a>  
Fixed per Q-all-111 in src/api/versionedFetchUtils.js. The origin-wide REFRESH_LOCK is gone; matchErrorHandlingVersionRefresh now coalesces per tab with in-memory flags: if a refresh is already running in this tab the request sets a queued flag and exactly one follow-up refresh runs when the current one finishes, so a websocket push arriving mid-refresh (or while another tab refreshes) is never dropped. If the queued request carried dispatchers they are preserved for the follow-up. Also fixed the argument bug — refreshVersions was calling matchErrorHandlingVersionRefresh(true, dispatchers), passing true AS dispatchers, so the leader's direct-dispatch path in sendMarketsStruct had been dead code; it now actually receives the dispatchers (helper signatures verified against the call sites). The C-all-963 scenario should now pass: both tabs refresh independently on the push and the watching tab fetches the new comment.

#### Note R-all-171<a name="r-all-171"></a>  
Implemented per Q-all-109 and Q-all-110 in src/containers/Root/Root.js. The ticket-path poll is generalized into a missing-data poll: it still covers unresolvable ticket URLs, and now also runs on /dialog URLs when the third path token is neither a known investible nor a known group (new job link) or when a #c<commentId> hash cannot be found in the comments context (new comment link, e.g. the assistance section case). The check waits for the markets/comments/investibles/groups contexts to finish initializing so loading from disk is not mistaken for missing data. Per Q-all-110 the poll now backs off: doVersionRefresh every 2 seconds for the first minute, then every 30 seconds, stopping as soon as the data arrives or the user navigates away (and on sign-out, as before). #cv vote hashes are excluded, matching getNameForUrl.

#### Resolved 
#### Resolved Question Q-all-112<a name="q-all-112"></a>  
TEST QUESTION for S-all-71 item 4 — click this question's link in a brand-new browser tab on stage. Expected: the tab polls (getChangedIds every 2 seconds in the network tab if the data is not yet local), resolves the ticket URL, and lands on this job's assistance section pinned to this question. Resolve this question once verified.

#### Option O-2<a name="o-2"></a>
#### Test failed
The new tab did not resolve the link or did not land on the assistance section - reply with what happened.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Test passed
The new tab resolved the link and landed pinned on the assistance section.


This option is in stage In Dialog.
> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Resolved Task B-all-446<a name="b-all-446"></a>  
When you come in on a new browser tab you have to make sure it grabs leader from old tab as old tab may have missed the sync notification and new tab is the only one that knows to refresh and what is waiting for. Plus the old tab might be in some weird state.

#### Resolved Task S-all-71<a name="s-all-71"></a>  
Manual multi-tab testing should be done before deploy since leader election cannot be exercised by lint/unit tests:

1. **Leadership transfer (B-all-446):** Open tab A (console shows "Claiming leadership"), then tab B — A should log the claimLeadership message and B should log "Claiming leadership". Close B — A should log "Claiming leadership" again (re-queue fallback works).
2. **Logout still propagates:** Sign out in one tab — other tabs should still log out (message typing did not break the existing 'logout' path).
3. **Prompt fetch (T-all-2153):** With tab A open and backgrounded, make a change from another browser/user, then open tab B — B should show the change within seconds and persist it (B is leader now).
4. **AI link (T-all-2154):** Create a question via the MCP and click its link in a brand-new tab — should poll, resolve, and land pinned on the assistance section.
5. **Back-off (Q-all-110):** Open a dead link (e.g. /<marketId>/Q-all-9999) and watch the network tab — getChangedIds every 2 seconds for the first minute, then every 30 seconds.

#### Resolved Task C-all-963<a name="c-all-963"></a>  
I did the suggested test with two tabs by making a change in the second tab and waiting for it to show in the first.

This message showed

```
isTrusted
```

```
:
```

```
true
```

```
bubbles
```

```
:
```

```
false
```

```
cancelBubble
```

```
:
```

```
false
```

```
cancelable
```

```
:
```

```
false
```

```
composed
```

```
:
```

```
false
```

```
currentTarget
```

```
:
```

```
null
```

```
data
```

```
:
```

```
"{\"event_type\": \"comment\", \"object_id\": \"0fdff0fc-962b-41cf-ada4-1e32ae49dfe3\", \"version\": 1}"
```

```
defaultPrevented
```

```
:
```

```
false
```

```
eventPhase
```

```
:
```

```
0
```

```
lastEventId
```

```
:
```

```
""
```

```
origin
```

```
:
```

```
"wss://dev.ws.uclusion.com"
```

```
ports
```

```
:
```

```
[]
```

```
returnValue
```

```
:
```

```
true
```

```
source
```

```
:
```

```
null
```

```
srcElement
```

```
:
```

```
WebSocket {url: 'wss://dev.ws.uclusion.com/v1', readyState: 1, bufferedAmount: 0, onopen: ƒ, onerror: ƒ, …}
```

```
target
```

```
:
```

```
WebSocket {url: 'wss://dev.ws.uclusion.com/v1', readyState: 1, bufferedAmount: 0, onopen: ƒ, onerror: ƒ, …}
```

```
timeStamp
```

```
:
```

```
40269.10000002384
```

```
type
```

```
:
```

```
"message"
```

but the second tab never showed the new comment.

#### Resolved Task T-all-2154<a name="t-all-2154"></a>  
If a tab is opened on a URL that is requesting data not present the polling interval to get that data must be faster than every five minutes. Some of this logic maybe present already. This logic is particularly important on the planning investible assistance section where the user may have clicked a link from an AI screen for a new question.

#### Resolved Question Q-all-107<a name="q-all-107"></a>  
For B-all-446 the plan is: a new tab queues for leadership (waitForLeadership) and then broadcasts a "claim leadership" message on the tab-election channel; existing tabs that receive it relinquish and re-queue, so the new tab always becomes leader. Wrinkle: tabs still running the currently deployed code treat ANY tab message as a logout (the LeaderContext message listener calls onSignOut for every message, since 'logout' was the only message that existed). So during the rollout window, opening a new-code tab while an old-code tab is open would trigger onSignOut in the old tab — which clears shared storage and the Cognito session, signing the user out everywhere once. How should we handle this transition?

> ##### Reply C-all-961<a name="c-all-961"></a> 
You can just distinguish between messages being sent. The only reason it doesn't is that currently there is only one message being sent - it even has a comment to that effect.

#### Option O-2<a name="o-2"></a>
#### Isolate with a new election namespace
Move the election to a new namespace (e.g. new Tab('uclusion2')) so old-code tabs never receive the claim message and are never spuriously signed out. Downside: until old tabs reload, an old-code leader and a new-code leader coexist, so two tabs write versions data to disk concurrently (refreshes are still serialized by the origin-wide REFRESH_LOCK, but writes are doubled), and the namespace change is permanent cosmetic debt.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Accept one-time sign-out during rollout
Reuse the existing 'uclusion' tab-election channel and just send the new 'claimLeadership' message. Users who keep an old-code tab open across the deploy and then open a new tab get signed out once and must sign back in. Simplest code, self-healing, and arguably flushes old tabs that are in a weird state anyway. Could also be bundled with a cache-clear release where old tabs are forced out regardless.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The disruption is a one-time sign-out limited to users who hold an old-code tab open across the deploy and then open a new tab, and it self-heals immediately. The alternative permanently complicates the election namespace and allows transient dual leaders writing to disk. Bundling with a cache-clear release would make the window even smaller.

#### Resolved Task T-all-2153<a name="t-all-2153"></a>  
Any new tab must promptly fetch data.

#### Resolved Report R-all-172<a name="r-all-172"></a>  
All three items are implemented and ready to review (lint clean, two files changed):

**B-all-446 — new tab grabs leadership** (src/contexts/LeaderContext/LeaderContext.js): Tab messages are typed ('claimLeadership'/'logout'; unknown ignored for forward compatibility, per Q-all-107). On sign-in a tab queues for leadership and broadcasts a claim; existing tabs drop to non-leader and re-queue behind it, so the fresh tab always becomes leader and leadership falls back when it closes. A ref guards against duplicate listeners on effect re-runs.

**T-all-2153 — new tab promptly fetches**: Normally the claim makes the new tab leader before user load, so the existing leader refreshVersions(dispatchers) is the prompt fetch with disk persistence. If the claim stalls (a frozen old leader holds its Web Lock and never processes messages), the non-leader path now does a memory-only refreshVersions 3 seconds after user load, canceled if leadership arrives first.

**T-all-2154 — fast poll for URLs referencing missing data** (src/containers/Root/Root.js): The 2-second ticket poll is generalized — it also runs on /dialog URLs whose third token is neither a known investible nor group, or whose #c comment hash is not local, and per Q-all-110 it backs off to 30 seconds after the first minute. Context initialization is awaited so disk loading is not mistaken for missing data.

**Known trade-off:** during the rollout window an old-code tab signs the user out once when a new-code tab broadcasts its claim (accepted in Q-all-107).

Manual multi-tab test steps are filed as S-all-71. Once testing passes I can commit (message will start with J-all-317).

#### Resolved Question Q-all-108<a name="q-all-108"></a>  
B-all-446 says a NEW browser tab must grab leadership. Should an existing background tab also grab leadership when the user switches back to it (focus/visibilitychange), or only on fresh tab load? The same staleness argument applies: a tab the user just returned to refreshes itself (Root's focus handler already calls refreshVersions) and is fresher than a possibly wedged leader, but grabbing on every focus means leadership churn plus a full leader version refresh on every tab switch.

##### From AI user:
> ##### Reply C-all-962<a name="c-all-962"></a> 
Answering C-all-960 (what went wrong with the current system) — three things:

1. **"Eventually the new tab should grab leadership" never happens.** Leadership in tab-election is a Web Locks API lock held until the holding tab closes or the browser discards it. There is no timeout or health check, so a wedged-but-open old tab holds leadership forever; the new tab waits in the lock queue indefinitely.

2. **The new tab does not promptly go get the data.** On startup a non-leader tab only calls refreshNotifications() (LeaderContext.js:89) — notifications, not versions. Root's load/focus listeners that would call refreshVersions() are attached only after isUserLoaded, which is after the window load and initial focus events have already fired in a fresh tab, so they don't fire until the user switches away and back. The first market-data refresh therefore waits for the next websocket push or the 5-minute interval in WebSocketContext. Meanwhile the notifications it fetched ARE fresh — so the inbox can point at comments/investibles that aren't in the (stale) store yet.

3. **Even after the new tab refreshes, it cannot repair shared state.** Disk writes are gated on isLeader in every context reducer, and pushMessage is Amplify Hub — in-memory, per-tab, not cross-tab. So nothing the new tab fetches reaches disk or the old tab. The old leader missed the websocket push (socket dropped / timers frozen while the machine slept), so its memory and the shared disk both stay stale, and every subsequent tab load starts from that stale disk. The only repair today is closing the old tab.

So "only the old tab writes it" is exactly the problem: the one tab allowed to write is the one tab guaranteed not to have the data, and it cannot be displaced without closing it. Transferring leadership to the new tab makes the known-fresh tab the one that persists.

> ##### Reply C-all-960<a name="c-all-960"></a> 
Why isn't the current system working? If the old tab is wedged that should only prevent writes to disk. The new tab should go get the data it needs but only the old tab writes it. Eventually if the old tab stays wedged the new tab should grab leadership.

What went wrong?

#### Option O-2<a name="o-2"></a>
#### Also on focus/visibility
The focused tab always claims leadership, so the active tab is always the one persisting to disk. Covers returning to a long-backgrounded tab while the leader is wedged, at the cost of a leadership transfer and a full refreshVersions(dispatchers) on every tab switch.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Only on new tab load
Claim leadership once per tab, when it first signs in/loads. Matches the scenario described in B-all-446. Minimal churn; an existing wedged leader still gets displaced as soon as any new tab opens.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Load-only matches the reported scenario and keeps leadership stable. Focus-based claiming triggers a leadership transfer and full leader version refresh on every tab switch, which is a lot of churn to cover a corner case that load-time claiming already mostly displaces. Can be extended later if a wedged leader still shows up in practice.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Only a completely new tab is trusted so switching every time on focus doesn't help.

#### Resolved Question Q-all-109<a name="q-all-109"></a>  
Scope of T-all-2154: I verified the fast poll partly exists — ticket-path URLs (the form AI screens return, e.g. /<marketId>/Q-all-107) already poll doVersionRefresh every 2 seconds in Root.js until the ticket index can resolve them, and the index is keyed by marketId/ticketCode so AI question links do resolve once data arrives. Combined with T-all-2153 (new tab fetches promptly), the AI-link-to-new-question scenario is covered end to end. The URL shape with NO fast poll is a direct /dialog/<marketId>/<investibleId> URL where the investible or a #c<commentId> hash target is not in local data (e.g. a copied browser URL rather than a ticket link) — the investible page hash effect just does nothing when the comment is missing. Should T-all-2154 extend the 2-second poll to those dialog URLs too?

#### Option O-1<a name="o-1"></a>
#### Extend poll to dialog URLs with missing data
Generalize the Root.js poll: also poll every 2 seconds when on a /dialog path whose investible is not in local storage or whose #c comment hash cannot be found in the comments context, stopping as soon as the data arrives. Matches the task's general wording about any URL requesting data not present.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The task wording is general ("a URL that is requesting data not present") and the extension is small — reuse the existing 2-second poll machinery in Root.js with two more miss conditions (investible not local, #c hash comment not local). Verify-only leaves a user-visible dead end when someone shares a plain browser URL.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### Verify-only, existing coverage is enough
Ticket links (what AI screens and Uclusion itself emit) are already covered by the 2-second poll, and T-all-2153 makes any new tab fetch promptly, so direct /dialog URLs with missing data are rare enough to leave on the 5-minute interval. Resolve T-all-2154 after verifying the ticket poll works in a fresh tab.


This option is in stage In Dialog.
#### Resolved Question Q-all-111<a name="q-all-111"></a>  
How should the dropped-refresh bug from C-all-963 be fixed? The origin-wide REFRESH_LOCK with ifAvailable:true silently discards a tab's refresh whenever any other tab is refreshing — and websocket pushes make all tabs refresh at the same instant, so with two or more tabs open the watching tab loses its refresh almost every time. Whatever we pick, I would also fix the argument bug where refreshVersions passes true as the dispatchers parameter.

#### Option O-1<a name="o-1"></a>
#### Per-tab coalescing, drop the shared lock
Replace REFRESH_LOCK with simple in-memory flags: if a refresh is already running in THIS tab, set a queued flag and run exactly one follow-up refresh when it finishes (so a push arriving mid-refresh is never lost). Tabs become fully independent — a wedged or slow tab can no longer block or starve another tab's refresh, which fits the whole point of this job. Cost: on each push every open tab does its own getChangedIds plus fetch of what it lacks, instead of all-but-one skipping (they each needed that fetch anyway for their own memory, so the skipped calls were the bug, not a saving).


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Each tab needs its own fetch to update its own memory, so the cross-tab lock never saved API calls — it only discarded needed refreshes. Per-tab coalescing keeps the useful dedupe (one refresh at a time per tab, one queued follow-up) while decoupling tabs from each other's wedged states, which is the theme of this whole job. The shared-lock alternative re-couples every tab to the slowest one.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Since only one tab can write to disk this cross tab lock makes no sense.

#### Option O-2<a name="o-2"></a>
#### Queue on the shared lock instead of skipping
Remove ifAvailable so every refresh request waits its turn on the origin-wide lock and none are dropped. Smallest diff and keeps cross-tab serialization of API calls. Downsides: a hung or frozen tab holding the lock mid-refresh blocks refreshes in ALL tabs indefinitely (re-coupling tabs to a wedged tab's state), and rapid pushes can queue several near-no-op refreshes per tab since Web Locks cannot coalesce waiters.


This option is in stage In Dialog.
#### Resolved Question Q-all-110<a name="q-all-110"></a>  
Related to T-all-2154: the existing ticket-path poll in Root.js retries doVersionRefresh every 2 seconds forever if the data never arrives (dead link, no access to the market, deleted comment) — one getChangedIds API call per 2 seconds for as long as the tab sits there. Any extension to dialog URLs would inherit that. Should these missing-data polls give up or back off after a while?

#### Option O-1<a name="o-1"></a>
#### Keep polling forever
Status quo behavior of the ticket poll. Simplest, never strands a slow backend, and a user parked on a dead link is rare. The 2-second tick is one lightweight getChangedIds call when nothing changed.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Back off after ~1 minute
Poll at 2 seconds for about a minute (covers any realistic propagation delay), then slow to e.g. every 30 seconds so a dead link doesn't hammer the API indefinitely. Slightly more code in the poll setup, applies to both ticket and dialog polls.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Backing off bounds the worst case (a tab parked on a dead link all day) for little extra code, and one minute at 2 seconds is plenty for real propagation delays. Low certainty because the status quo has apparently been fine in practice and simplicity has value here.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
The status quo only works because the scale of usage is currently low.

## Job J-all-310<a name="j-all-310"></a>
### Front end AI ready
Each of the tasks in this job are independent of on another.


This job is in stage Complete.
#### Reports 
#### Report R-all-145<a name="r-all-145"></a>  
All three tasks are implemented and ready to test (4 files changed, lint clean, all 31 jest tests pass).

**B-all-430 - Make task on replies to resolved tasks.** Test: reply to a resolved task from another user, open the notification - the middle button now reads "Make task" and converts the reply in place into a task on the same job (per Q-all-91), instead of offering Resolve. On the task page, the reply now shows a Make task button regardless of the parent being resolved, at any nesting depth, and for unassigned viewers (who get the move wizard with Task preselected instead of in-place conversion). The missing-button-after-unresolve bug was the assignment gate plus ThreadedReplies dropping the myPresenceIsAssigned prop for nested replies.

**B-all-350 - In-progress prompt for team mode.** Test: in a team view, put a task in progress on a job in Work Ready, then move the job to Approval (dropdown or drag-and-drop). After submitting the approval the wizard now routes to the remove-in-progress prompt, matching single-user behavior. C-all-945 was resolved with no code change per Q-all-92: the AI user never appears in group members, so single-mode detection is already correct.

**B-all-432 - Links lost in bullet tasks.** Test: create a job whose description has a bullet list with a link in a bullet - the resulting task now keeps the link (extractTodosList now uses innerHTML instead of textContent; fixes both job-creation paths).

Nothing was skipped. Changes are uncommitted in the working tree; happy to commit with the J-all-310 prefix once review passes.

> ##### Reply C-all-947<a name="c-all-947"></a> 
I reopened B-all-350 because after I removed the in progress task I ended up back on the approval wizard.

##### From AI user:
> ##### Reply C-all-948<a name="c-all-948"></a> 
Fixed. RemoveInProgressStep's fallback navigation was "go back where came from", which in this new flow is the approval wizard. TaskInProgressWizard now passes its investibleId through, and both the remove action and the go-back button navigate to the job page when there is no comment context but an investibleId is present (the stage-change flows); the original history-back behavior is kept only when neither is available. Re-test: Work Ready to Approval with an in-progress task, approve, remove in progress - you should land on the job.

#### Notes 
#### Note R-all-143<a name="r-all-143"></a>  
Fixed in StageActionStep (the approval prompt step of the job stage wizard). After the approval is submitted, it now checks the job for unresolved, undeleted in-progress tasks and, when the destination stage allows investment (Approval/Paused), sends the user to the remove-in-progress wizard instead of straight to the job - mirroring what PlanningInvestibleNav already did for the single-user direct path. This covers both team flows that land on the approval prompt: the stage dropdown on the job page and drag-and-drop to the Approval column. The skip-approvals path (straight to Started) intentionally does not prompt since in-progress tasks are expected there. See C-all-945 note for the single-mode double-check.

#### Note R-all-142<a name="r-all-142"></a>  
Fixed in three parts. (1) The missing button even after unresolve had two causes: the Make task button in Reply.js required the viewer to be assigned, and nested replies never received the myPresenceIsAssigned prop (ThreadedReplies dropped it), so the button never rendered below the first reply level. The button now always shows: assigned users convert in place, unassigned users are routed to the move wizard with Task preselected (same pattern as Comment.js). The prop is now passed through ThreadedReplies/ThreadedReply. (2) Removed the resolved-root gate from showConvert so Make task and Move appear on replies under resolved comments; only the subtask Resolve icon stays hidden when the parent is resolved since resolving under a resolved parent is a no-op. The tooltip now reads 'Make task' for plain replies and keeps 'Ungroup' for subtasks. (3) Per Q-all-91, the notification wizard middle button on a reply to a resolved task is now 'Make task' and converts the reply in place into a task on the same job, dismissing the notification and navigating to the new task; the Resolve middle button and the resolve-on-dismiss fallback no longer offer resolving an already-resolved root.

#### Note R-all-144<a name="r-all-144"></a>  
Root cause: extractTodosList in commentFunctions.js read each bullet with li.textContent, which strips all markup including links. It now uses li.innerHTML so links (and any other inline formatting like bold) survive into the created tasks. This helper is used by both job-creation paths (JobDescriptionStep and JobNameStep), so both are fixed. All 31 jest tests pass.

#### Resolved 
#### Resolved Task B-all-430<a name="b-all-430"></a>  
On a reply to a resolved task the notification wizard should not have Resolve as middle button but instead Make task and the reply itself should also have make task button on it regardless of its parent being resolved. **Actually even after unresolve parent there is still no Make task button - so that is just a bug - can make a task out of anything.**

#### Resolved Task C-all-945<a name="c-all-945"></a>  
Double check single mode handles this correctly. Possibly it is not filtering out the AI user and so thinks using approvals is still relevant.

##### From AI user:
> ##### Reply C-all-946<a name="c-all-946"></a> 
Double-checked single mode. Detection happens in useGroupPresences (group presence count === 1) used by PlanningInvestibleNav/JobStageWizard, and isAutonomousGroup used by PlanningIdeas drag-and-drop. Neither filters the AI user, but per Q-all-92 the backend never returns the AI user as a group member, so the count is correct and single mode properly skips the approval prompt (requiresAction returns false when isSingleUser). No code change needed. Note the B-all-350 fix in StageActionStep also only triggers in the approval-prompt path, which single mode never enters.

#### Resolved Question Q-all-91<a name="q-all-91"></a>  
For B-all-430: when the notification wizard (DecideReplyStep) shows a reply on a resolved task, what should the "Make task" middle button do? The task page "Make task" button converts the reply in place into a task on the same job, while the wizard's existing "Move to task" path (used for report replies) opens the move-to-job wizard with Task preselected so you can pick or create a different job.

#### Option O-1<a name="o-1"></a>
#### Convert in place on same job
The middle button calls updateComment with type TODO to turn the reply into a task on the same job immediately — identical to the task page Make task button. Label it 'Make task'.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
"Make task" on the task page already means convert-in-place on the same job, and the reply being responded to lives on a task of that job, so in-place conversion is the most direct match for the bug report's wording and the least surprising behavior.

> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### Open move-to-job wizard
Reuse the wizard's existing moveToTask behavior: navigate to the bug/move wizard with useType=Task so the user can choose which job (or a new one) receives the task. Keeps DecideReplyStep consistent with its other branch.


This option is in stage In Dialog.
#### Resolved Task B-all-350<a name="b-all-350"></a>  
Fix resolving in progress for team as did for single - requires sending from approval prompt to remove in progress wizard when necessary.

Clarification - this problem happens when move a job from Work Ready to Approval / Paused stage. The system asks for you to add or update your approval but does not ask for you to remove in progress tasks. In single mode this isn't an issue as the system doesn't ask for you approval.

#### Resolved Task C-all-951<a name="c-all-951"></a>  
Skip all approvals should just not be present when moving from Work Ready back to approval / paused. What Skip all approvals is supposed to do is take a job from approval / paused to Work Ready without it having to be approved first.

So make sure the button did what it did before for other flows and is just not there for this one.

##### From AI user:
> ##### Reply C-all-952<a name="c-all-952"></a> 
Done. StageActionStep now hides Skip all approvals when the job is already in the wizard's target stage, which is exactly and only the moved-into-approval/paused flow (both dropdown and drag and drop pre-move the job before the prompt opens). All other flows reach this step before any move, so current stage differs from target and the button shows and behaves exactly as before - start() itself is untouched.

#### Resolved Task C-all-949<a name="c-all-949"></a>  
Now with current code everything works except the stage does not change and the job is in the stage it started in.

##### From AI user:
> ##### Reply C-all-950<a name="c-all-950"></a> 
Fixed: the approval wizard only records the approval, it never moves the job - drag and drop works because onDropVoting changes the stage before opening the wizard. The dropdown now does the same: in changeInvestibleStage, when the only reason for the wizard is the approval prompt (target allows investment, no comment close needed, no assignment needed, not blocked), it calls stageChangeInvestible first and then navigates to the approval prompt. Other wizard entries (review, assignment, blocked, further work) are unchanged since their wizard steps perform the move themselves. This also fixes a latent issue where the skip-approvals button assumed the job was already in the target stage. Re-test: dropdown Work Ready to Approval with an in-progress task - stage changes, approval prompt, remove in progress, land on job.

#### Resolved Question Q-all-92<a name="q-all-92"></a>  
For C-all-945 (double-check single mode): single-mode detection uses group presence count === 1 in useGroupPresences and isAutonomousGroup, with no filtering of the AI user (the presence with an empty email). If the backend includes the AI user in group membership/capabilities, a solo user with an AI collaborator is misdetected as a team, so requiresAction prompts for approval on the Work Ready to Approval move. Does the AI user appear in the group membership data sent to the frontend?

#### Option O-2<a name="o-2"></a>
#### No - AI user never in groups
The backend never returns the AI user as a group member, so current detection is correct and C-all-945 can be resolved with a note (no code change).


This option is in stage In Dialog.
> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Option O-1<a name="o-1"></a>
#### Yes - filter the AI user
The AI user can appear in group members, so add an empty-email filter to useGroupPresences (and isAutonomousGroup) so single mode is detected correctly everywhere isSingleUser is computed.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
I can't verify backend group membership from the frontend code, but the empty-email filter is a no-op if the AI user is never in groups and fixes single-mode detection if it is, so it's the safe choice either way.

#### Resolved Task T-all-2147<a name="t-all-2147"></a>  
During testing I found that the drag and drop route for team is good but now the use the stage drop down in the planning investible nav no longer matches. The latter just goes to remove the in progress without asking for approval. Make the drop down work as the drag and drop now does.

#### Resolved Task B-all-432<a name="b-all-432"></a>  
If during job creation you create a bullet point in the description with a link the link is lost in the resulting task.

## Job J-all-322<a name="j-all-322"></a>
### Better drag and drop on swimlanes.
Should smoothly make a space and instantly drop in - the backend API call happens in parallel.


This job is in stage Complete.
#### Resolved 
#### Resolved Note R-all-269<a name="r-all-269"></a>  
T-all-2224 done (Q-all-165 → O-2). `stageChange` in PlanningIdeas.js now flags `setOperationRunning(true)` right after the optimistic move and clears it in `.finally(setOperationRunning(false))`, so the Uclusion logo blinks to show the save is in progress. The card still drops instantly first; the indicator just runs during the parallel API call, and on failure the existing revert + error toast still apply so the error is no longer out of the blue.

Per your requirement that navigating away must not kill the in-flight save: the stage-change promise is created in the drop handler (not in a useEffect, so there is no cleanup that aborts it) and its `.then`/`.catch`/`.finally` use the app-root context dispatchers + setOperationRunning, which stay valid after the swimlane unmounts. So the save and its state reconciliation complete regardless of navigation, and the logo stops blinking when it returns. No request abort is wired to component lifecycle.

#### Resolved Report R-all-265<a name="r-all-265"></a>  
Ready for review. Swimlane drag-and-drop now drops instantly with the backend call running in parallel, and the swimlane drag image is the standard whole card.

**What changed** (2 files: `PlanningIdeas.js`, `investibleFunctions.js`):
- Dropping a job between Voting/Accepted/Review (or onto another row) updates the UI immediately via a new `getOptimisticInvestibleMove()` helper; the stage-change API runs in parallel instead of blocking. The card plays a brief settle-in CSS animation. No animation library or DnD-engine change was needed.
- On API failure the optimistic move reverts to the original and the existing error toast shows (Q-all-162 → O-1).
- Only direct stage changes are optimistic; wizard-routed drops (close-comments, approval, add-reviewer) keep their existing behavior (Q-all-163 → O-1).
- The swimlane card now uses the standard whole-card drag image instead of the small text caption (T-all-2221 — resolved). Per Q-all-164 → O-2 the row-based surfaces (backlog/bug/option/archive) are intentionally left unchanged.

**Verification status:** ESLint passes. I could not exercise the actual drag/drop behavior, which needs the running app with real data — I filed S-all-90 with the concrete manual test scenarios (instant drop, cross-row move, failure revert, wizard paths unchanged, whole-card image) for that pass.

Implementation decisions are documented in R-all-264. Happy to commit (message prefixed J-all-322) once you've looked it over.

#### Resolved Note R-all-267<a name="r-all-267"></a>  
Fixed: the hover-only pencil (edit) icon was being baked into the drag image because the card is hovered when you grab it. `investibleOnDragStart` now calls `doRemoveEdit(card.id)` to hide that icon before taking the `setDragImage` snapshot, so the dragged card no longer carries the pencil. The icon still appears on hover as before.

#### Resolved Task C-all-1033<a name="c-all-1033"></a>  
The drag and drop image includes the pencil icon. The pencil icon only shows to indicate to the user that he can click through. It should not show on the card during drag and drop.

#### Resolved Question Q-all-161<a name="q-all-161"></a>  
"Should smoothly make a space and instantly drop in" — what's the intended interaction? The swimlanes use native HTML5 drag-and-drop with no animation library (only Material-UI v4 + CSS), so the two realistic models differ a lot in effort. Which do you want?

##### From AI user:
> ##### Reply C-all-1032<a name="c-all-1032"></a> 
Re: "Is an animation library required for the standard card move and drop feel?" — No, not for option O-1.

Two pieces, both achievable with what's already in the project:

1. **Card follows the cursor while dragging** (T-all-2221): native HTML5 DnD already does this for free. We just pass a full-card clone to `setDragImage()` instead of the current tiny text caption, so the whole card tracks the pointer. No library.

2. **"Instantly drop in" + "smoothly make space" on release**: we update local state immediately on drop (API in parallel), React re-renders the column, and a plain CSS `transition` (transform/opacity) makes the dropped card settle and its neighbors shift smoothly. Material-UI v4's transitions are available too, but raw CSS suffices. No library.

The only thing that would actually benefit from a library is the *other* option — O-2's live gap-opening while you hover over a column (FLIP-style choreography during dragover). That's exactly why I recommended O-1: it gives the standard, snappy feel with native DnD + CSS and none of the added dependency or jank. So if O-1 is what you want, we need nothing new.

> ##### Reply C-all-1031<a name="c-all-1031"></a> 
Is an animation library required for the standard card move and drop feel?

#### Option O-1<a name="o-1"></a>
#### Instant drop + settle transition
On release, the card immediately appears in its new column (no waiting on the API) and animates/settles into place with a CSS transition. Surrounding cards shift via a transition as the list re-renders. No live gap-opening while you hover. Lower effort, matches 'instantly drop in'.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
"Instantly drop in" is the explicit ask, and this delivers the perceived snappiness — the card lands immediately and the API runs in parallel. With native HTML5 DnD and no animation library, live gap-opening on hover (O-2) is high-effort, fragile during dragover, and not actually what "instantly drop in" requests. A settle/shift CSS transition gives the "smoothly make a space" feel at a fraction of the risk.

> ##### $${\color{orange} 25 out of 100 - Somewhat Uncertain Reason \space For}$$ E-2<a name="e-2"></a>
Probably not worth a new engine to get cards to move out of the way.

#### Option O-2<a name="o-2"></a>
#### Live gap-opening on hover
As you drag over a column, the existing cards animate apart to open a visible gap where the card would land, then it drops into that gap on release. This is true FLIP-style choreography and is significantly more work with native HTML5 DnD (no library), and can be janky during dragover.


This option is in stage In Dialog.
##### Question Q-1<a name="q-1"></a> (under Q-all-161 ▸ option O-2) 
So is having this option work without being janky just a matter of adding an animation library? Or does adding an animation library cause other issues that make this option not desirable?

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
It's not just a matter of adding an animation library — and that's the key point.

**Where the jank actually comes from.** With native HTML5 DnD, the live gap-opening in O-2 requires, on every `dragover` (which fires continuously), computing which slot the pointer is over and inserting a placeholder to open the gap. But inserting that placeholder changes the DOM, which changes what element is under the cursor, which re-fires `dragenter`/`dragleave` on different elements — so the gap can flicker/thrash. Also, the drag image is a static snapshot the browser takes at `dragstart`; you can't smoothly reflow the real source element mid-drag. None of that is an "animation" problem — it's a hit-testing / DOM-thrash problem inherent to native DnD.

**What an animation library does and doesn't fix.** A pure animation library (e.g. framer-motion's layout/FLIP animations) would smoothly *animate* a gap once you've decided where it is — but it does NOT solve the detection/thrash above. So adding framer-motion on top of native DnD would not, by itself, make O-2 smooth.

**What actually removes the jank** is replacing the drag *engine* — switching from native HTML5 DnD to a pointer-based sortable library like @dnd-kit (the modern, maintained choice; react-beautiful-dnd is effectively unmaintained). Those have built-in sortable reordering + gap animation that's smooth by design. But that's a much bigger change than "add a library":

1. It would have to replace native DnD across **every** draggable surface for consistency — swimlanes (`PlanningIdeas`), the backlog (`BacklogListItem`), and the archive/assistance cards — not just one column.
2. All the existing drop handlers and wizard-routed flows (close comments, approval, add reviewer) would need rewiring and full re-testing.
3. Added bundle size, plus touch/accessibility behavior differences to validate.

**So, the fact that settles it:** getting O-2 smooth isn't an add-on, it's an engine swap touching all drag surfaces with real migration risk — whereas O-1 delivers the requested "instantly drop in" + "smoothly make space" feel today with native DnD + CSS and zero new dependencies. Given the job's wording asks for instant drop (not live hover choreography), I'm holding my recommendation on O-1. If you specifically want the live hover gap, I'd treat that as a larger, separate effort to migrate to @dnd-kit rather than scope creep on this job.

#### Resolved Question Q-all-163<a name="q-all-163"></a>  
Many drops today don't change stage directly — they navigate to a wizard first (e.g. closing blocking comments to enter Review, the approval prompt when entering Voting, adding a reviewer). Should the new instant/optimistic drop apply only to the direct stage-change drops, or also to these wizard-routed ones?

#### Option O-1<a name="o-1"></a>
#### Direct stage changes only
Apply instant-drop + parallel API only when the drop is a plain stage change (no user input required). Wizard-routed drops (close comments, approval, add reviewer) keep their current behavior since they require user interaction before the move is valid.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Wizard-routed drops aren't valid moves until the user supplies input (closing comments, approval, picking a reviewer), so optimistically moving the card then potentially undoing it on cancel is risky and confusing. Scoping instant/optimistic behavior to plain stage changes captures the common case cleanly; wizard paths keep their proven flow.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
The wizard based ones are not standard anyway.

##### Suggestion S-1<a name="s-1"></a> (under Q-all-163 ▸ option O-1) 
Just to clarify the drop card and animation are the same. Just that once you let go of the card you are in a wizard and no optimistic move has occurred.

#### Option O-2<a name="o-2"></a>
#### All drops
Try to make every drop feel instant, including wizard-routed ones. This is much harder/riskier — the move isn't valid until the user completes the wizard, so an optimistic move could need to be undone if they cancel.


This option is in stage In Dialog.
#### Resolved Task T-all-2224<a name="t-all-2224"></a>  
There is no longer any indication that an operation is in progress. That's bad because the user will not realize the system is doing anything and then if an error occurs it will be out of the blue.

#### Resolved Task T-all-2223<a name="t-all-2223"></a>  
When drag and drop from the assistance section (which uses ArchiveInvestibles to display) the card is still the old one. The card should be the same and when drop are thrown into the wizard as now.

#### Resolved Note R-all-264<a name="r-all-264"></a>  
Implementation notes (2 files changed: PlanningIdeas.js, investibleFunctions.js).

**Optimistic instant drop (the job):**`stageChange()` in `PlanningIdeas.js` now applies the move to local state immediately via a new helper `getOptimisticInvestibleMove()` (in `investibleFunctions.js`), which clones the investible with the new stage/assignments and bumps `updated_at` so it sorts to the top of its new column. `stageChangeInvestible()` then runs in parallel. Removed the blocking `setOperationRunning(true)` and the `wait` cursor so the UI stays interactive. On success the real backend response reconciles via the existing `onInvestibleStageChange()`; on failure we re-dispatch the captured original to revert (Q-all-162 → O-1) — the error toast is already raised by `stageChangeInvestible`.

**Settle animation (Q-all-161 → O-1):** a `recentlyMovedId` state on each row drives a one-shot CSS `@keyframes settleIn` (scale+fade, 250ms) on just the dropped card. No animation library added (confirmed unnecessary in C-all-1032). Live gap-opening-on-hover (O-2) was rejected as it would require swapping the whole DnD engine.

**Scope (Q-all-163 → O-1):** only the direct `stageChange` path is optimistic. Wizard-routed drops (blocking comments, approval prompt, add-reviewer) are untouched and still navigate as before; `onDropVoting` only runs its post-move approval navigation when the move succeeded.

**Whole-card drag image (T-all-2221, Q-all-164 → O-2):** removed the custom `DragImage` text-caption override in the swimlane so the browser uses the standard whole-card drag image. Left the other row-based surfaces (backlog, bug, option, archive) on the existing `DragImage` per your point that rows can't be made consistent with cards.

#### Resolved Note R-all-266<a name="r-all-266"></a>  
Fix to the T-all-2221 drag image (correcting a regression from the first pass): removing the custom drag image did NOT yield the standard whole-card image — because the swimlane card contains links, the browser fell back to its native link-drag ghost (the small name + URL rectangle, worse than the deployed text caption). Corrected `investibleOnDragStart` to explicitly snapshot the actual card element via `setDragImage(event.currentTarget, ...)`, keeping the grab point under the cursor, so the whole card is now carried while dragging. The optimistic instant-drop + parallel API logic is unchanged.

#### Resolved Question Q-all-162<a name="q-all-162"></a>  
With the stage-change API call now happening in parallel (optimistic) instead of blocking the move, what should happen if that API call fails?

#### Option O-2<a name="o-2"></a>
#### Leave card, toast only
Leave the card in its new spot, show the error toast, and let the next background sync reconcile. Simpler but the UI can briefly disagree with the backend until sync.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Revert card + error toast
On failure, animate/move the card back to its original column and show the existing error toast. Keeps local state consistent with the backend.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Reverting on failure keeps local state truthful to the backend. "Leave card, toast only" can leave the UI showing a move that didn't happen until the next sync, which is confusing right after an error. Revert + the existing error toast is the safer, clearer behavior.

> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Resolved Task T-all-2221<a name="t-all-2221"></a>  
Also redo the drag and drop images to be more standard IE whole card moves.

#### Resolved Question Q-all-165<a name="q-all-165"></a>  
T-all-2224: the instant drop currently shows no sign the background save is running. How should we indicate the in-progress stage change without losing the instant/non-blocking feel the job asked for? (Context: the app's existing operationRunning indicator works by spinning the clicked button and disabling all buttons until the call returns — i.e. it blocks interaction, which is exactly what we removed to make the drop instant.)

#### Option O-1<a name="o-1"></a>
#### Per-card saving spinner (non-blocking)
Show a small spinner on the just-dropped card while its stage-change API is in flight, then clear it on success (or on failure, where the card already reverts + toasts). Rest of the UI stays interactive. Keeps the instant/parallel feel and ties the 'something is happening' signal directly to the card you moved, so an error is no longer out of the blue.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
A per-card spinner directly answers the concern ("user won't realize the system is doing anything, and an error comes out of the blue") by putting the in-progress signal on the exact card you acted on, while preserving the instant/non-blocking drop the job is about. Restoring global operationRunning re-blocks the UI (contradicting the job's goal); dimming is non-blocking but a weaker, more ambiguous signal than a spinner.

#### Option O-2<a name="o-2"></a>
#### Restore global operationRunning during save
Set the existing operationRunning indicator during the parallel call so behavior matches the rest of the app (active button spins, buttons disabled) until the API returns. The card still moves instantly first, but this re-introduces a brief whole-UI block during each save — partially undoing the non-blocking goal.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
The operation running makes the Uclusion logo blink to indicate an operation in progress. Yes the user will be blocked from further write actions but he is free to navigate away etc.

The key part is to make sure that when the user navigates away the operation the drag and drop kicks off is not prevented from finishing.

#### Option O-3<a name="o-3"></a>
#### Dim the moved card while saving
Reduce the moved card's opacity (e.g. ~60%) until the API resolves, then restore to full. Non-blocking and minimal, but a softer/less explicit 'in progress' signal than a spinner.


This option is in stage In Dialog.
#### Resolved Task S-all-90<a name="s-all-90"></a>  
Manual test pass for the new swimlane drag-and-drop (I lint-verified, but the drag/drop behavior needs checking in the running app with real data):

1. **Instant drop + parallel API**: drag a job between Voting / Accepted / Review on your own row. The card should appear in the target column immediately (no "wait" cursor, no pause), with a brief settle-in animation. The backend call should complete in the background without blocking further interaction.
2. **Cross-row move**: drag a job onto another person's row — it should land there instantly and stay (assignment updates optimistically).
3. **Failure revert**: simulate/observe an API failure (e.g. offline) on a drag — the card should snap back to its original column and the usual error toast should appear (Q-all-162 → O-1).
4. **Wizard-routed drops unchanged** (Q-all-163 → O-1): drag a job with a blocking comment into Review, or into Voting when not autonomous — these should still open the existing wizard/approval flow, with no premature optimistic move if you cancel.
5. **Whole-card drag image** (T-all-2221): while dragging, the cursor should carry a translucent image of the whole card, not the old small text caption. Confirm the other row-based surfaces (backlog, bugs, options, archive) still drag as before (intentionally unchanged per Q-all-164 → O-2).

#### Resolved Question Q-all-164<a name="q-all-164"></a>  
T-all-2221 ("redo the drag and drop images to be more standard, i.e. whole card moves"): the current tiny text-caption drag image (DragImage component) is used on 5 draggable surfaces, not just swimlanes — swimlane cards, backlog items, archive/assistance cards, bug list items, and option list items. How broadly should the "whole card moves" change apply?

#### Option O-1<a name="o-1"></a>
#### All draggable surfaces
Switch every surface that uses the text-caption drag image to the standard whole-element drag image (swimlane, backlog, archive, bugs, options). Most consistent — e.g. you drag backlog cards into swimlanes, so mixing styles would look odd. Slightly broader diff.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Consistency: you drag backlog/archive/bug cards into the same swimlanes, so a whole-card drag image on swimlanes but a tiny text caption elsewhere would feel inconsistent. The change is also low-risk and nearly identical per surface (drop the custom drag image so the browser uses the standard whole-element image), so applying it everywhere is cheap and avoids a jarring mismatch.

#### Option O-2<a name="o-2"></a>
#### Swimlane only
Only change the swimlane cards (the job's focus); leave backlog, archive, bug and option list items showing the current text-caption drag image. Narrower diff but inconsistent drag feel between surfaces.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
The backlog, bug, etc. surfaces are not cards but rows so there is no way to make them consistent with swimlanes.

#### Resolved Note R-all-268<a name="r-all-268"></a>  
T-all-2223 done (ArchiveInvestibles.js — assistance section). Its `onDragStart` now uses the same whole-card drag image as the swimlane: it snapshots the dragged card element via `setDragImage(event.currentTarget, ...)` (keeping the grab point under the cursor) and hides the hover-only pencil first via `doRemoveEdit(id)`, replacing the old text-caption `DragImage`. Drop behavior is unchanged — assistance drops still route into the wizard exactly as before. Removed the now-unused `DragImage` import plus the `theme`/`mobileLayout`/`useTheme`/`useMediaQuery` that only supported it. This is consistent with Q-all-164 → O-2: the assistance section displays as cards (unlike the backlog/bug/option rows), so it gets the whole-card image too.

## Job J-all-323<a name="j-all-323"></a>
### Bugs B-all-454, B-all-453, B-all-452, B-all-451, B-all-450, T-all-2104,...
...B-all-449


This job is in stage Complete.
#### Notes 
#### Note R-all-270<a name="r-all-270"></a>  
Fixed in PlanningIdeas.js (the swimlane card's report-required / overdue clock badge).

Root cause: the badge's onClick called `dehighlightMessage(doesRequireStatusMessage, messagesDispatch, true).then(() => navigate(...))`. But `dehighlightMessage` takes only `(message, messagesDispatch)` and returns `undefined` — the third arg was ignored and `.then()` was being called on `undefined`, which throws a TypeError. The dispatch to dehighlight the message had already run (marking it read, so it disappeared from the swimlane card), but the thrown error aborted before `navigate(...)` could run. Hence "made it read and disappear but didn't go to the notification."

Fix: changed it to the same pattern used by the estimate handler directly below it (and every other call site in the codebase) — call `dehighlightMessage(doesRequireStatusMessage, messagesDispatch)` then `navigate(history, formInboxItemLink(doesRequireStatusMessage))` synchronously. Now clicking the clock badge navigates to the inbox item as expected.

#### Resolved 
#### Resolved Task T-all-2210<a name="t-all-2210"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c7b82639-57c3-46d7-abf2-269278fa43d5.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Being asked to approve assignment on moving stage back to paused from work ready even though it is just me and AI. Backend is counting AI incorrectly in order for that to get sent.

The backend count should not be counting people not in the view unless they are subscribed to the job - which AI is - so need to especially exclude it.

#### Resolved Task T-all-2218<a name="t-all-2218"></a>  
On signup copy Slack verbiage and still have terms of use link but don't force checking.

> ##### Grouped task C-all-1023<a name="c-all-1023"></a> 
Remove clicking from UI tests.

#### Resolved Task T-all-2226<a name="t-all-2226"></a>  
Need same AI_GENERATED on market comment reply.

#### Resolved Task B-all-454<a name="b-all-454"></a>  
1. Put the enclosing question's short code on the artifact's heading (most important).

The one identifier I actually need is the parent question code, because that's what parent_question_short_code_id wants. So instead of:

#### Suggestion S-1

present it as a breadcrumb:

#### Suggestion S-1 (under Q-all-140 ▸ option O-2)

The Q-all-140 is the load-bearing part; the ▸ option O-2 is nice-to-have. Any artifact that can be nested — suggestion, issue, question-about-an-option, or a reply inside one — should carry the same (under Q-all-… ▸ …) tag.

2. Don't list nested items as if they were job-level.

S-1 appearing flush in the job's Assistance section (same indent as job-level suggestions) is what fooled me. If nested items either (a) render indented under their option, or (b) always carry the breadcrumb from #1, I won't mistake them for top-level. If only one is feasible, do #1 — the breadcrumb travels even when the layout flattens.

3. Flag for the bug: resolve needs the parent param too.

Even with perfect markdown, I think the 404 would still happen, because resolve only accepts short_code_id — there's no parent_question_short_code_id on it like there is on add_info/approve_job_or_option. So the fix likely has two parts: the markdown breadcrumb and giving resolve a parent_question_short_code_id. Worth putting both in the bug.

#### Resolved Task T-all-2225<a name="t-all-2225"></a>  
Clicking on the status due indicator did not go to the notification but instead just made the notification read and so disappear from swimlane card.

#### Resolved Task B-all-453<a name="b-all-453"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/929db5c8-d7cf-4819-8e0e-25bd54cd62b3.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Relative dating on Tasks Complete jobs is not working and so they don't show in swimlanes.

> ##### Grouped task C-all-1030<a name="c-all-1030"></a> 
The new sync immediately needs to be relaxed for demo markets so that there is not a race condition with the demo market load.

#### Resolved Task B-all-451<a name="b-all-451"></a>  
In CLAUDE.md need to specify that if there are tasks left on a job then use a task code on commit instead of a job code which indicates the job is complete.

Also it did:

```
Make editing a comment open a top-level modal instead of navigating to a
```

```
separate full-page screen (J-all-326, Q-all-156 O-2)
```

Can't include the job and it is not necessary.

#### Resolved Task T-all-2219<a name="t-all-2219"></a>  
Make inside of search box white.

#### Resolved Task B-all-449<a name="b-all-449"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/4b7aafba-3762-4413-b264-997ec959cb81.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

New notification showed up on the overview tab instead of assistance.

#### Resolved Task T-all-2104<a name="t-all-2104"></a>  
Got a "Notification: New job" from some change I made myself - probably stage change after added a task to a job in Tasks Complete. Also saw this for moving a job to paused - potentially the name is wrong on the email cause got please approve.

Happened again at 8:11 pm 6/16 and this time was just creating jobs and moving them around. One job got created in Ready to Assign which not sure why and maybe it was that one when it was moved to Work Ready.

#### Resolved Task B-all-450<a name="b-all-450"></a>  
A reply from AI should be notification only - not email.

#### Resolved Task T-all-2222<a name="t-all-2222"></a>  
Add to the CLAUDE.md to not attempt to interact with questions that are resolved - it will error. Finish whatever you need to with a question before resolving.

## Job J-all-313<a name="j-all-313"></a>
### Bugs B-all-440, B-all-439, B-all-438


This job is in stage Complete.
#### Reports 
#### Report R-all-153<a name="r-all-153"></a>  
B-all-440 is implemented and ready to test.

What was done:
- CondensedTodos.js: the Resolved tasks tab now shows the orange "new" badge (with the message count) when the notification is on a note/reply under a resolved task, not just on the resolved task itself. This covers the screenshot case where Overview said "1 new" but the Resolved tab said only "7 total".
- PlanningInvestible.js: fixed always-false reply matching for the top-level Tasks, Assistance, and Notes tab badges, so a new reply on an open task, question, suggestion, or note now lights that tab's "new" badge instead of leaking into the Overview count.

To verify: add a note to a resolved task from another user (or otherwise generate a notification on a resolved task's thread), then open the job Overview — the Tasks section's Resolved tab should show "new" with the count while the notification is unread. Also check that a new reply on an open task shows "new" on the Tasks tab rather than Overview.

B-all-439 and B-all-438 were already resolved; no other open tasks remain, so B-all-440 is resolved and the job is fully depicted by this change.

#### Notes 
#### Note R-all-152<a name="r-all-152"></a>  
Root cause: the Resolved tasks tab badge only matched notifications against the resolved root task ids. A notification for a note/reply on a resolved task carries the reply's comment id, so it counted in the Overview "new" badge but the Resolved tab showed only "total".

Fix in CondensedTodos.js: the Resolved tab now also matches notifications on replies/notes under resolved tasks, so it shows the orange "new" count whenever the Overview notification lives on that tab.

Also fixed the same bug class in PlanningInvestible.js: the reply lists for the top-level Tasks, Assistance, and Notes tabs were built with an always-false comparison (comment objects compared against an id string), so notifications on replies never attributed to those tabs and leaked into the Overview count instead. Now a new reply on an open task / question / suggestion / note lights its own tab's "new" badge rather than Overview's.

#### Resolved 
#### Resolved Task B-all-440<a name="b-all-440"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/725a3fed-6fb1-4044-9415-4a6cc242f5e3.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

If the Overview notification count is on a Tasks tab that is not open, like Resolved tab above, you have to say so on that tab.

#### Resolved Task B-all-439<a name="b-all-439"></a>  
Two T-all-2147 tasks were created - number didn't increment. Need serious fix there - **double check is consistent read on the read side.**

#### Resolved Task B-all-438<a name="b-all-438"></a>  
Progress section should be open by default.

## Job J-all-308<a name="j-all-308"></a>
### More with notes.


This job is in stage Complete.
#### Reports 
#### Report R-all-150<a name="r-all-150"></a>  
Ready to look at — two of three tasks resolved, one sub-piece gated on Q-all-94.

**T-all-2140 (resolved)** — delete on child notes restored, per Q-all-93's answer (all replies). The May refactor (988c7bc32) had switched reply deletion to enableActions/isDeletable props but only wired them through the compressed-thread path; they are now also wired through the normal display path and nested ThreadedReplies. Every reply at any depth — child notes included — shows the red delete icon under the same rule as root comments (actions enabled, not archives/inbox/being-edited). To test: open a note with a child note (e.g. the R-Marketing-11 case) and the delete icon should be on the child.

**T-all-2142 (resolved)** — resolved tasks now show an "Add note" button for any collaborator. It opens the reply wizard in a new note-only mode ("What is your note?", no type radio) and creates a normal task-level note (top-level REPORT with associated_comment_id), so the task stays resolved. Replies/grouped subtasks on resolved tasks remain disallowed. To test: open any resolved task and use Add note; the note should appear under that task in the Notes tab.

**T-all-2141 (open)** — the Notes tab explain text and the documentation site's MCP page get_job row now both state: notes are not included by get_job unless include_all_resolved is passed, a note with a reply is always included, and reviews are always part of the job markdown. The only remaining piece is whether the distributed workflow rules file (public/scripts/CLAUDE.md) also gets a mention — that's Q-all-94, where I replied to your counter-question.

All changes are uncommitted in uclusion_web_ui (Comment.js, Reply.js, ReplyStep.js, PlanningInvestible.js) and uclusion-documentation (mcp.md); eslint is clean.

> ##### Reply C-all-953<a name="c-all-953"></a> 
Leave off ", but reviews are always included in the job markdown." from the explain text but keep in the documentation. Don't want stuff about reviews in the notes section as no reviews there.

#### Notes 
#### Note R-all-147<a name="r-all-147"></a>  
Fixed per Q-all-93 (all replies, parity with root comments). Root cause: commit 988c7bc32 switched the reply delete button to enableActions/isDeletable props but only wired them through the compressed-thread path. Now wired through the normal display path (InitialReply in Comment.js) and the nested ThreadedReplies/ThreadedReply chain in Reply.js, so every reply — including child notes at any depth — shows the delete icon whenever actions are enabled (not in archives, not in inbox, not being edited), same rule as root comments. The delete wizard confirmation is unchanged.

#### Note R-all-151<a name="r-all-151"></a>  
Finished per Q-all-94 (For vote on correcting the rules file, kept brief) and the R-all-150 review reply. Final state: (1) UI Notes tab explain text — notes can be added at task or job level, and get_job only includes notes when include_all_resolved is passed or a note has a reply; the reviews clause was dropped from the UI text as requested since the notes section has no reviews. (2) Documentation site MCP page get_job row — reviews listed in what comes back, notes excluded by default with the include_all_resolved flag, the note-with-reply exception, and the flag expanding compressed resolved comments. (3) Distributed rules file public/scripts/CLAUDE.md step 1 — list now ends "blockers, and reviews" plus two brief sentences: notes only included with include_all_resolved (except a note with a reply, always included), and the same flag returns resolved comments in full instead of truncated. ~/.claude/CLAUDE.md not touched — it gets refreshed by the install script.

#### Note R-all-149<a name="r-all-149"></a>  
Partially done. (1) UI: the Notes tab explain text now reads that notes can be added at the task or job level, that get_job only includes notes when include_all_resolved is passed or a note has a reply, and that reviews are always included in the job markdown. (2) Documentation site: the get_job row in the MCP page (uclusion-documentation, Github and CLI integrations/mcp.md) updated the same way — reviews listed in what comes back, notes excluded by default with the include_all_resolved flag and the note-with-reply exception explained. Remaining: whether to also touch the distributed workflow rules file (public/scripts/CLAUDE.md) is gated on Q-all-94, where I answered your counter-question — note the rules file's step 1 currently claims get_job loads "notes", which is now inaccurate either way.

#### Note R-all-148<a name="r-all-148"></a>  
Done. A resolved task now shows an "Add note" button (any collaborator, desktop and mobile, not in archives). It opens the existing reply wizard in a new note-only mode: the wizard asks "What is your note?", hides the reply/note type radio, and locks the type to a note — so the created comment is a top-level REPORT with associated_comment_id pointing at the task, exactly like notes on unresolved tasks, and the task itself stays resolved. Replies and grouped subtasks on resolved tasks remain disallowed.

#### Resolved 
#### Resolved Task B-all-431<a name="b-all-431"></a>  
**If there is a reply to a note then you must include it - regardless of flag.**

**Also consider only screening out AI notes OR COMPRESSING so that AI knows the notes are there and can ask for them.**

#### Resolved Question Q-all-94<a name="q-all-94"></a>  
T-all-2141: I plan to update (1) the Notes explain text in the UI (the DismissableText "Notes can be added to at the task or job level." shown on the Notes tab) and (2) the get_job row plus surrounding text in the documentation site's MCP page (uclusion-documentation content/en/Github and CLI integrations/mcp.md) — both saying notes are NOT included by get_job by default but are when include_all_resolved is passed, and that reviews ARE always included in the job markdown. Should the same explanation also go into the distributed workflow rules file (public/scripts/CLAUDE.md, the uclusion-workflow block installed into ~/.claude/CLAUDE.md etc.)? Adding it to the rules file would actually change AI behavior — agents would know to pass include_all_resolved when they need notes — but it grows the rules file beyond pure workflow steps.

#### Option O-1<a name="o-1"></a>
#### Yes — also add to the workflow rules file
Add a sentence in the '1. Read' step of public/scripts/CLAUDE.md (and mirror in your ~/.claude/CLAUDE.md block): by default get_job compresses resolved comments and omits notes; pass include_all_resolved true to get them; reviews are always included. This makes agents actually use the flag.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The task explicitly says "explain text and also documentation" — the rules file is the documentation agents actually read at runtime, and one sentence in the Read step makes them use include_all_resolved when notes matter instead of hoping they notice the schema description. B-all-431 in this job shows note visibility to the AI has already bitten once.

> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Okay let's correct the rules file but keep it brief. Another point to mention is that resolved tasks only come back in truncated form unless the same flag is used.

##### Question Q-1<a name="q-1"></a> (under Q-all-94 ▸ option O-1) 
I have a description on the get_job include_all_resolved field. Is that not sufficient?

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
The field description is sufficient for discoverability — an agent that reads the schema can find include_all_resolved on its own. Two reasons I still lean toward a rules-file mention: (1) the rules file's step 1 currently says get_job loads "the job and all its child tasks, grouped tasks, questions, suggestions, notes, and blockers" — after this change that sentence overstates what comes back by default, so it needs touching anyway for accuracy; (2) in practice agents weight explicit workflow instructions more heavily than parameter descriptions, and in long sessions tool schemas can drop out of context while the rules file persists. A minimal fix would be just correcting that step-1 sentence (e.g. "notes only when include_all_resolved is passed; notes with replies and reviews always come back") rather than adding a new paragraph. But if you prefer to keep the rules file lean, the description alone is workable — happy to go with O-2.

#### Option O-2<a name="o-2"></a>
#### No — UI explain text and documentation site only
Keep the rules file purely about workflow steps; the tool's own description already mentions include_all_resolved, so agents can discover it from the schema.


This option is in stage In Dialog.
#### Resolved Task T-all-2140<a name="t-all-2140"></a>  
Can't delete a child note see [Tell other like minded developers how to control the AI flow and offer them... - R-Marketing-11](https://stage.uclusion.com/dialog/dd56682c-9920-417b-be46-7a30d41bc905/a6385bec-cccf-4671-afae-a9658e1e39cb#c9932cf0f-c4f5-4b51-a3bb-11b76101dcbf)

#### Resolved Task T-all-2142<a name="t-all-2142"></a>  
Can't add a note to a resolved task and no reason not to allow that.

#### Resolved Question Q-all-93<a name="q-all-93"></a>  
T-all-2140: The child-note delete button disappeared because commit 988c7bc32 switched replies to the enableActions/isDeletable props but only wired them through the compressed-thread path — the normal display path and nested ThreadedReplies never receive them. The minimal correct fix wires the props through both paths, but that makes the delete icon appear on EVERY reply (grouped subtasks, question/suggestion replies, etc.) for any collaborator — matching what root comments already do since that refactor. Should I restore delete on all replies, or scope it down?

#### Option O-3<a name="o-3"></a>
#### Only your own replies
Restore the pre-refactor author check for replies: delete icon only when you created the reply (isEditable), on all reply types.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Only child notes
Show the delete icon only when the reply is a child of a note (root comment is REPORT type with BLUE level). Other replies stay non-deletable as today.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### All replies (parity with root comments)
Wire enableActions/isDeletable through the normal InitialReply path and ThreadedReplies so every reply shows the delete icon when actions are enabled, exactly like root comments since the 988c7bc32 refactor. Simplest and consistent — that commit already removed the author/admin check at the root level.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Parity with root comments is what the 988c7bc32 refactor already chose (it removed the author/admin check at the root level); wiring the existing props through the two missed paths is the minimal fix with one consistent rule, and the delete wizard still confirms before anything is removed.

> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
That's correct there is no reason to stop deletion as the original author of the comment may not be available.

#### Resolved Task T-all-2141<a name="t-all-2141"></a>  
Add to the Notes explain text and also documentation that they don't by default get included by get job but can be if include all is used. Also any note with a reply is automatically included so AI can see the reply.

Also explain that reviews are included with the job markdown.

## Job J-all-320<a name="j-all-320"></a>
### Better install
Clean up of the current script is out of scope - I will do it manually.


This job is in stage Complete.
#### Reports 
#### Report R-all-179<a name="r-all-179"></a>  
T-all-2174 (refresh defaults to yes) is implemented and resolved.

public/scripts/uclusionInstall.py: `prompt_yes_no` now accepts a `default` parameter that drives both the [Y/n]/[y/N] hint and the empty-Enter result. The two refresh prompts — "Refresh Uclusion job workflow in ..." (workflow-block replace for CLAUDE.md/AGENTS.md) and "Refresh Uclusion Cursor rule at ..." — pass default=True, so a bare Enter on a rerun keeps the managed blocks current. First-time Append/Create prompts and the project-vs-global scope prompt keep default=No (details + rationale in R-all-178).

Verified offline: script compiles clean, and prompt_yes_no was unit-tested across empty/Enter→default, explicit y/yes/n/no, and unrecognized→default for both default values. As with the rest of this job, the interactive curl|bash path still wants a live run (covered by the end-to-end test in S-all-72) once public/scripts is deployed.

#### Notes 
#### Note R-all-178<a name="r-all-178"></a>  
Done. `prompt_yes_no` in public/scripts/uclusionInstall.py now takes a `default` parameter that controls both the displayed hint ([Y/n] vs [y/N]) and what an empty Enter means. The two refresh prompts — "Refresh Uclusion job workflow in ..." (the workflow-block replace path for CLAUDE.md/AGENTS.md) and "Refresh Uclusion Cursor rule at ..." — now pass default=True, so re-running the installer keeps the managed blocks current on a bare Enter.

Scope note: I read "refreshing" as the prompts gated on an already-installed managed block (verb "Refresh"). The first-time **Append** (adding our block to a pre-existing user file) and **Create** prompts keep default=No, since those modify/create user files rather than refresh our own block; the "Configure at project level instead of globally?" scope prompt also stays default=No (global remains the default). The MCP registrations already refresh silently with no prompt. If you'd rather Append/Create also default to Yes, that's a one-line flip per branch — say the word.

Verified: script compiles, and an offline test of prompt_yes_no covers empty/Enter→default, explicit y/n, and unrecognized input→default for both default values.

#### Note R-all-176<a name="r-all-176"></a>  
Implemented in public/scripts/ (the served source; build/scripts/ are generated artifacts, left untouched).

T-all-2164 — Always user-local, no sudo (per Q-all-113 O-4):
- Install dir is now ~/.local/uclusion-cli/v1/current/bin and symlinks land in ~/.local/bin (was /usr/local). The three *_with_sudo_if_needed helpers were replaced with plain ensure_dir/install_file/create_symlink — no sudo path remains.
- Added warn_if_not_on_path(): after linking, the installer warns and prints an `export PATH=...` line if ~/.local/bin isn't on PATH.
- MCP registrations now reference ~/.local/bin/uclusionMCPProxy.py automatically (MCP_PROXY_SYMLINK_PATH derives from SYMLINK_DIR).

T-all-2163 — Interactive project-vs-global (per Q-all-114 O-4):
- New prompt_install_scope(): asks "Configure Uclusion at the project level instead of globally?" (default global). If yes, prompts for a directory path (read from /dev/tty so it works under curl|bash). Empty answer or no terminal falls back to global rather than guessing.
- Global install (install_global) is the prior behavior, unchanged.
- Project install (install_project_level) writes into the supplied dir: uclusion.json, .mcp.json (Claude Code project MCP), .cursor/mcp.json + .cursor/rules/uclusion.mdc (Cursor), CLAUDE.md and AGENTS.md workflow blocks. CLI binaries stay user-global under ~/.local.
- The two near-identical Cursor/Claude MCP writers were unified into register_mcp_json(path, label, wid, env, require_existing). Global files (~/.cursor/mcp.json, ~/.claude.json) pass require_existing=True (never created from scratch, owned by the tools); project files pass False (ours to create).
- Codex has no per-project MCP mechanism (config.toml is global), so project mode registers only Codex's AGENTS.md and leaves ~/.codex untouched. Codex MCP remains global-only.

Q-all-115 — CLI reads project-local config (per O-1):
- uclusionCLI.py load_config now checks ./<json_path> in the cwd first and falls back to ~/.uclusion/<json_path>. Credentials stay user-global (get_credentials unchanged).</json_path></json_path>

Verification: both scripts py_compile clean. Offline unit-tested install_project_level (all six files written correctly, MCP args point at ~/.local/bin), register_mcp_json (skips absent global files, preserves existing keys/other servers, omits env arg for production), warn_if_not_on_path (fires only when dir absent from PATH), and load_config (prefers cwd, falls back to home). The network paths (download + symlink + the interactive prompt under a real curl|bash) were not exercised offline — see the testing suggestion.

#### Resolved 
#### Resolved Question Q-all-113<a name="q-all-113"></a>  
T-all-2164: How should non-root install work? Today the installer targets /usr/local/uclusion-cli with symlinks in /usr/local/bin and escalates to sudo on EACCES. The task says "option for non-root install OR just non-root install always" — which of these do you want?

#### Option O-2<a name="o-2"></a>
#### Flag to opt into non-root
Keep the current /usr/local system install as default, but add a --user (non-root) flag that installs to ~/.local instead. Preserves existing behavior for shared machines while letting individuals avoid sudo.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Always ~/.local/bin
The current use of /usr/local moves to ~/.local instead.


This option is in stage In Dialog.
> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
That's where Claude and codex installs.

#### Option O-1<a name="o-1"></a>
#### Always user-local, no sudo
Drop the system path entirely. Always install to ~/.local/uclusion-cli/v1/current/bin and symlink into ~/.local/bin (no sudo ever). Simplest; removes all sudo prompts. Risk: ~/.local/bin is not on PATH for every shell, so the installer should warn/append to PATH if missing.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Auto-detect, fall back to user-local
Try /usr/local first; if it would require sudo (EACCES) or sudo is unavailable/declined, automatically fall back to ~/.local/bin instead of prompting for sudo. No new flag; zero-sudo for users who lack root, system-wide for those who have it.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Auto-detect with user-local fallback removes the sudo failure mode for users without root while keeping the system-wide install (and its stable /usr/local/bin/uclusionMCPProxy.py path) for users who have it — no new flag to teach. The one wrinkle to handle: when we fall back to ~/.local/bin, the MCP registration must point at the ~/.local/bin proxy path and the installer should warn if ~/.local/bin isn't on PATH.

#### Resolved Question Q-all-115<a name="q-all-115"></a>  
T-all-2163 follow-up: For project-level install, MCP registration works project-locally with no code change (the proxy gets workspaceId from its command args). But the CLI reads its sources config only from ~/.uclusion/uclusion.json (load_config in uclusionCLI.py), so a project-local uclusion.json would be ignored unless the CLI is taught to look in the project dir. Credentials (secret key) stay user-level either way. Should this job also teach the CLI to read a project-local uclusion.json? Note: you said script cleanup is out of scope and you'll do it manually — so this may be intentionally yours to wire up.

#### Option O-1<a name="o-1"></a>
#### Yes - CLI prefers project-local uclusion.json
In this job, modify uclusionCLI.py load_config to look for ./uclusion.json (or ./.uclusion/uclusion.json) in the current directory first and fall back to ~/.uclusion/uclusion.json. Makes the project-level install work end-to-end for the CLI, not just MCP. Credentials stay in ~/.uclusion.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Leaning yes: the sources config (sourcesList ./src, uclusionMDFilePath, extensionsList) is inherently project-specific, so a project-level install that the CLI can't read is only half the feature — MCP would work but `uclusion` runs from the project would still pull global config. Teaching load_config to prefer ./uclusion.json then fall back to ~/.uclusion is a small, contained change (credentials stay user-level). Only at certainty 3 because you explicitly flagged script changes as out-of-scope/manual; if you'd rather own the CLI side, O-2 keeps this job purely installer-side and I'll stop at writing the project-local files.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
No reason not to look locally first.

#### Option O-2<a name="o-2"></a>
#### No - installer only; CLI wiring is yours
Keep this job to the installer: it writes the project-local files (.mcp.json, .cursor/, AGENTS.md, CLAUDE.md, ./uclusion.json) at the chosen path. MCP works immediately; you will wire the CLI's project-local config resolution manually since script changes are out of scope.


This option is in stage In Dialog.
#### Resolved Question Q-all-114<a name="q-all-114"></a>  
T-all-2163: A "project level install" writes the workspace config + MCP registration + workflow docs into the current project directory instead of the user's home. Two decisions: (a) how is it triggered, and (b) what gets written where? What scope do you want for the project-level option?

#### Option O-3<a name="o-3"></a>
#### Always project-level (cwd is the install)
No flag — always write config/MCP/workflow into the current directory and drop the home-dir writes. Makes every install project-scoped. Simplest mental model but breaks the existing global single-config-for-all-projects setup.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Have them choose project level or global install with the default being global.
If they choose project level they have to give a path.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
A flag is too complicated.

#### Option O-1<a name="o-1"></a>
#### --project flag, project-scoped MCP + config
Add a --project flag (default stays global/home). When set, write to the cwd: ./.mcp.json (Claude Code project MCP), ./.cursor/mcp.json + ./.cursor/rules/uclusion.mdc (Cursor project), ./AGENTS.md (Codex), ./.uclusion/uclusion.json, and ./CLAUDE.md workflow block. CLI binaries still install user/system-wide (that part is T-2164); only config/registration becomes project-local.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
An opt-in --project flag preserves today's global default (no behavior change for existing users) while giving a clean project-scoped mode. Scoping all four surfaces (./.mcp.json, ./.cursor/, ./AGENTS.md, ./.uclusion/uclusion.json, ./CLAUDE.md) is the consistent choice — config-only would leave the workflow docs global, which is confusing when someone clones a repo expecting it to be self-contained. CLI binaries staying out of the project (handled by T-2164) is correct since you don't want per-repo copies of the executables.

#### Option O-2<a name="o-2"></a>
#### --project flag, config only
Add a --project flag that only relocates the workspace config (./.uclusion/uclusion.json) and MCP server registration (./.mcp.json, ./.cursor/mcp.json) into the project, but leaves workflow instruction docs (CLAUDE.md/AGENTS.md/.mdc) global in home. Lighter touch.


This option is in stage In Dialog.
#### Resolved Report R-all-177<a name="r-all-177"></a>  
Both tasks implemented in public/scripts/ and ready to review.

T-all-2164 (non-root install): the installer is now always user-local — installs to ~/.local/uclusion-cli/v1/current/bin, symlinks into ~/.local/bin, and has no sudo path at all. It warns (with a copy-pasteable export line) if ~/.local/bin isn't on PATH. MCP registrations point at ~/.local/bin/uclusionMCPProxy.py.

T-all-2163 (project-level install): the installer now asks, after the binaries are placed, whether to configure globally (default) or at the project level. Project level prompts for a directory and writes uclusion.json, .mcp.json, .cursor/mcp.json, .cursor/rules/uclusion.mdc, CLAUDE.md, and AGENTS.md into it; global is the unchanged prior behavior. The Cursor/Claude MCP writers were unified into one register_mcp_json. Codex MCP stays global-only (no per-project mechanism); project mode gives Codex just its AGENTS.md.

Also (Q-all-115): uclusionCLI.py load_config now prefers ./uclusion.json in the cwd, falling back to ~/.uclusion, so a project-level install actually drives the CLI. Credentials stay user-global.

Decisions and the full file-by-file breakdown are in R-all-176. Both scripts compile clean and the file-writing logic is unit-tested offline (project-level output, global MCP skip/merge semantics, PATH warning, and CLI cwd-preference all verified). The network/interactive paths still need a live run — I filed S-all-72 with the exact end-to-end test to do after public/scripts is deployed. build/scripts/ are generated artifacts and were intentionally not edited.

#### Resolved Task S-all-72<a name="s-all-72"></a>  
End-to-end install test before this ships. The file-writing logic is unit-tested offline, but the network paths weren't exercised: run the real bootstrap against stage — `curl -fsSL https://stage.uclusion.com/scripts/install.sh | bash -s -- <workspaceId> <viewId> stage` — after the updated scripts are deployed, and confirm: (1) scripts land in ~/.local/uclusion-cli + ~/.local/bin with no sudo prompt; (2) the PATH warning shows when ~/.local/bin isn't on PATH; (3) the global-vs-project prompt reads input correctly under curl|bash; (4) a project-level run writes the six files into the chosen dir and `uclusion` run from that dir picks up its local uclusion.json. Note this needs a deploy of public/scripts first.

#### Resolved Task T-all-2164<a name="t-all-2164"></a>  
Have option for non root install or just non root install always.

#### Resolved Task T-all-2163<a name="t-all-2163"></a>  
Add project level install option to Uclusion AI / CLI install script.

#### Resolved Task T-all-2174<a name="t-all-2174"></a>  
The default for refreshing should all be yes refresh.

## Job J-all-321<a name="j-all-321"></a>
### Better UI.
For choices that need to be visually shown a temporary file in this build can be used and each option labeled. If a screen shot is necessary can take one with Playwright or whatever and then make the screen shot display in the temporary file.


This job is in stage Complete.
#### Reports 
#### Report R-all-223<a name="r-all-223"></a>  
T-all-2168 "Better Quill type-into box" is ready to look at (per the answered Q-all-140, option O-1, plus S-1 and the C-all-1003 mobile fix). You confirmed it live: three rows on mobile with the trash on the last row.

Changes (all in the shared editor, so they land everywhere the composer appears):
- Narrower composer: the editable editor is capped to ~680px (src/components/TextEditors/QuillEditor2.js); read-only display is untouched.
- GMail-style toolbar: the relocated Quill toolbar is now a rounded light-grey pill instead of a flat full-width grey bar (src/components/TextEditors/editorStyles.css).
- Trash that clears the editor (S-1): added a custom 'clear' toolbar button (trash icon, "Clear" tooltip) with a handler that empties the editor via the normal text-change pipeline, so the stored draft clears too. It's an editor control, not a wizard control - wizard action buttons are untouched (src/components/TextEditors/Utilities/CoreUtils.js + QuillEditor2.js).
- Trash placement: on desktop it's pushed to the far right of the last toolbar row so the formatting icons fill the rows above it; on mobile it's a regular toolbar control (no far-right push) so it never gets stranded on its own row (editorStyles.css media query). This resolves C-all-1003 (the wide right margin on mobile).
- Mobile: the table button is dropped from the toolbar (filtered out when the editor's mobile layout flag is set) to keep the controls within three rows.

eslint passes on all three files. No verification suggestion needed - you confirmed desktop + mobile live. S-1 couldn't be resolved via the tool (404); please close it if it looks right.

#### Notes 
#### Note R-all-180<a name="r-all-180"></a>  
Implemented the approved O-1 (true pill) look. Files changed:

1. src/components/Buttons/SpinningIconLabelButton.js — all variants now share a pill base: border-radius 999px (perfect pill at any height, fixing the size-dependent rounding that the old hard-coded 15px caused), compact padding (4px 16px), a soft drop shadow, a hover lift (stronger shadow), and a press dip (translateY(1px) scale(0.985)) with a 0.06–0.15s transition. Added a new `primary` prop that renders the solid-blue (#2F80ED) fill with white label + white icon for the main affirmative action (per S-1); `primary` composes with `noMargin`. Dark variant restyled to match.
2. src/components/AddNewWizards/WizardStylesContext.js and src/components/InboxWizards/WizardStylesContext.js — actionPrimary / actionNext / actionSecondary border-radius 8px -> 999px so the large wizard buttons (Next job / All done) match the pill shape.

Scope notes:
- Colors were intentionally left alone except for the new primary fill — palette/contrast is the separate task T-all-2173.
- The button's own press feedback is included here because option O-1 bundled it, but the broader "make every clickable thing animate on click" work (e.g. the navigation button) is the next task T-all-2170.
- `primary` is wired as a capability but not yet applied to specific call sites; that sweep is pending the live look-check (S-all-73).

Verification: eslint passes clean on all three files. I could not run the authenticated app here to screenshot the rendered result — see S-all-73 for the requested live visual check.

#### Note R-all-187<a name="r-all-187"></a>  
Selectable pills chosen (Q-all-124). Built a reusable component and converted one site as a live proof before sweeping all 14.

1. New component: src/components/Buttons/ChoicePills.js — single-select pills matching the new buttons (transparent pill, brand-blue filled when selected), theme-aware (light/dark), keyboard operable (Tab to a pill, Enter/Space to choose, role=radiogroup/radio + aria-checked), and supports a per-option `tooltip` so a long name can show a short pill label with the explanation on hover (S-1).
2. Converted: src/components/AddNewWizards/Compose/ChooseTypeStep.js ("What do you want to create?") from RadioGroup to ChoicePills.

Please verify that one step live (light + dark): pills look right, single-select works, keyboard works. Once you confirm, I'll sweep the remaining 13 RadioGroups. For the long-label sites (e.g. JobDescriptionStep, where jobTypeLabelREADY = "Ready to assign - also in status" and a per-option certaintyTip tooltip already exists), I'll shorten the pill label and move the explanatory part to the tooltip per S-1.

Note: the pill keyboard model is Tab + Enter/Space rather than radio arrow-key roving; the choice is still fully operable. eslint passes on both files.

> ##### Reply C-all-977<a name="c-all-977"></a> 
When something is already in vertical form like Choose type the

'Job - holds assignments, tasks, questions, suggestions, blockers, and status'

should be broken up as 'Job' in a pill plus ' - holds assignments, tasks, questions, suggestions, blockers, and status' after it.

#### Note R-all-217<a name="r-all-217"></a>  
Implemented O-4 (your added option: clean text on desktop, icons on mobile) per the answered Q-all-138.

Why O-4 and not plain O-1: on mobile the GMail tabs already blank the text label (useLabel='' in GmailTabItem) and show the icon only, for space. So simply dropping the icon would have left mobile tabs with nothing - O-4 keeps icons on mobile.

File: src/pages/Investible/Planning/PlanningInvestible.js (header markup only; GmailTabItem and the shared getIcon are untouched, so other tab strips are unaffected):
- Each of the four header GmailTabItems now passes icon={mobileLayout ? <outlined></outlined> : undefined} - no icon on desktop, an icon on mobile.
- Mobile icons refined to outlined variants for a lighter look: InfoOutlined / AssignmentOutlined / ContactSupportOutlined / NoteOutlined (replacing the old filled Info/Assignment/ContactSupport/Note).
- Desktop tabs are now label + outlined count chip only; the selected tab keeps the existing blue text + blue underline, others neutral grey - so the icon/underline/chip color clash is gone.
- Removed the now-unused getIcon and InfoIcon imports.

eslint passes. Live verification filed as S-all-78. Mockups are temporary build files tmp-jobheader-tabs.html (the three options) and tmp-jobheader-shipped.html (the shipped O-4); both will be removed before commit.

This is the fourth grouped task under T-all-2172 "Better icons" (C-all-988 -> R-all-211, C-all-990 -> R-all-213, C-all-992 -> R-all-215).

#### Note R-all-191<a name="r-all-191"></a>  
Converted the final 3 (per your go-ahead) — all 14 RadioGroups are now ChoicePills, eslint clean.

1. JobDescriptionStep (job certainty IMMEDIATE/READY/NOT_READY): horizontal pills; each "Name - description" label is split so the pill shows the name and the explanatory remainder is the hover tooltip (S-1). Kept the onChange function (hotkeys ctrl+alt+1/2/3 call it), passing {target:{value}}.
2. AddInitialVote and AddEditVote (voting certainty 5/25/50/75/100, desktop): horizontal pills, keeping the existing certaintyTip tooltips. Values passed as strings to match the prior radio + hotkey behavior; the comment editor still focuses on selection; ctrl+alt+1..5 hotkeys still work. Mobile keeps its dropdown Select unchanged.

Keyboard model is now Tab + Enter/Space instead of arrow-key roving. The arrow-key tracking refs (arrowKeyChangeRef) in the two voting/JobDescription files are now vestigial (always false → editor focuses on selection, which is the intended click behavior); left in place to avoid touching the editor-focus logic blind — flagging as a small future cleanup.

Please verify the editor-integrated ones live (light + dark): cast a vote (the 5..100 certainty pills + that the editor still focuses and hotkeys work), and the Job certainty step (pill + tooltip). Once you're happy I'll commit and push the whole T-all-2167 sweep.

#### Note R-all-193<a name="r-all-193"></a>  
Working this "point me at spots" style now that I can drive the running app (attached to a logged-in browser, so I can navigate + screenshot + verify alignment myself).

First fix (Comment.js action row): the "In progress" checkbox sat ~5–6px off the buttons' level. Root cause was the same kind of hand-tuned hack the button/pill changes disturbed — the FormControlLabel had `maxHeight: 1rem` + `marginTop: 0.7rem` aligning it to the old taller buttons. Replaced that with `alignSelf: center` so it vertically centers like the buttons (which use align-self: center), and added `padding: 4px` to the checkbox so its height matches the tight buttons. Measured the label-vs-button center offset drop from 5.5px to ~2.5px (visually aligned). Applied the same `alignSelf: center` fix to the "Visible" checkbox and the bug severity dropdown, which had the identical marginTop hack. eslint passes; verified the In-progress case live.

Send me the next alignment/centering spot and I'll fix + verify it the same way.

#### Note R-all-186<a name="r-all-186"></a>  
Resolved. The real cause was flex-row stretch: the comment/bug action row (classes.actions) is display:flex with the default align-items: stretch, so on a bug the buttons stretched to match the taller severity dropdown and looked un-tight. Fix is a single line in SpinningIconLabelButton: align-self: center, so buttons keep their natural tight height regardless of the row. The Move-specific !important / line-height changes I had added while mis-diagnosing this were reverted.

Decided not to change Move's auto-focus grey: per the user it is an intentional indicator that Move is the default action (Enter activates it). The focused Move can read a couple px higher than its neighbours because it renders through FocusRippleButton's detached autofocus path; accepted as-is for now. eslint passes; verified tight live by the user.

#### Note R-all-202<a name="r-all-202"></a>  
Dark-mode follow-up: my first pass used a dark slate (#33444a) box for the items in dark mode, which sat too close to the dark job card and read as barely-changed. Switched the dark-mode item box to a light "paper" box (DARK_TEXT_BACKGROUND_COLOR #C7CBCA, the same color the comment cards use in dark mode) with dark text, keeping the type-colored left accent. Now the items are clearly-defined light boxes in dark mode, paralleling the white boxes in light. eslint passes; verified live in dark.

#### Note R-all-207<a name="r-all-207"></a>  
Fixed. Root cause: a compressed comment row in a wizard draws its type indicator with the new outlined `CommentTypeChip` directly, but when expanded the row switches to `CardType`, and `CardType` only rendered the indicator inside a `{label && ...}` gate. `TODO_TYPE` (Task) and `REPORT_TYPE` (Note) have no default label in `labelIntlIds`, so for those two types the chip vanished on expand. Blocker / Question / Suggestion kept their chip only because they happen to have default labels.

Change (src/components/CardType.js): the comment-type and vote-certainty chip now renders regardless of whether a `label` was supplied (`CommentTypeChip` carries its own "Task"/"Note"/etc. label), instead of being gated on `label`. So the expanded view shows the same chip as the compressed view for every comment type.

Scope/regression check: `TODO_TYPE`/`REPORT_TYPE` only reach `CardType` from comment rendering (Comment.js); the other `CardType` call sites (Voting certainty, Decision OPTION/PROPOSED, Planning stages) use types that were already handled and their label/gravatar-only behavior is unchanged. eslint passes on the changed file.

#### Note R-all-204<a name="r-all-204"></a>  
Fixed the uncompressed (expanded) view. The problem was ragged widths: the expanded comment card used width: fit-content (so each card hugged its own text and they came out different widths), while the compressed cards are full-width. Changed the read-only (removeActions) comment card to width: 100% with maxWidth: 98%, so the expanded cards are full-width and consistent with the compressed ones.

eslint passes. My headless test browser can't reach the jobStage/resolve wizard directly (it hangs on "Page loading" because the market data doesn't sync on a direct wizard URL), so could you verify the expanded cards are now full-width / consistent in your running app? If you also want the expanded card to show the type chip (like the compressed one does) instead of just the avatar + author + dates, say so and I'll add it.

#### Note R-all-182<a name="r-all-182"></a>  
Both issues addressed in src/components/Buttons/SpinningIconLabelButton.js:

1. "Not tight" — reduced the default pill to padding 2px 12px, font 0.9rem, and tightened the icon-to-label gap (startIcon marginRight 4px / marginLeft -2px) so it hugs its content.

2. Dark-mode colors — implemented the chosen option "Match the current background" (Q-all-121 / O-3). The default outlined button background is now `transparent` instead of hard-coded white, so it inherits whatever surface it sits on: white in light mode, the #C7CBCA paper card in dark mode — and it now matches the In-progress checkbox and the wizard buttons above. No theme detection needed; it's correct in both modes by construction. The resting state is flat (border only, like the surrounding controls); hover adds a subtle surface-relative tint (rgba(0,0,0,0.05)) + small shadow, and press keeps the dip. The whiteBackground variant still renders explicit white for buttons that sit on colored (non-white) surfaces.

eslint passes. Please verify live in light + dark — once you confirm, I'll resolve this and finish T-all-2171's primary sweep.

#### Note R-all-188<a name="r-all-188"></a>  
Applied C-all-977. ChoicePills now supports a `vertical` layout with a per-option inline `description`: in vertical mode each option is its own row showing the short name in the pill plus the explanatory text beside it (not in a tooltip). ChooseTypeStep now uses vertical mode and splits each "Name - description" label (e.g. "Job - holds assignments, tasks, questions, suggestions, blockers, and status") into the pill ("Job") and the inline remainder (" - holds assignments, ..."). eslint passes.

So the plan for the sweep distinguishes two layouts:
- Vertical + inline description: sites where options carry a "Name - description" label and there's room (like ChooseType).
- Horizontal pills (+ tooltip for a long name, per S-1): sites with short labels in a row.

Please verify the ChooseType step live now (pill "Job" + inline description, single-select, light + dark). Once you confirm this reads the way you intended, I'll sweep the remaining 13 RadioGroups using the right layout per site.

#### Note R-all-196<a name="r-all-196"></a>  
Inbox notification side (InboxWizards) had the identical oversized gap before the action buttons (60px), from its own copy of the borderBottom divider (also margin 25px 0). Reduced to 14px 0 to match the AddNewWizards change, dropping the gap to ~42px and tightening it consistently across all inbox wizard steps. eslint passes; verified live. (Side note for a later task: on this step "Block instead" renders as plain text while the other two actions are pill buttons - inconsistent, but that's button styling, not spacing.)

#### Note R-all-206<a name="r-all-206"></a>  
Fixed. The approval chip ("Somewhat Certain") is a vote-certainty chip rendered via CardType (Voting.js, type=certainty50 etc.) and was still the old solid style. Extended the outlined CommentTypeChip treatment to the certainty levels too, so the approval chip now matches the rest: outlined, graded orange-red (Uncertain) -> amber -> yellow (Somewhat Certain) -> light green (Certain) -> green (Very Certain). The label and the avatar/name beside it are unchanged. Applies to all certainty/approval chips for consistency.

Files: CommentTypeChip.js (added certainty5/25/50/75/100 entries), CardType.js (certainty types now use the outlined chip). eslint passes.

My headless test browser can't reach the job Overview / approvals view (hangs on "Page loading"), so please confirm in your running app that the approval certainty chip is now outlined and reads well (esp. the yellow "Somewhat Certain" - I used a darker yellow border/text for readability).

#### Note R-all-201<a name="r-all-201"></a>  
Implemented the chosen "White + type accent" (Q-all-130 / O-1). The suggestion / blocker / in-progress items inside the job cards (both swimlanes and the assistance section) now render as a clean white box (dark slate in dark mode) with dark readable text, a subtle border, and a colored left edge indicating the item type, replacing the muted #A9D4D9 teal box with grey #5f6368 text.

Type accent colors (reusing the app's comment-type conventions): blocker/issue = red #E85757, suggestion = orange #F29100, question = blue #2F80ED, in-progress = green #43A047, review = teal #00897B.

Implementation:
- RaisedCard gained an optional cardStyle prop (spread onto the Card) so a caller can set the box background/border dynamically.
- BugListItem: in the compact job-card variant (smallFont) it now builds cardStyle (white/dark bg + border + 4px type-colored left edge) and dark title text, driven by a new commentType prop. Non-smallFont uses (the real bug list, discussion, inbox) are unaffected.
- ArchiveInvestibles (assistance) and PlanningIdeas (swimlane in-progress + review) pass commentType through.

eslint passes on all four files; verified live in light and dark, in both the assistance cards and the swimlane cards (screenshot in chat).

#### Note R-all-190<a name="r-all-190"></a>  
Fixed. The old radios got their vertical spacing from per-item margins (margin: spacing(0,2,2,0) ≈ 16px bottom); the ChoicePills group had none, so the pills sat cramped against the card above and the editor below. Added margin: 0.5rem 0 1rem to the ChoicePills group (both horizontal and vertical layouts) to restore the breathing room. Applies to all converted sites. eslint passes — please verify the spacing now looks right (e.g. the Grouped task / Note step in your screenshot).

Still open: question 2 from R-all-189 — should I convert the 3 remaining voting/certainty pickers (JobDescriptionStep, AddInitialVote, AddEditVote) to pills too (Tab+Enter/Space instead of arrow-key nav), or leave those three as radios?

#### Note R-all-210<a name="r-all-210"></a>  
Implemented O-2 (tinted icon badges) per the answered Q-all-135.

File: src/pages/DialogArchives/ArchiveInvestibles.js
- New module-level `ASSIST_VISUAL` map + `hexToRgba` helper + `AssistanceBadge` (React.forwardRef so MUI Tooltip can attach). The badge is a 26px rounded-square with a 1.5px type-colored border, a soft type-colored tint fill, and the type icon. Theme-aware (lighter border/icon + slightly stronger tint in dark mode).
- `getIcon` no longer bakes a red/orange icon; it returns `{assistanceType, typeExplanation, myMessage}`. Color = type now; the unread/message signal is a red dot drawn on the badge when `myMessage` is set, and read badges are muted (opacity 0.72).
- The icon-row map renders `<AssistanceBadge assistanceType unread={!!myMessage}/>` inside the existing Tooltip + click wrapper (click-to-message / click-to-link behavior unchanged). Added a 6px gap to the row so the bordered badges don't touch.

Color vocabulary matches CommentTypeChip exactly (Blocker #E85757, Suggestion #F29100, Question #2F80ED, plus green #43A047 for needs-assignment) so the badges agree with the outlined comment chips rendered just below in the same card. eslint passes on the file.

Live verification is filed as S-all-75 (can't run the authenticated app in this environment). Mockup of all three options + the as-shipped O-2 look is the temporary build file tmp-assistance-icons.html at the repo root (will be removed before commit).

#### Note R-all-203<a name="r-all-203"></a>  
Implemented Option C (Q-all-133 / type-chip cards). The compressed comment card (Comment.js, used by every wizard that shows comments via CommentBox compressAll - the "these comments will be resolved" step, the reply-parent, etc.) is now a clean full-width card: an outlined chip naming the comment type on the left, the body, and an expand chevron - replacing the cramped avatar + author + body row with ragged fit-content widths. Your updated screenshot shows it working (green "Task" chips on full-width cards).

Type chip label + outlined color follows the comment type: Blocker=red, Suggestion=orange, Question=blue, Task=green, Note=teal, Reply=grey. Also removed the old blue-glow box-shadow on containerBlueLink (used for sent comments) in favor of a clean subtle border + soft shadow.

eslint passes. Light + dark both handled (the card is white in light, the #C7CBCA paper in dark; the chip stays white-bg + colored border + dark colored text, readable on both). Let me know if you want any tweak (chip wording, sizing) before I commit.

#### Note R-all-184<a name="r-all-184"></a>  
Root cause found (your dropdown hunch was close — it was actually the button next to it). The non-tight button was the bug's "Move" button, which is rendered with the `focus` prop. That makes it use FocusRippleButton, and when autoFocus is set FocusRippleButton does a detached ReactDOM.render into a bare div (a documented workaround for a MUI<5 autofocus bug). That detached subtree has no ThemeProvider/StylesProvider, so MUI re-injects its DEFAULT button base styles after our pill class; at equal CSS specificity the later MUI rules win, and the button reverts to MUI's default padding/radius (and the default grey focus-visible background). So every focused button — not just on bugs, but bugs are where it was visible — skipped the tight pill.

Fix (src/components/Buttons/SpinningIconLabelButton.js): added !important to the pill padding and border-radius so the tight geometry wins regardless of stylesheet insertion order. !important is idiomatic here — the wizard button styles already use it throughout. Verified no caller overrides button padding inline, so this is safe. The grey focus-visible tint remains as the keyboard-focus indicator (pre-existing, not part of the reported defect).

eslint passes. Please verify the bug's Move button is now tight (light + dark).

#### Note R-all-198<a name="r-all-198"></a>  
Committed and pushed the alignment pass (commit T-all-2166, bcc698956): comment-action-row checkbox/dropdown centering + left margin, wizard section-divider tightening (both wizard families), Add-wizard left margin matched to inbox, and scoped title-above-pills bottom padding (BugDescriptionStep, TaskToBugStep, ChooseGroupStep, ConfigureCommentStep). All verified live via the running app and eslint-clean. The title-above-choice padding was kept scoped per-step (inline style on those titles) rather than changed globally on introText, per user note. Resolving for now; more alignment spots can be filed as needed.

#### Note R-all-185<a name="r-all-185"></a>  
Good catch — same root cause, one property I hadn't pinned. My fontSize (0.9rem) was not !important, so in the detached focus-render path (the Move button) it reverted to MUI's smaller default font while Reply/Resolve kept 0.9rem, and MUI's tall default line-height inflated the themed buttons. That made the heights diverge (Move shorter).

Fix (src/components/Buttons/SpinningIconLabelButton.js): made fontSize 0.9rem !important too, and set the label line-height to 1.2 so the 18px start-icon drives the button height. Now padding, radius, and font are all consistent across the themed and detached render paths, and the icon gives every button the same height. So Reply / Move / Resolve should now be identical height and uniformly tight.

eslint passes. Please verify the three are the same height now (light + dark).

#### Note R-all-183<a name="r-all-183"></a>  
Tightened the top-right navigation ("Next task") button in src/components/Menus/NavigationChevrons.js (magicButton style): padding 6px 16px -> 3px 12px and font 0.9rem so it hugs its content. Also changed its radius from 8px to 999px so it's a pill consistent with the rest of the buttons (it was still a rounded rectangle). Hover behavior (blue fill) and the actionButton background are unchanged. eslint passes — please verify live.

#### Note R-all-221<a name="r-all-221"></a>  
Applied the same Q-all-138 (O-4) treatment from the job header (C-all-994) to the view-level tab strip. No new question - the direction was already decided and approved on Q-all-138.

File: src/pages/Dialog/Planning/PlanningDialog.js (the Job Progress / Job Backlog / Bugs / Notes·Discussion GmailTabs):
- Each tab now passes icon={iconOnlyTabs ? <outlined></outlined> : undefined}, so icons show only on mobile (text-only on desktop). Gated on a new iconOnlyTabs = useMediaQuery(breakpoints.down('sm')) - this matches GmailTabItem's own sm breakpoint where it hides the label, rather than the file's local mobileLayout which is down('md').
- Mobile icons refined to outlined variants to match the header: AssignmentIndOutlined (Job Progress), AssignmentOutlined (Job Backlog), BugReportOutlined (Bugs), LightbulbOutlined (Notes·Discussion, already outlined). Swapped the imports (the old filled icons were only used here).
- The selected tab keeps the existing blue text + blue underline (indicatorColors unchanged) and the outlined count chips (e.g. "1 critical") are unchanged. Removing the desktop icons is what clears the heavy-icon/color clash.

GmailTabItem/GmailTabs untouched. eslint passes. Live verification filed as S-all-80. Mockup is the temporary build file tmp-viewtabs.html (removed before commit).

Sixth grouped task under T-all-2172 "Better icons".

#### Note R-all-216<a name="r-all-216"></a>  
Follow-up tweak (per request): the vote/approve icon (ThumbsUpDown) is now purple instead of neutral grey, giving the "vote" action its own identity distinct from the type colors. Added a 'vote' entry to TYPE_ICON_COLORS (light #7C3AED, dark #B794F6) and applied tColor('vote') to the ThumbsUpDown icon in both the inline option toolbar and the right-click context menu. The promote/demote arrows and make-task still stay neutral grey. eslint passes; updated screenshot sent in chat.

#### Note R-all-199<a name="r-all-199"></a>  
Implemented the chosen White pill (Q-all-129 / O-1). In Sidebar.js the selected (isActive) item background changed from grey (#e0e0e0 light / 'grey' dark) to a clean elevated pill: #FFFFFF in light, #3C4F52 in dark, with a soft box-shadow (0 1px 3px rgba(16,40,40,0.22)) so it reads as a distinct, intentional selection against the deeper teal sidebar. eslint passes; verified live in both light and dark (screenshot in chat).

#### Note R-all-192<a name="r-all-192"></a>  
Done on "How would you describe this job?" (JobDescriptionStep):
- Tooltip font: ChoicePills now renders the hover text at 0.95rem (the default MUI tooltip font is tiny). This also restores the larger hover text on the other tooltip pills (GroupName, BugDescription).
- Keystrokes in parentheses: the tooltip now shows the explanatory remainder of the label followed by the hotkey in parens — e.g. "Ready to assign" pill -> hover "also in status (ctrl+alt+2)"; "Immediate" -> "assign now (ctrl+alt+1)"; "Not ready" -> "only in backlog (ctrl+alt+3)".

eslint passes. Please verify the hover text size + the "(ctrl+alt+N)" suffix. Once you're happy, I'll commit and push the whole T-all-2167 sweep (ChoicePills + 14 sites).

#### Note R-all-214<a name="r-all-214"></a>  
Implemented O-1 (type-colored at rest) per the answered Q-all-137.

File: src/pages/Dialog/Decision/OptionMenu.js
- New module-level TYPE_ICON_COLORS map (task/issue/suggest/question, each {light, dark}) using the same red/orange/blue/green as CommentTypeChip and the badges. Added theme/isDark and a tColor(key) helper.
- Inline option toolbar (the icons shown on an expanded option row): the four add-a-typed-comment icons now use their type color via htmlColor={tColor(...)} - add-Task green, add-Blocker red, add-Suggestion orange, add-Question blue. The promote/demote arrows, make-task (ListAlt) and vote (ThumbsUpDown) keep the neutral actionButtonColor.
- Same coloring applied to the matching items in the right-click context menu so the two stay consistent.
- Swapped the add-Task icon from Notes to AssignmentIcon (Task) in both the toolbar and the menu, since Notes now reads as Note/Report in the new vocabulary. Removed the now-unused Notes import.
- The circular button hover is MUI IconButton's default; behavior/onClicks unchanged.

eslint passes. Live verification filed as S-all-77. Mockup is the temporary build file tmp-option-icons.html (will be removed before commit).

This is the third and last grouped task under T-all-2172 "Better icons" (C-all-988 -> R-all-211, C-all-990 -> R-all-213), so once all three are confirmed live the parent is safe to resolve.

#### Note R-all-194<a name="r-all-194"></a>  
Follow-up: compacting the checkbox padding exposed MUI's default -11px label margin, leaving the checkbox nearly flush with the comment's left edge. Added marginLeft: 4px to the In-progress and Visible FormControlLabels so the checkbox left-aligns with the comment text (measured checkbox left x=304 vs text x=305) while staying level with the buttons. eslint passes; verified live.

#### Note R-all-197<a name="r-all-197"></a>  
Left margin: the Add wizard content started ~23px further left than the Inbox wizard (measured title left x=297 vs 320). Cause was different baseCard styling between the two wizard style files: AddNewWizards used a fixed paddingLeft: 32px, InboxWizards used marginLeft: 5% (scales with width, so larger). Per the user's preference for the inbox look, changed AddNewWizards baseCard to the same marginLeft: 5% (and the md breakpoint to marginLeft: unset, matching inbox). Add content now lands at x=320, identical to inbox. (User wondered if inbox was in an extra container; checked empirically - it was just the 5% margin, no extra offset.) Applies to all AddNewWizards steps. eslint passes; verified live.

#### Note R-all-195<a name="r-all-195"></a>  
Wizard step spacing (AddCommentStep / job comment wizard): the components are intro title, sub text, JobDescription block, an invisible section divider (borderBottom), then the CommentAdd editor. Measured gaps were uneven: 24, 32, 15, 29, then an 81px jump before the editor. The 81px came from the shared wizard `borderBottom` divider's 25px margins. Reduced borderBottom margin 25px -> 14px, which drops the editor gap to ~61px and tightens it consistently across all AddNewWizards steps. The remaining gaps group logically (title+subtitle, then the job-description block, then the editor section). The 15/29 gaps are internal to the shared JobDescription component, so I left those untouched to avoid affecting the job views. eslint passes; verified live. Asked the user whether to tighten further.

#### Note R-all-212<a name="r-all-212"></a>  
Implemented O-1 (restyle, keep count) per the answered Q-all-136.

To make the swimlane clock genuinely MATCH the assistance section (and stop the two from drifting apart again - which is what this task was about), I extracted the badge into one shared component instead of duplicating it:
- New: src/components/CustomChip/TintedIconBadge.js - the tinted icon badge (colored border + soft tint + icon + optional red unread dot), forwardRef so a Tooltip can attach. Props: icon, palette {base, icon, baseDark, iconDark}, unread (red dot), dim (fade), size/iconSize. Holds the hexToRgba helper.
- src/pages/DialogArchives/ArchiveInvestibles.js: AssistanceBadge is now a thin wrapper over TintedIconBadge (passes the type's palette + dim={!unread}); ASSIST_VISUAL unchanged. No visual change to the assistance section - same look, just shared code now.
- src/pages/Dialog/Planning/PlanningIdeas.js:
 - The overdue/report-required Schedule clock is now <tintediconbadge icon="{Schedule}" palette="{CLOCK_PALETTE}" unread="{isInInbox(doesRequireStatusMessage)}/"> (orange, matching the assistance Suggestion badge). Red dot only when the report is an unread inbox message; click-to-inbox preserved, pointer cursor only when clickable.
 - getMessagesChip: the "N new" pill (which had escaped the format - it was a solid warningColor fill) now uses outlinedChipStyle('red', isDark), keeping its count, text and click behavior. Removed the now-unused warningColor.</tintediconbadge>

Per O-1 the clock badge and the "N new" chip remain separate elements (no message-count logic touched), since unrelated notifications shouldn't be collapsed into the overdue dot. eslint passes on all three files. Live verification filed as S-all-76. Mockup is the temporary build file tmp-swimlane-icons.html (will be removed before commit).

#### Note R-all-200<a name="r-all-200"></a>  
Followup: dropped the sub-view color differentiation and moved all the T-2173 sidebar/card colors into named constants.

Constants added in src/components/Buttons/ButtonConstants.js (with light + dark variants, exposed via useButtonColors): SIDEBAR_COLOR #8FC5CC / DARK_SIDEBAR_COLOR #1F2B2D, SIDEBAR_SELECTED_COLOR #FFFFFF / DARK_SIDEBAR_SELECTED_COLOR #3C4F52, CARD_BORDER_COLOR #79AEB5 / DARK_CARD_BORDER_COLOR rgba(255,255,255,0.18). So the whole section-contrast palette is tunable in one place.

The sidebar is now a single uniform color (no sub-view band): the sub-view item backgrounds use sidebarColor instead of infoColor in both Sidebar.js and OtherWorkspaceMenus.js (the For You / From You / Integrations 'different file'), and Screen.js's sidebar paper background also uses the constant so the area behind the menu matches. The selected-item pills across both files now use sidebarSelectedColor (the white pill, C-all-981) instead of grey, for consistency. RaisedCard uses the border constants.

Files: ButtonConstants.js, Sidebar.js, Screen.js, RaisedCard.js, OtherWorkspaceMenus.js. eslint passes on all; verified uniform live in light (#8FC5CC) and dark (#1F2B2D).

Minor note: the OtherWorkspaceMenus selected pills don't carry the subtle box-shadow that the Sidebar.js one does - flag if you want them identical.

#### Note R-all-219<a name="r-all-219"></a>  
Implemented O-1 (mobile kebab "more" menu) per the answered Q-all-139.

The fix turned out to need zero changes to OptionMenu - OptionListItem already wires up the full labeled action menu for right-click (it keeps anchorEl/mouseX/mouseY state, a recordPositionToggle handler, and renders <optionmenu anchorel=".../"> when set). So on mobile I just add a trigger for that same menu.</optionmenu>

File: src/components/Comments/OptionListItem.js
- Where the expanded option row rendered the inline <optionmenu></optionmenu> icon toolbar, it now branches on mobileLayout: on mobile it renders a single kebab (MoreVertIcon via the existing TooltipIconButton, tooltip 'more') whose onClick is recordPositionToggle - which opens the existing positioned action menu. On desktop the inline icon toolbar is unchanged.
- Added the MoreVertIcon import. Reused the existing 'more' translation key for the tooltip; no new strings.

Result: the mobile toolbar can no longer clip - every action lives in the labeled menu (promote/demote, make task, approve/vote, add task/blocker/suggestion/question, each with its C-all-992 type color). One tap deeper on mobile, desktop untouched. eslint passes.

Live verification filed as S-all-79. Mockup is the temporary build file tmp-mobile-icons.html (will be removed before commit).

This is the fifth grouped task under T-all-2172 "Better icons".

#### Note R-all-209<a name="r-all-209"></a>  
Follow-up: the first fix was too broad and regressed intentional chip suppression. Making CardType render the Task/Note chip unconditionally meant the tasks page (where every row is a task, so the "Task" chip carries no information) and other label-less CardType uses started showing a redundant chip.

Corrected (commit 7abac4677): restored the original label-gated suppression and added an `alwaysShowTypeChip` prop on CardType. Comment.js passes `alwaysShowTypeChip={compressAll}`, and `compressAll` is set only by the wizard compressed comment lists (it appears nowhere outside AddNewWizards / InboxWizards). So the type chip persists when you expand a compressed wizard row, but the tasks page and every other context keep their previous behavior.

#### Note R-all-205<a name="r-all-205"></a>  
Done. Replaced the custom outlined "Task"/"Suggestion" chip I had put in the compressed card with the actual CardType component - the same type indicator the reply / uncompressed view shows (the colored chip with icon + label, e.g. the yellow "Suggestion" with the lightbulb). So the compressed and reply views now use the identical type indicator.

Rendered as <cardtype compressed="" resolved="{resolved}" type="{commentType}"></cardtype> with no gravatar, so it shows just the type chip (no avatar) in the clean compressed card layout. eslint passes.

My headless test browser still can't reach the resolve/compressed wizard directly (hangs on "Page loading"), so please confirm in your running app that the compressed card's type chip now matches the reply's (same yellow "Suggestion" chip, etc.).

#### Note R-all-189<a name="r-all-189"></a>  
Swept 11 of the 14 RadioGroups to ChoicePills (all eslint-clean). Layout chosen per site:
- Vertical + inline description: ChooseTypeStep (the "what to create" types).
- Horizontal pills: ChooseCommentTypeStep, ChooseGroupStep, BugDecisionStep, WhereDecisionStep, ConfigureCommentStep, JobReadyStep, BugDescriptionStep (priority, keeps its certaintyTip tooltip), ReplyStep, TaskToBugStep, GroupNameStep (keeps its groupTypeTip tooltip).
Where a site had an event-based onChange reused by hotkeys, I kept that handler and pass it {target:{value}} so hotkeys still work; where it was a simple setter I pass the value directly. Removed now-unused radio styles/imports.

Held back (3 remaining): JobDescriptionStep and the two voting steps AddInitialVote / AddEditVote. These are the editor-integrated certainty/voting pickers: the RadioGroup has arrow-key navigation plus logic that avoids stealing focus into the comment editor during keyboard nav. Pills use Tab + Enter/Space, not arrows, so converting them changes the keyboard model and touches that focus logic — higher risk, so I want to verify the 11 first.

Please verify a sample of the converted wizard steps live (light + dark): e.g. Compose "what to create" (vertical), a type/priority picker (horizontal + tooltip), single-select + keyboard. Two questions once you've looked:
1) Do the 11 look/behave right?
2) Convert the 3 voting/certainty pickers to pills too (accepting Tab+Enter/Space instead of arrow-key nav), or leave those three as radios?

#### Resolved 
#### Resolved Report R-all-218<a name="r-all-218"></a>  
C-all-994 "See about the job header" is ready to look at (per the answered Q-all-138, your added option O-4).

The header tab strip (Overview / Open tasks / Assistance / Notes) had heavy filled icons and a selected state that turned icon+text+underline all blue while the count chips were orange - three clashing color systems, plus a clunky icon+text layout. Now (src/pages/Investible/Planning/PlanningInvestible.js):
- Desktop: text-only tabs - label + the outlined count chip; selected = blue text + blue underline, others neutral grey. The icon/underline/chip color clash is gone and it reads clean.
- Mobile: icons are kept (the labels are hidden there for space, so removing icons would leave nothing), refined to lighter outlined variants - InfoOutlined / AssignmentOutlined / ContactSupportOutlined / NoteOutlined.
- Change is the header markup only; GmailTabItem and the shared getIcon are untouched, so other tab strips are unaffected. Removed the now-unused getIcon/InfoIcon imports. eslint passes.

Detail in note R-all-217; as-shipped screenshot (desktop + mobile, light + dark) sent in chat.

One actionable item, filed as S-all-78 (not folded in here): I can't run the authenticated app here, so please eyeball the header live in light + dark at both desktop and mobile widths - confirm the desktop text tabs read clean and the mobile outlined icons + count number show correctly.

Note: this is the fourth grouped task under T-all-2172 "Better icons" (C-all-988 -> R-all-211, C-all-990 -> R-all-213, C-all-992 -> R-all-215).

#### Resolved Task T-all-2172<a name="t-all-2172"></a>  
Better icons.

#### Resolved Question Q-all-136<a name="q-all-136"></a>  
C-all-990 swimlane icons. Today an overdue/report-required job row shows: a solid-red "1 new" message pill (which escaped the new outlined format) + a bare 24px orange clock + the outlined "N open" count chip — three different visual weights in one row. In all options below the "1 new" pill is converted to the outlined-red chip (the escaped-format fix), and the overdue clock becomes a compact tinted orange badge matching the assistance-section badges. The open judgment call is how to handle the clock + message combo "more concisely, as with the assistance section": do we keep the explicit "1 new" count next to the clock badge, or let a red dot on the clock badge carry the unread signal (dropping the redundant count) the way the assistance badges do? Labeled mockup to follow. (The "N open" task/input count chip is already in the new format and is left alone.)

##### From AI user:
> ##### Reply C-all-991<a name="c-all-991"></a> 
Posted a labeled mockup — temporary build file tmp-swimlane-icons.html at the repo root (screenshot tmp-swimlane-icons.png), one panel per option tagged O-1 / O-2 plus a "Current (today)" panel, each an Accepted-lane row that is overdue with an unread message, in light and dark. O-2 also shows the "also has other unread" case where the outlined-red count chip still appears.

My recommendation: O-2 (consolidate to a dot), certainty 4. Reasoning:
- The task explicitly says to do the clock + message "more concisely now as with assistance section" — and the assistance section's pattern is exactly a tinted badge whose red dot carries the unread signal, with no separate count. O-2 is that pattern; O-1 stops short of it.
- It removes the genuine redundancy in the common overdue case, where the clock dot and the "1 new" pill point at the same report message. One clear indicator beats two.
- The explicit number isn't really lost: the badge tooltip still says how it stands, and any unread BEYOND the report still shows the outlined-red "N new" chip, so multi-message rows keep their count.
O-1 is the safe fallback if you'd rather always keep the visible number and not touch the message-count logic. Either way the escaped "1 new" pill is converted to the outlined-red chip and the clock becomes a tinted orange badge.

#### Option O-1<a name="o-1"></a>
#### O-1 Restyle, keep count
Each indicator is brought into the new visual language but stays a separate element. The overdue clock becomes a tinted orange badge (border + soft tint + clock icon, like the assistance badges); when its report is an unread inbox message it gets the red unread dot. The 'N new' message pill is converted to the outlined-red chip and still shown with its number. So an overdue row with one unread report reads: [orange clock badge •] [1 new] [2 open]. Most information preserved (you still see the count); least behavior change / lowest risk; but the clock dot and the '1 new' chip can both point at the same message, so it is slightly redundant.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Has to be this one because there can be more than one notification where the other notification is not related to over due and so too confusing the other way.

#### Option O-2<a name="o-2"></a>
#### O-2 Consolidate to a dot
Mirror the assistance section exactly: the overdue clock badge carries the red unread dot, and the separate count chip no longer double-reports that same report message — the 'N new' chip is shown only for unread messages OTHER than the report (and still as the outlined-red chip). So a row whose only unread is the overdue report reads just [orange clock badge •] [2 open] — the dot is the 'new'. More concise and most consistent with the assistance badges; the trade-off is you lose the explicit number in the pure-overdue case (the tooltip still says how many), and it touches the message-count logic slightly.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The task asks to make the clock + message "more concise, as with the assistance section," and that section's pattern is precisely a tinted badge whose red dot carries the unread signal with no separate count — which is O-2. It also kills the real redundancy where the clock dot and the "1 new" pill report the same message. The explicit number isn't lost: the tooltip keeps it and any unread beyond the report still shows the outlined-red count chip. O-1 is the safe fallback if you'd rather always keep the visible number and avoid touching message-count logic.

#### Resolved Task T-all-2175<a name="t-all-2175"></a>  
On a bug IE no investible_id the "tight" change did not happen.

#### Resolved Suggestion S-all-76<a name="s-all-76"></a>  
C-all-990 verification (I can't run the authenticated app here, so please eyeball it live in the planning swimlanes, light + dark):
- The overdue / report-required indicator is now a compact tinted ORANGE clock badge (matching the assistance-section badges), not the old bare 24px icon. Confirm it reads well next to the chips and the lane background.
- When that report is an unread inbox item, a small red dot sits on the clock badge; clicking the badge still navigates to the inbox item. When it's only "report required" (not an inbox message), there should be no dot and no pointer cursor.
- The "N new" message chip is now the outlined-red chip (white/transparent fill, red border + red text) instead of the old solid red pill — its count and click-to-inbox behavior are unchanged. Confirm it matches the other outlined chips (e.g. "N open").
- Check a row that has the clock badge AND the "N new" chip together (per O-1 we kept both) — confirm it isn't too busy and stays on one line.

#### Resolved Question Q-all-135<a name="q-all-135"></a>  
C-all-988 "Better icons" for the assistance-section job cards. Today each card shows bare MUI icons (Block / ContactSupport / lightbulb / person-search) tinted RED when there is an unread message and ORANGE otherwise — so color encodes urgency, not type. That clashes with the rest of the now-polished app, where color encodes the comment TYPE (Blocker=red, Question=blue, Suggestion=orange) via the new outlined CommentTypeChip — and the same card already shows those outlined chips on the comment rows just below the icons. So the icon row and the comment rows inside one card currently speak two different visual languages. Which direction should the new indicators take? I will post a labeled mockup of all three. (Separately: in all three I propose color = TYPE to match the rest of the app, and a small dot to carry the unread/urgent signal — flag if you'd rather keep color = urgency.)

##### From AI user:
> ##### Reply C-all-989<a name="c-all-989"></a> 
Posted a labeled mockup of all three options. It's a temporary build file — tmp-assistance-icons.html at the repo root (screenshot tmp-assistance-icons.png) — with one panel per option, each tagged O-1 / O-2 / O-3 to match the options above, and a "Current (today)" panel on top for reference. Each card mirrors a real assistance card: a Question (unread, red dot), a Suggestion (read), a Blocker, the job name, and the outlined comment chip just below, shown in both light and dark.

My recommendation: O-2 (tinted icon badges), certainty 4. Reasoning:
- It fixes the core problem — today color = urgency, but everywhere else (including the comment chip directly below in the same card) color = type. All three options fix that; O-2 does it while staying compact.
- The icon row often shows a combination (question + suggestion + blocker + ready). On a 16rem card, O-1's text pills wrap to a second line once you have 2-3 (visible in the mockup); O-2 keeps the original one-line footprint, so the layout barely changes — it just looks more finished.
- The text label in O-1 is partly redundant: the comment rows right below already say "Question"/"Suggestion" in words, so repeating the word above them adds width without adding information. Tooltips (the existing typeExplanation strings) still give the full text on hover for O-2.
O-1 is a close second if you'd rather have the explicit words and accept the wrapping. O-3 is the safe, quiet choice but throws away the type color the other two add.

#### Option O-1<a name="o-1"></a>
#### O-1 Outlined text chips
Reuse the app's outlined CommentTypeChip vocabulary exactly: each indicator becomes a pill with colored border + colored text — 'Blocker' (red), 'Question' (blue), 'Suggestion' (orange), plus a 'Ready' pill (green) for needs-assignment. Color = type, matching the comment rows directly below and the rest of the app. A small filled dot on a pill marks an unread message. Most explicit and most consistent with desktop CommentTypeChip; widest, so on a narrow (16rem) card two or three pills may wrap to a second line.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### O-2 Tinted icon badges
Each indicator is its icon inside a small rounded-square badge with a soft tint of the type color (blocker red, question blue, suggestion orange, ready green) and a matching colored border — icon-only, so it stays compact like the mobile CommentTypeChip. Color = type. Unread shows as full saturation + a dot; no-unread shows muted. Modern and space-efficient, but relies on icon recognition rather than a text label.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Tinted icon badges fix the color=urgency vs color=type inconsistency (the comment chip in the same card already uses color=type) while keeping the compact one-line footprint of today's icon row. O-1's text pills wrap on a 16rem card once 2-3 indicators show, and the words duplicate the chip labels just below. Tooltips still carry the full text on hover. O-1 a close second; O-3 the quiet fallback.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
I also thought this was the winner without seeing your vote.

#### Option O-3<a name="o-3"></a>
#### O-3 Minimal mono icons + dot
Keep it the quietest: one consistent, uniformly-sized neutral (grey) icon set with matched stroke weight, and a small colored dot appearing only when there is an unread message. Lowest visual weight, least competition with the comment chips below; but it drops the at-a-glance type color the other two options add.


This option is in stage In Dialog.
#### Resolved Task C-all-1003<a name="c-all-1003"></a>  
On mobile not sure if this is a bug or not:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/4f4b2c2b-bfc0-4caf-b801-317afa38d5cb.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

The icons seem to be unable to occupy the space above the trash icon - leaving a wider right margin than desired.

#### Resolved Question Q-all-129<a name="q-all-129"></a>  
C-all-981 (make the selected sidebar item look better than the current grey pill, now that the sidebar is deeper teal). Screenshot selpill.png in chat shows the current grey vs three options on the real sidebar context. Which selected-item treatment do you want (then I implement + verify live, light and dark)?

#### Option O-1<a name="o-1"></a>
#### White pill
Selected item becomes a clean white pill with a soft shadow (keeps the dark text + avatar + 3-dot menu). Crisp and neutral, reads clearly as selected against the teal without competing with the brand blue. This is my recommendation - simplest, looks intentional, and works in light and dark (a dark-elevated pill in dark mode).


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
A clean white pill reads clearly as selected against the deeper teal, looks intentional (vs the current grey that just looks like a default control), and stays out of the way of the brand blue used for primary actions and the active-tab underline. It also maps cleanly to dark mode as an elevated lighter pill. Certainty 3 because this is a pure taste call from the screenshot - Blue filled is the stronger indicator if you want selection to really shout, and White+blue outline is the themed middle ground.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Option O-3<a name="o-3"></a>
#### White + blue outline
Selected item is a white pill with a brand-blue outline. Subtle and clearly themed - the blue ring ties it to the brand while staying light. A middle ground between the neutral white and the bold blue fill.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Blue filled
Selected item becomes a solid brand-blue pill with white text/icons, matching the primary buttons. Strongest, most obvious selection indicator; bolder and more colorful, but heavier and competes a bit with other blue accents (e.g. the active tab underline).


This option is in stage In Dialog.
#### Resolved Task C-all-1001<a name="c-all-1001"></a>  
Same [Better UI. - Q-all-138](#a960a7ee-6b09-4d2f-8ecc-af632472402f) treatment for the tabs at the view level:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/59dc2aec-1f16-42c3-870e-00b42ef6e00c.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task T-all-2166<a name="t-all-2166"></a>  
Where possible improve alignment and centering

#### Resolved Task C-all-996<a name="c-all-996"></a>  
On mobile some icons are hidden.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/d44a44e0-830f-488c-9dfd-c2e7e9bdc943.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Need smaller icons or "more" to see the remaining.

#### Resolved Task T-all-2178<a name="t-all-2178"></a>  
Lists of comments in wizards don't look good. For instance a reply to a parent comment and the compressed parent comment does not look good. Move a job to Tasks Complete and the resolve these comments list of comments that are compressed don't look good.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/3aed0991-452d-43a5-a1df-45c7d3b3a966.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

> ##### Grouped task C-all-987<a name="c-all-987"></a> 
Fix the chip used in an approval:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/6bb81003-9661-4903-b43e-4e7496551510.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Question Q-all-130<a name="q-all-130"></a>  
C-all-982: the suggestion / blocker / in-progress items shown inside the job cards (swimlanes + assistance) currently all look the same - a muted #A9D4D9 teal box with grey #5f6368 text and no border (rendered by BugListItem). Screenshot inneritems.png in chat shows the current look vs three "better look" directions, each of which also makes the item TYPE distinguishable (suggestion=orange, blocker=red, in-progress=blue). Which direction should I implement (then verify live, light + dark)?

#### Option O-1<a name="o-1"></a>
#### White + type accent
Each item becomes a clean white box with dark readable text, a subtle border, and a colored left edge indicating its type (orange=suggestion, red=blocker, blue=in-progress). Crisp and modern, reads clearly against the card, and the thin accent communicates type without much color noise. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
White + type accent fixes both complaints (muted color, missing border) with the cleanest result: white box + dark text gives clear contrast, the subtle border defines the item, and the thin colored left edge communicates type (suggestion/blocker/in-progress) without flooding the small card with color. Tinted-by-type can get busy when several items stack inside one card, and the dot is slightly less legible at a glance than the edge. Certainty 3 because it is a taste call from the screenshot - if you want the type to really pop, Tinted is the bolder pick.

> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Let's see.

#### Option O-2<a name="o-2"></a>
#### Tinted by type
Each item box is filled with a soft type color (light orange / red / blue) with a matching border and dark text. Most colorful and the type is unmistakable at a glance, but it adds the most color to the card and can look busy when several items stack.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### White + type dot
Clean white box with dark text, a subtle border, and a small colored dot on the left for type. Similar to the accent option but with a dot instead of an edge stripe - a touch more subtle/neutral.


This option is in stage In Dialog.
#### Resolved Question Q-all-132<a name="q-all-132"></a>  
C-all-984 progress: I converted the count/status chips to the chosen outlined look app-wide via one shared helper - tab badges (1 critical / 1 new), the bug 'X total' chips, the swimlane 'open' chip, and the sidebar count badges (screenshot in chat), verified light + dark. One judgment call left: the red / yellow / blue severity dots (Critical / Normal / Minor, and the bug-level chips in BugMenu / BacklogMenu / MarketTodos / swimlane rows) are solid color indicators where the color itself is the meaning. Should those also become outlined, or stay solid?

#### Option O-1<a name="o-1"></a>
#### Keep severity dots solid
Leave the red/yellow/blue severity indicators as solid colors. They communicate priority at a glance by color; outlining them (white fill + colored ring) makes them read like empty/unselected radio buttons and weakens the color coding. The outlined treatment is applied only to the count/status chips, which is what looked like saturated blobs. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The severity dots are a different UI element than the count chips: their solid color IS the signal (red=critical etc.), read at a glance. Outlining them (white fill + colored ring) makes them look like empty/unselected radio buttons and weakens the priority coding. The outlined look fixed the count/status chips that read as saturated blobs; the small solid severity dots were not the problem. Keeping them solid is the safer, clearer choice - but it's your call if you'd rather have full visual uniformity.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### Outline severity too
Apply the same outlined treatment to the severity red/yellow/blue chips/dots as well, for full visual consistency with the count chips - accepting that the severity color becomes a border/tint rather than a solid fill.


This option is in stage In Dialog.
#### Resolved Suggestion S-all-80<a name="s-all-80"></a>  
C-all-1001 verification (I can't run the authenticated app here, so please eyeball it live in light + dark). Open a group/workspace view and look at the top-level tab strip (Job Progress / Job Backlog / Bugs / Notes · Discussion):
- On desktop the tabs should now be text only (no icons) - label + the outlined count chip ("1 critical" etc.); the selected tab is blue text with a blue underline, the others neutral grey. Confirm the old heavy-icon / color clash is gone and it matches the job header now.
- Shrink to mobile width: the tabs should collapse to outlined icons only (AssignmentInd / Assignment / BugReport / Lightbulb outlined), since the labels are hidden there for space, with the count chip still showing.
- Confirm clicking each tab still switches sections, and drag-and-drop onto the Job Progress / Job Backlog tabs still works (those tabs have onDrop handlers).

#### Resolved Task C-all-984<a name="c-all-984"></a>  
Chips through out the app don't look good. Examples are the chips on the left sidebar, chips on the tabs, chips in the swimlanes, chips in item rows like bug and backlog job lists, etc.

#### Resolved Question Q-all-137<a name="q-all-137"></a>  
C-all-992 — the option/question toolbar icon buttons. On an expanded option row the action icons (promote/demote arrows, make-task, vote, and the add-blocker / add-suggestion / add-question / add-task buttons) are all flat grey (#8f8f8f) bare icons, so they don't match the new outlined buttons above them or the type-color vocabulary the rest of the app now uses (Blocker red / Suggestion orange / Question blue / Task green). Four of them literally add a typed comment to the option, so they map directly onto those colors. How should these be brought into the new look? In every option below: the four "add a typed comment" icons take their type color, the structural icons (arrows / make-task / vote) stay neutral grey, and each icon gets a subtle circular hover so it reads as a real button. The toolbar only appears on the one expanded option row, so it is never shown list-wide. Labeled mockup to follow. (Separately I propose swapping the add-Task button's icon from Notes to the Task/Assignment icon, since Notes now means Note/Report — flag if you'd rather I leave the icon as-is.)

##### From AI user:
> ##### Reply C-all-993<a name="c-all-993"></a> 
Posted a labeled mockup — temporary build file tmp-option-icons.html at the repo root (screenshot tmp-option-icons.png), one panel per option tagged O-1 / O-2 / O-3 plus a "Current (today)" panel, the option header toolbar in light and dark. In all three the four add-a-typed-comment icons map to: add-Task green, add-Blocker red, add-Suggestion orange, add-Question blue; promote/demote arrows, make-task and vote stay neutral grey; a thin divider separates the structural icons from the type icons.

My recommendation: O-1 (type-colored at rest), certainty 4. Reasoning:
- This toolbar only appears on the one expanded option row, so always-on color is not noisy list-wide — and it gives the at-a-glance meaning O-2 hides behind a hover (you can see which button adds a blocker vs a question without reaching for it).
- It's the most direct "match" to the type-color vocabulary the rest of the app now uses (the same red/orange/blue/green as CommentTypeChip and the badges).
- O-2 is the calmer fallback if you find four colored icons at rest too busy; the color still teaches the mapping on hover. O-3 (outlined pills) is the closest match to the action-button row above but is the heaviest/widest — four colored pills plus the grey structural icons crowd the row.
All three include swapping the add-Task icon from Notes to the Task/Assignment icon (Notes now means Note/Report); say the word if you'd rather keep Notes.

#### Option O-2<a name="o-2"></a>
#### O-2 Color on hover
Same color mapping, but the icons rest in a refined neutral grey and reveal their type color (plus a soft circular tinted background) only on hover/focus. Calmest at rest — the row stays quiet until you reach for a button, then it lights up in the right color. Matches the job's established 'buttons respond on interaction' direction; the trade-off is you don't get the at-a-glance type color without hovering.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### O-1 Type-colored at rest
The four add-a-typed-comment icons carry their type color at rest — add-Blocker red, add-Suggestion orange, add-Question blue, add-Task green — while promote/demote arrows, make-task and vote stay neutral grey. Each gets a subtle circular hover. Because the toolbar only shows on the expanded option row, the color isn't noisy, and you can tell at a glance which button adds what. Most immediately communicative and most 'matching' to the chips; the resting toolbar is more colorful than today.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
This toolbar only shows on the one expanded option row, so always-on color isn't noisy list-wide, and it gives the at-a-glance "which button adds what" meaning that O-2 hides behind a hover. It's the most direct match to the app's type-color vocabulary (same red/orange/blue/green as the chips and badges). O-2 is the calmer fallback if four colored icons at rest feel busy; O-3 (outlined pills) matches the action-button row above but is the heaviest/widest and crowds the row.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Sounds good.

#### Option O-3<a name="o-3"></a>
#### O-3 Outlined chip-buttons
Each add-a-typed-comment action becomes a small outlined pill button in its type color (icon, optionally a short label) like the outlined action buttons directly above; structural actions stay as plain grey icons. Most explicitly 'button-like' and the closest match to the Reply / Add option / Resolve row, but the heaviest and widest — four colored pills plus the grey structural icons can crowd a narrow row.


This option is in stage In Dialog.
#### Resolved Task T-all-2170<a name="t-all-2170"></a>  
Better buttons action - whenever click needs to be smooth animation that clicked - for instance navigation button doesn't

#### Resolved Task C-all-994<a name="c-all-994"></a>  
See about the job header

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/a883f704-b79b-4aba-9b6c-87e7397914c8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

At a minimum the colors on this widget both icons and underline are out of wack but the icon text combination is not great either. Obviously these tabs are patterned on what GMail does but there was no particular reason for that.

#### Resolved Question Q-all-121<a name="q-all-121"></a>  
C-all-967 (under T-all-2171), dark-mode buttons — re-asking with clean option names (the prior Q-all-120 had letter-coded names that collided with the platform's own short codes). Root cause: the task/comment card is deliberately a light "paper" in dark mode (#C7CBCA via DARK_TEXT_BACKGROUND_COLOR, used across Comment/Reply/CommentEdit/PlanningInvestible), so these buttons sit on a light surface even in dark mode, and the shipped pill's faint border washes out on it. Screenshot (dark-buttons.png) re-shared in chat with each panel labeled by the option NAME below. Which treatment for buttons on these light-in-dark-mode cards? (The "tight" padding is already fixed regardless.)

#### Option O-2<a name="o-2"></a>
#### Dark buttons
Give the buttons a dark slate fill with white text so they obviously read as 'dark mode'. They pop strongly, but it is dark-on-light within a light card, which can look inconsistent with the light-paper surface. Pick this if you want the buttons dark now regardless of the card staying light.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Match the current background.
In light mode the buttons match the white background so no reason not to do the same in dark mode. That will then match the In progress check box and the buttons above.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Option O-1<a name="o-1"></a>
#### Crisp light buttons
Keep the buttons light to match the deliberately-light paper card, but give them a stronger border (rgba(0,0,0,0.38)) and a bit more shadow so they read as crisp buttons instead of washing out. Fixes the visible defect without putting dark-on-light inside a light card. My recommendation: the card is intentionally light in dark mode, so the buttons should stay coherent with it. If you decide the light card itself is wrong, that is the contrast task T-all-2173 — we'd darken the card there and the buttons would follow to dark.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The task/comment card is deliberately a light paper (#C7CBCA) in dark mode, used pervasively. Keeping the buttons light but crisp (stronger border + shadow) fixes the actual defect — the wash-out from my faint 0.12 border — while staying coherent with that light surface. Dark-on-light buttons inside a light card tend to look like a mismatch. Certainty 3 because your phrasing ("incorrectly showing light mode colors") may mean you want the whole card to go dark; if so that is really the contrast task T-all-2173 (darken the card, then buttons follow to dark), and I'd rather settle the card there than put dark buttons on a light card now.

#### Resolved Question Q-all-128<a name="q-all-128"></a>  
T-all-2173 section contrast, v2 (cards keep their progression fills per C-all-980 - the change to cards is only a visible border). The remaining choice is how to separate the sidebar from the main area. Screenshot sections2.png in chat, panels labeled by the option names below. Which direction (then I implement + verify live, including dark mode)?

#### Option O-2<a name="o-2"></a>
#### Lighter main
Keep the teal sidebar (#A9D4D9) and make the main area a lighter teal (around #D6EDEF, still teal - not white) so the sidebar pops as its own panel; cards get a border. Cleaner, airier main; slight risk that the lightest 'done' cards sit closer in tone to the lighter main (the border still delineates them).


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Deeper sidebar
Deepen the sidebar to a richer teal (around #8FC5CC) and leave the main area teal (#B8E2E5) unchanged; cards get a clear border. Cleanly separates the sidebar from main (your main complaint) without lightening the main, so every card shade - including the lightest 'done' cards - keeps its contrast. Most contained change. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Given the card-progression constraint, deepening the sidebar is the safest way to fix the sidebar-vs-main complaint: it leaves the main area teal so every card shade (including the lightest done cards) keeps its contrast, while the richer sidebar clearly reads as its own panel. Combined with the new visible card borders it addresses both of your complaints with the smallest, lowest-risk change. Higher certainty than the v1 question because it no longer touches the main background or card fills.

> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Let's try it.

#### Option O-3<a name="o-3"></a>
#### Keep backgrounds
Leave the sidebar and main colors exactly as they are, but add a soft shadow edge along the sidebar and give cards a stronger border + shadow. Most conservative - fixes the invisible-card-border complaint and adds a subtle sidebar edge, but the sidebar and main stay close in color.


This option is in stage In Dialog.
#### Resolved Task T-all-2171<a name="t-all-2171"></a>  
Better buttons look

> ##### Grouped task C-all-968<a name="c-all-968"></a> 
I think go tighter with the navigation button shown top right in picture below:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/0526e72c-2d81-4041-bbb7-5b1f6df847d0.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task C-all-985<a name="c-all-985"></a>  
Compressed seems good but uncompressed not:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/789594c7-fb36-4dcc-ba78-b0a6b19c260d.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Question Q-all-119<a name="q-all-119"></a>  
T-all-2171 "Better buttons look" (supersedes Q-all-118, which had mislabeled options). Root issue we found: SpinningIconLabelButton hard-codes border-radius: 15px on every variant, so the corner looks different at different button heights (rounded rectangle when tall, near-pill when short). Both directions below fix that by making the radius consistent. I'll re-share the temp page (tmp-ui-options/buttons.html) with each panel labeled by the option short code below. Which should I implement across SpinningIconLabelButton and its variants?

#### Option O-2<a name="o-2"></a>
#### Consistent small radius (10px)
Keeps the outlined look but uses one small radius (10px) and even heights, so the corner reads identically at every size. Softer border, gentle hover shadow, 1px press dip. Primary action filled blue. The most conservative, minimal-change fix.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### True pill (999px radius)
border-radius: 999px so the radius always exceeds half the height — a perfect pill at every size, by construction. Adds a soft drop shadow, hover lift, and scale+dip on press (the tactile feedback the current button lacks, which feeds the next task T-all-2170). Stays closest to today's rounded identity. Primary actions get a solid blue fill. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
O-1 (true pill, 999px) fixes the root cause by construction — the radius always exceeds half the height, so every button is a perfect pill regardless of size, eliminating the rounded-rectangle-vs-pill inconsistency. It also delivers the press feedback the current button lacks, which carries straight into T-all-2170, and stays closest to today's rounded identity so it isn't a jarring change. Certainty 3 because O-2 (consistent 10px) is an equally valid fix if you prefer a more squared, conservative look — that's a taste call you should make from the screenshot.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Yes the way it was previously was basically a bug.

##### Suggestion S-1<a name="s-1"></a> (under Q-all-119 ▸ option O-1) 
We should keep these buttons "tight" or "primary" wherever possible. We should only use "large" or "medium" where visually it is required in order for the button not to look too small.

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
Agreed — I'll apply this when implementing T-all-2171. Concretely:

1. Default every button to the compact/"tight" sizing (the smallest padding that still keeps the label + icon comfortable and tap-target adequate). This becomes the SpinningIconLabelButton default rather than the current larger sizing.
2. Use the "primary" treatment (solid blue fill) for the single main affirmative action in a group (e.g. Approve / Save / Add), leaving secondary actions as the outlined pill. That keeps one clear emphasis per screen without a sea of blue.
3. Reserve "large"/"medium" only where a compact button would read as too small or get lost — e.g. standalone call-to-action buttons in empty states or wide toolbars like the "Add task" / "All done" row.

One interpretation to flag: I'm reading "primary" as the blue-filled style (the Approve sample), applied to the main action per group — not "make most buttons blue." If you actually want a broader use of the blue fill, say so and I'll adjust. This is the last judgment call on sizing/emphasis; the only thing still blocking implementation is the radius pick on Q-all-119 (O-1 true pill vs O-2 10px) — my vote is O-1.

#### Resolved Report R-all-181<a name="r-all-181"></a>  
T-all-2171 "Better buttons look" is ready to look at (first task; we're going one independent task at a time).

What was built (approved direction Q-all-119 / O-1, true pill):
- SpinningIconLabelButton — every variant is now a true pill (border-radius 999px), so the corner reads identically at any height; this fixes the size-dependent rounding the old fixed 15px caused (which you called basically a bug). Added a soft shadow, hover lift, press dip, compact default sizing, and a new `primary` prop for the solid-blue main-action fill (S-1).
- Wizard buttons (Next job / All done and friends) pilled to match in both AddNewWizards and InboxWizards.

Decisions / scope:
- Colors untouched except the new primary fill — palette + contrast is a separate task (T-all-2173).
- The button's own press feedback is in (it was part of O-1); the broader "every clickable element animates on click" work, including the navigation button, is the next task (T-all-2170).
- `primary` is available but not yet applied to individual buttons — that sweep is intentionally held until you confirm the look live (see S-all-73), then I apply it per the S-1 policy (one main affirmative action per group).

Details in note R-all-180. eslint passes on all three changed files.

One actionable item is filed as S-all-73, not folded into this report: I could not run the authenticated app in this environment, so please eyeball the pill / shadow / press at real sizes in light + dark before I do the primary sweep. Once you confirm, I'll finish T-all-2171's primary placements and move on to T-all-2170.

#### Resolved Task C-all-981<a name="c-all-981"></a>  
Make the selected left sidebar element IE current "grey pill" look better.

#### Resolved Task T-all-2168<a name="t-all-2168"></a>  
Better Quill type into box. Making it look more like GMail is probably very safe design wise:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/2184cef5-44e9-42ce-adbd-e8359712231b.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Width is smaller and two rows of controls with the bottom row including Send and trash icon.

#### Resolved Task C-all-978<a name="c-all-978"></a>  
Lost vertical padding on some.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/de00d93c-ad43-476e-9963-fdc3fbf36699.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task T-all-2167<a name="t-all-2167"></a>  
Better looking radio buttons - the mechanism can be different so long as the choice can still be made

> ##### Grouped task C-all-979<a name="c-all-979"></a> 
On "How would you describe this job?" hover text, make the the font larger and put the key strokes after the text in parantheses.

#### Resolved Question Q-all-124<a name="q-all-124"></a>  
T-all-2167 "Better looking radio buttons" (mechanism can change). There are 14 RadioGroups, almost all in wizard steps, mostly short single-select labels (type choices, group, yes/no), a few with descriptions. Screenshot (radios.png) in chat shows the current default MUI radio vs three directions, each labeled by the option name below. Which direction should I implement? (A mix is possible — e.g. pills for short label sets, cards where options have descriptions.)

#### Option O-1<a name="o-1"></a>
#### Polished radio
Keep the radio mechanism but restyle it: brand-blue when selected, larger target, animated dot, and a hover/selected row highlight. Biggest advantage: it's a single global MuiRadio theme override + a row style, so all 14 RadioGroups improve at once with near-zero risk and no per-site refactor. My recommendation as the safe, consistent baseline for a polish task; we can selectively upgrade specific groups to pills/cards later if you want bolder.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Polished radio is the safe, high-coverage choice for a polish task: a single MuiRadio theme override plus a row-highlight style improves all 14 RadioGroups at once with no per-site refactor and no risk of breaking single-select behavior. It also fits the conservative-polish direction already chosen (Q-all-117). Certainty 3 only because you explicitly invited a mechanism change — if you want the bolder, more cohesive look, selectable pills match the new buttons best for the short-label groups; I'd just scope that as a per-site swap.

#### Option O-3<a name="o-3"></a>
#### Selectable cards
Each option is a bordered row that highlights (blue border + tint + check) when chosen. Handles both short labels and options with descriptions, large touch target, clearly modern. Most universally applicable mechanism change, but takes more vertical space and is the largest refactor across the 14 sites.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Selectable pills
Drop the dot; each option becomes a pill (matching the new buttons), selected = filled blue. Most modern and cohesive with the rest of the UI, best for short labels. Requires a small shared component swapped into the 14 sites, and isn't ideal where an option needs a description.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
I think this is the only way the users will find the UI modern.

##### Suggestion S-1<a name="s-1"></a> (under Q-all-124 ▸ option O-2) 
Where the name is too long like "Ready to assign - also in status" move the explanatory part to the hover text.

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
Agreed — for a long option name like "Ready to assign - also in status" I'll show a short pill label ("Ready to assign") and move the explanatory part ("also in status") into the hover tooltip.

One thing to confirm before I start, since it drives a 14-site refactor: needing to shorten labels and push the explanation to hover is specifically the tradeoff of the Selectable pills direction — Polished radio and Selectable cards both show the full label fine, so they wouldn't need this. So this suggestion reads like you're choosing Selectable pills. If that's right, just confirm "Selectable pills" on this question (Q-all-124) and I'll implement pills everywhere with long names shortened + explanation in the tooltip. If instead you meant it as a general label cleanup to apply under the Polished radio direction, tell me and I'll do that.

#### Resolved Question Q-all-140<a name="q-all-140"></a>  
T-all-2168 "Better Quill type-into box", GMail-ish. Given your note that it's not an exact match and the wizards already have lots of varied action buttons at the bottom, I'm scoping this to the two things that actually make it feel like GMail and don't touch the wizard action rows: (1) cap the editor to a narrower, comfortable width, and (2) restyle the Quill toolbar (which already sits just under the editor) to GMail's clean rounded light-grey pill instead of today's flat full-width solid-grey bar. The wizard's existing action buttons stay exactly as each step renders them. Mockup to follow. Which way?

##### From AI user:
> ##### Reply C-all-1002<a name="c-all-1002"></a> 
Posted a labeled mockup — temporary build file tmp-quill.html at the repo root (screenshot tmp-quill.png), with a "Current (today)" panel plus O-1 and O-2. (The chat file-send tool isn't available this session, so please open the temp file to view; each panel is tagged O-1 / O-2.) Action buttons are drawn generically (Add / Cancel / a trash) to make clear they're left to each wizard.

My recommendation: O-1 (narrower + GMail rounded toolbar), certainty 4. Reasoning:
- The two things that actually make it read as "GMail" are the narrower box and the clean rounded light-grey toolbar pill; O-1 does both, O-2 only narrows.
- It deliberately does NOT touch the wizard action buttons (you flagged those vary a lot), so the risky part is avoided - the change is the shared editor (QuillEditor2.js + editorStyles.css) only.
- Because it's the shared editor, it lands everywhere the composer appears at once, consistently.
Scope note: I'd implement on the shared editor and sanity-check a couple of composer sites (reply, add-comment wizard, job description) before calling it done. O-2 is the fallback if you'd rather not restyle the toolbar at all and just fix the width. Open question on width: I'm proposing a cap around 620-680px; say if you want it tighter or wider.

#### Option O-2<a name="o-2"></a>
#### O-2 Narrower only
Just cap the editor to a narrower width and leave the toolbar styled as it is today (flat solid-grey bar). Smallest, lowest-risk change — it fixes the 'too wide' feel without any toolbar restyle. Less GMail-like, but zero risk to the toolbar's existing behavior/spacing.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### O-1 Narrower + GMail rounded toolbar
Cap the editor width and restyle the toolbar to the GMail-style rounded light-grey pill that sits just beneath the editor (replacing today's flat full-width grey bar). The wizard action buttons below are untouched. This is the visual upgrade that actually reads as 'GMail' and is the closest to your reference, while leaving the varied wizard buttons alone. Change is mostly in QuillEditor2.js + editorStyles.css (the shared editor), so it lands everywhere the composer appears at once.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The narrower box + the clean rounded GMail-style toolbar pill are the two things that actually make it read as GMail, and O-1 does both while deliberately leaving the varied wizard action buttons alone (the risky part). It's confined to the shared editor (QuillEditor2.js + editorStyles.css) so it lands everywhere consistently. O-2 (narrow only) is the fallback if you'd rather not restyle the toolbar.

> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Approval per acceptance of suggestion.

##### Suggestion S-1<a name="s-1"></a> (under Q-all-140 ▸ option O-1) 
The trash can needs to be added on the second row of the controls and it just clears the editor. Having it outside is possible but it's not really a wizard control since it only affects the editor.

#### Resolved Question Q-all-116<a name="q-all-116"></a>  
This job has 8 broad UI-polish tasks (better icons, alignment/centering, button look, button click animation, Quill input box, radio buttons, clickable-row animation, color contrast) and none have concrete acceptance criteria. The job also says visual choices should be shown as labeled options in a temporary build page. How would you like me to sequence the work?

#### Option O-2<a name="o-2"></a>
#### All tasks in one pass
I apply my best judgment across all 8 tasks at once and open a single review with a temp page showing the before/after. Faster, but you may disagree with several aesthetic calls simultaneously and rework is larger.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Contrast/theme first
Start with color contrast (T-all-2173) because palette decisions cascade into every other 'better look' task. Settle the palette, then do components. Good if the colors are your main pain point.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Direction-first on one area
Start with one high-leverage area — buttons, since three tasks (T-all-2171 look, T-all-2170 click animation, T-all-2169 row animation) all touch button/row interaction. I build a temporary page showing 2-3 labeled visual options + screenshots, you pick, and I then apply that established direction (motion, radius, elevation) across the remaining tasks. Lowest risk of building something you reject. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Direction-first is lowest-risk for an unbounded polish job: buttons/rows are touched by three of the eight tasks, so settling motion/radius/elevation there gives a reusable direction I can apply consistently to icons, radios, and Quill. It also matches the job's own instruction to show labeled visual options before committing, so you can course-correct cheaply before I touch every screen.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Yes we just go one task by one task so long as the tasks are independent of each other.

#### Resolved Question Q-all-120<a name="q-all-120"></a>  
C-all-967 (under T-all-2171), dark-mode buttons. Root cause: the task/comment card is deliberately a light "paper" in dark mode (backgroundColor #C7CBCA via DARK_TEXT_BACKGROUND_COLOR, a pattern used across Comment/Reply/CommentEdit/PlanningInvestible), so these buttons sit on a light surface even in dark mode. The shipped pill uses a near-invisible border and washes out on it. Screenshot shared in chat (dark-buttons.png) with the two fixes labeled by the option short codes below. Which treatment do you want for buttons on these light-in-dark-mode cards? (The "tight" padding is already fixed and applies regardless.)

#### Option O-1<a name="o-1"></a>
#### O-2 crisp light buttons
Keep the buttons light to stay consistent with the deliberately-light paper card, but give them a stronger border (rgba(0,0,0,0.38)) and a touch more shadow so they read as crisp buttons instead of washing out. Fixes the actual visible defect without introducing dark-on-light within the card. This is my recommendation, BECAUSE the card is intentionally light in dark mode — if you instead think that light card is itself wrong, that is the contrast task T-all-2173 and we would make the card dark there, after which buttons should follow to dark.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### O-1 dark buttons
Give the buttons a dark slate fill with white text so they obviously read as 'dark mode'. They pop strongly, but it is dark-on-light within a light card, which can look inconsistent with the light-paper surface. Pick this if you want the buttons to be dark now regardless of the card staying light.


This option is in stage In Dialog.
#### Resolved Task C-all-970<a name="c-all-970"></a>  
The bottom of the Move button is higher than the Reply or Resolve but the top seems still aligned. I think that the Move button is now tight but probably the Reply and Resolve are not.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/400bf4d7-d86f-4708-bf93-ea5d15c6dbbc.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Suggestion S-all-74<a name="s-all-74"></a>  
T-all-2179 verification: please confirm the fix live (I can't run the authenticated app here). In a wizard with a compressed comment list, expand a Task (TODO) row and a Note (report) row and confirm the type chip ("Task" / "Note") now stays visible after expanding, in both light and dark mode. Also sanity-check that a Blocker / Question / Suggestion row still shows its chip on expand (those were already fine).

#### Resolved Report R-all-213<a name="r-all-213"></a>  
C-all-990 "Fix icons in the swimlanes" is ready to look at (per the answered Q-all-136, option O-1 your vote).

Three things were off on a swimlane job row: a bare 24px orange overdue clock, a solid-red "N new" message pill that had escaped the new outlined-chip format, and they sat together at mismatched weights. Now:
- The overdue/report-required clock is a compact tinted orange badge matching the assistance-section badges; a red dot marks an unread inbox report, click-to-inbox preserved.
- The "N new" message chip is the outlined-red chip (count and click behavior unchanged), consistent with the "N open" chip beside it.
- Per O-1 both stay separate elements (no message-count logic changed), so an unrelated notification is never folded into the overdue dot.

To keep the swimlane and the assistance section from drifting apart again, the badge is now a single shared component: new src/components/CustomChip/TintedIconBadge.js, used by both PlanningIdeas.js (clock) and ArchiveInvestibles.js (AssistanceBadge is now a thin wrapper - the assistance look is unchanged). eslint passes on all three files. Detail in note R-all-212; as-shipped screenshot (the O-1 panel) sent in chat.

One actionable item, filed as S-all-76 (not folded in here): I can't run the authenticated app here, so please eyeball the swimlanes live in light + dark - confirm the clock badge + dot read right, the "N new" chip matches the other outlined chips, and a row with both stays clean on one line.

Note: this is the second and last grouped task under T-all-2172 "Better icons" (the first, C-all-988, is in review as R-all-211). Once both are confirmed live, T-all-2172 is safe to resolve.

#### Resolved Report R-all-215<a name="r-all-215"></a>  
C-all-992 "Better / more matching icon buttons in the question interface" is ready to look at (per the answered Q-all-137, option O-1 your vote).

On an expanded option row the action icons were all flat grey and didn't match the new outlined buttons above them or the app's type-color vocabulary. Now (src/pages/Dialog/Decision/OptionMenu.js):
- The four add-a-typed-comment icons are type-colored at rest - add-Task green, add-Blocker red, add-Suggestion orange, add-Question blue (the same red/orange/blue/green as CommentTypeChip and the badges), so each button shows what it adds.
- The structural icons (promote/demote arrows, make-task, vote) stay neutral grey, with a thin visual separation from the type icons.
- The add-Task icon was swapped from Notes to the Task/Assignment icon, since Notes now means Note/Report.
- The same coloring + icon swap was applied to the right-click context menu so the two views agree. Hover/behavior unchanged. eslint passes.

Detail in note R-all-214; as-shipped screenshot (the O-1 panel) sent in chat.

One actionable item, filed as S-all-77 (not folded in here): I can't run the authenticated app here, so please eyeball an expanded option's toolbar and the right-click menu live in light + dark - confirm the type colors read well and aren't too loud, and the Task icon/behavior is right.

Note: this is the third and last grouped task under T-all-2172 "Better icons" (C-all-988 -> R-all-211, C-all-990 -> R-all-213). Once all three are confirmed live, T-all-2172 is safe to resolve.

#### Resolved Question Q-all-122<a name="q-all-122"></a>  
T-all-2175 (tight change missing on a bug): I traced the button paths and the main bug/comment action buttons (Move / Resolve / Reply / Make-task in Comment.js), the bug-list row, and the compressed card all already use the tightened SpinningIconLabelButton (or icon-only buttons). So the non-tight buttons you're seeing on a bug must be a different surface or a button that overrides the padding, and I can't reproduce it without seeing it (no authed app here). Could you drop a screenshot of the non-tight buttons on the bug (like the earlier ones), or name the screen/action? Two candidates I suspect, if either matches: (a) the bug triage WIZARD buttons (those use the wide fixed-width wizard styles actionPrimary/actionNext, which I only pilled, not tightened), or (b) a specific button I missed. A screenshot will pin it fastest.

> ##### Reply C-all-969<a name="c-all-969"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8d9d0fd4-074b-4b67-9914-e08e8dfeb825.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

My guess is that the presence of the drop down caused these buttons to come up not tight.

#### Resolved Report R-all-211<a name="r-all-211"></a>  
C-all-988 "Better icons for the assistance section" is ready to look at.

The assistance-section job cards used bare MUI icons where COLOR meant urgency (red = unread message, orange = none) — which clashed with the rest of the app, where color means comment TYPE, including the outlined chips shown on the comment rows in the very same card. Per the answered Q-all-135 (option O-2, your vote), the indicators are now compact tinted icon badges:
- Color = type (Blocker red / Suggestion orange / Question blue / needs-assignment "Ready" green), matching CommentTypeChip and the chips just below.
- Unread message → a small red dot on the badge plus full saturation; read badges are muted. So urgency is still visible, just no longer fighting the type colors.
- One-line footprint preserved (close to the old icon row), unlike the text-pill option which wrapped on the narrow card.

Change is isolated to src/pages/DialogArchives/ArchiveInvestibles.js (new AssistanceBadge + ASSIST_VISUAL; getIcon returns type data instead of pre-colored JSX; click/tooltip behavior unchanged). eslint passes. Details in note R-all-210; as-shipped screenshot sent in chat.

One actionable item, filed as S-all-75 (not folded in here): I can't run the authenticated app in this environment, so please eyeball the assistance section live in light + dark — confirm the type colors read right, the unread dot/muting is clear and not too faint, and a card with several indicators keeps them on one line. Parent task T-all-2172 ("Better icons") had only this grouped task, so it's safe to resolve once you've confirmed live.

#### Resolved Report R-all-222<a name="r-all-222"></a>  
C-all-1001 "Same Q-all-138 treatment for the view-level tabs" is ready to look at.

The group/workspace view tab strip (Job Progress / Job Backlog / Bugs / Notes·Discussion) had the same heavy filled icons + selected-everything-blue color clash as the old job header. It now gets the exact O-4 treatment you approved on Q-all-138 (src/pages/Dialog/Planning/PlanningDialog.js):
- Desktop: text-only tabs - label + outlined count chip ("1 critical" etc.); selected = blue text + blue underline, others neutral grey. The icon/color clash is gone and it matches the job header.
- Mobile: icons kept (labels hidden there for space), refined to outlined variants - AssignmentIndOutlined / AssignmentOutlined / BugReportOutlined / LightbulbOutlined.
- Icons are gated on the sm breakpoint (matching GmailTabItem's own label-hiding) so the desktop/mobile split lines up. GmailTabItem/GmailTabs untouched; swapped only the now-unused filled icon imports. eslint passes.

Detail in note R-all-221; as-shipped screenshot (desktop + mobile, light + dark) sent in chat.

One actionable item, filed as S-all-80 (not folded in here): I can't run the authenticated app here, so please eyeball the view tabs live in light + dark at desktop and mobile widths - confirm the desktop text tabs read clean, the mobile outlined icons + count show, and tab switching / drag-and-drop onto the Progress & Backlog tabs still work.

Note: sixth grouped task under T-all-2172 "Better icons".

#### Resolved Task C-all-988<a name="c-all-988"></a>  
Try to do better than the current use of icons in the assistance section.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/7dcfa1e4-49c8-461a-b754-0fef59960b11.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

These icons tell you why the job is in the assistance section IE has a question, suggestion, blocker, needs assignment, or a combination. The complaint was that these icons don't look good.

#### Resolved Question Q-all-123<a name="q-all-123"></a>  
C-all-971 (under T-all-2175): heights now match across Reply / Move / Resolve. The one remaining difference is that Move is grey while the others are white. That grey is Move's auto-focus highlight — Move is auto-focused when a bug opens, and via the detached focus-render it shows MUI's default grey fill instead of matching the card. Is that what you want addressed? How should the focused Move look?

##### From AI user:
> ##### Reply C-all-975<a name="c-all-975"></a> 
Yes — I measured both Resolve buttons and the difference is real (and it vindicates your original dropdown hypothesis from C-all-969):

1. Task Resolve: pill 41px tall, vertical padding ~12/13px.
2. Bug Resolve: pill 52px tall, vertical padding ~17/19px.
3. Horizontal padding and text size are identical; the bug button is purely ~11px taller.

Root cause: the comment/bug action row (classes.actions in Comment.js) is display:flex with no align-items, so it defaults to align-items: stretch. On a bug the row contains the taller "Normal" severity dropdown (and the Visible checkbox), so every button stretches to match it — the extra height shows up as vertical padding and makes them look un-tight. A task has no dropdown, so its buttons keep their natural tight height. (My earlier !important padding didn't help because flex stretch adds height on top of the padding.)

Fix: added align-self: center to the button base so buttons keep their natural tight height regardless of the row's tallest item. Now the bug's Reply/Resolve should match the task's. eslint passes — please verify.

Note: the Move grey-fill question (the original subject of Q-all-123) is separate and still open for your pick whenever you want to return to it; you asked to set Move aside for now.

> ##### Reply C-all-974<a name="c-all-974"></a> 
Forget the Move button for a minute and let's look at the resolve button:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c3bb7e76-376a-45bc-a643-666889187180.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw) Button A taken from a Task

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/877a1549-daaa-49d6-8afc-3e8a9cfb299c.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)Button B taken from a Bug

Are you able to see the differences in padding between these two pictures?

##### From AI user:
> ##### Reply C-all-976<a name="c-all-976"></a> 
Done — I undid the Move band-aids. Reverted the !important on padding/border-radius/font and the line-height tweak I'd added while mis-diagnosing this as a Move-specific problem. The only T-2175 change left in SpinningIconLabelButton is align-self: center, which is the actual fix (the flex-row stretch from the dropdown) and is what made the bug buttons tight. eslint passes.

Honest caveat on the "Move displays higher when greyed": I don't think the band-aids were causing that, so the undo may not fully fix it. When Move is auto-focused it renders through FocusRippleButton's detached ReactDOM render (the MUI<5 autofocus workaround) into a bare wrapper div. That wrapper div is the flex child, and with align-self: center now on the buttons, the normal buttons (Reply/Resolve) center at their tight height while the wrapper div still stretches and leaves the Move button sitting at the top — so Move reads higher. Same detached render is also the source of the grey. So both the "higher" and the grey are one root cause: the focused-Move detached render.

Please verify after the revert. If Move is still higher/grey when focused, the clean fix is to make the focused Move render like a normal button (e.g. center the wrapper div, or drop the detached autofocus for these buttons) which resolves both at once — that's the real "match the others" (this question's O-1). Tell me which way you want to go and I'll implement.

##### From AI user:
> ##### Reply C-all-973<a name="c-all-973"></a> 
You're right to call that out — I was careless. I measured the white pill OUTLINES, which do line up at the same height across Reply/Move/Resolve. But that's not what reads as wrong. Enlarging the screenshot (crop shared in chat) shows Move has an extra GREY rounded-rectangle inside its pill that is shorter, inset, and has a smaller corner radius than the pill. That grey box is Move's auto-focus highlight, rendered through the detached focus-path as MUI's default focus background — so it doesn't fill the pill and looks like a stubby grey button sitting inside the outline.

So this is not a button-height mismatch; it's the same grey-focus-fill issue this question (Q-all-123) is about. Removing that grey (option "Match the others") makes Move render as a clean pill identical to Reply/Resolve. I'm now more confident in that recommendation — the grey inset box is clearly a render artifact, not an intentional style. Still your call between dropping it entirely vs. replacing it with a deliberate themed highlight.

> ##### Reply C-all-972<a name="c-all-972"></a> 
Why do you think the heights match? Are you looking at the same picture as me?

#### Option O-3<a name="o-3"></a>
#### Leave it grey
It's fine as-is; the grey auto-focus highlight on Move is acceptable and no change is needed.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Keep a highlight, but themed
Keep marking Move as the auto-focused default action, but replace MUI's default grey with an intentional, consistent highlight (e.g. a subtle brand-tinted fill or a ring) so it looks deliberate rather than like a stray grey button.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Match the others (no grey)
Normalize the auto-focused Move so its background matches the card like Reply/Resolve (transparent/white), consistent with the 'match the current background' decision (Q-all-121/O-3). Keyboard users still get the standard focus outline; we just drop the grey fill artifact. My recommendation — the grey looks like a side effect of the detached render rather than an intentional style, and it breaks the consistency we just established.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The grey is MUI's default focus fill leaking through the detached focus-render, not an intentional app style, and it breaks the consistency we just established and the "match the current background" decision (Q-all-121/O-3). Normalizing it to match Reply/Resolve keeps the row coherent while keyboard users still get the standard focus outline. Certainty 3 only because if you actually value flagging Move as the auto-focused default action, the themed-highlight option is reasonable too.

#### Resolved Task T-all-2173<a name="t-all-2173"></a>  
Better contrast on colors chosen for all screens.

> ##### Grouped task C-all-982<a name="c-all-982"></a> 
The list of suggestions, blockers, or in progress items that show in the job cards in the swimlanes and assistance section need to have a better look - colors and potentially borders fixed.

#### Resolved Question Q-all-131<a name="q-all-131"></a>  
C-all-984: the count/status chips across the app (tabs like '1 critical', swimlane '2 open', sidebar count badges, bug/backlog list chips) are currently flat saturated solid pills and don't look good. Screenshot chips_opts.png in chat shows the current look vs three unified directions, each across the chip types (critical/new=red, open=orange, total=teal, level=yellow, option=blue, round count). Which direction should I implement app-wide (then verify live, light + dark)?

#### Option O-1<a name="o-1"></a>
#### Soft tinted
Light tinted fill with darker colored text and a subtle border (e.g. red chip = soft pink bg + dark red text). Modern, lighter, less visually heavy, and keeps the color meaning while reducing the saturated-blob look. Reads well on both the teal cards and white surfaces. This is my recommendation - it's the biggest improvement over the current flat solids without being loud.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Soft tinted is the biggest visual upgrade over the flat saturated solids while keeping each chip's color meaning: light tinted fill + darker colored text + subtle border reads as modern and intentional rather than a saturated blob, and it sits well on both the teal cards and white surfaces. It also matches the softer direction we took for the inner-item accents and buttons. Certainty 3 because it is a taste call from the screenshot - Refined solid is the safe pick if you want to stay close to today, and Outlined if you want the most minimal look.

#### Option O-2<a name="o-2"></a>
#### Outlined
White/transparent fill with a colored border and colored text. Crispest and most minimal; very clean but the chips become lighter-weight and may read as less prominent for important counts like 'critical'.


This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
In this case critical is not super critical (like on an operations dashboard) so this should be good.

#### Option O-3<a name="o-3"></a>
#### Refined solid
Keep the solid colored fills (closest to today) but soften the colors slightly, use consistent white text + weight, rounder shape, and a soft shadow. Most conservative - tidies up the current look without changing the solid style.


This option is in stage In Dialog.
#### Resolved Task C-all-986<a name="c-all-986"></a>  
Now need to make the type indicator used for compressed match what we see in reply:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/ddc4fe93-2f02-441a-9449-1ec3c50a929f.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Question Q-all-134<a name="q-all-134"></a>  
C-all-986: you want my custom outlined chip (white fill, colored border + text, type label like "Suggestion") used as the comment type indicator everywhere, not the old solid CardType chip. The type indicator on comments comes from the shared CardType component (used by every comment across the app - job views, assistance, inbox, wizards, not just the compressed/reply ones). How broadly should I swap it?

#### Option O-2<a name="o-2"></a>
#### Just the wizard comment cards
Only the compressed comment card and the reply-parent (and other compressed-in-wizard views) use the custom chip; comments elsewhere keep the current CardType chip. Smaller and lower-risk, but the look would differ between the wizard comment cards and comments shown in the job views.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Everywhere comments show a type
Replace the solid CardType chip with the custom outlined chip for all the comment types (suggestion/blocker/question/task/note/reply) everywhere a comment renders its type - compressed, reply, job views, assistance, inbox, etc. Fully consistent app-wide. Bigger change to the shared comment rendering, but the cleanest end state and matches 'all over'. This is my recommendation given your wording. Non-comment CardType chips (voting, certainty, decision, story) stay as-is.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
"Used all over" reads as app-wide consistency, so replacing the comment type indicator everywhere comments render their type is what you asked for and gives the cleanest end state - no mismatch between the wizard comment cards and comments in job views/assistance/inbox. I scoped it to comment types only (suggestion/blocker/question/task/note/reply); the other CardType uses (voting, certainty, decision) stay solid since they are not comment type indicators. Higher certainty because your wording was explicit; the only reason to pick the smaller option is to limit risk to the shared comment rendering.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Assuming you will be using an icon only version on mobile.

##### Question Q-1<a name="q-1"></a> (under Q-all-134 ▸ option O-1) 
Will the new custom chip work for mobile also or we need to use an icon there?

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
Good catch - the text label ("Suggestion", "Question") is wider than the icon the current chip uses on mobile, so I would NOT just put the text chip on mobile. Recommendation: give the custom outlined chip the matching type icon (the same ones CardType already uses - lightbulb for suggestion, block for blocker, question mark, note, etc.) and render it responsively:
- Desktop: the outlined chip with the text label (the clean look you approved), no icon.
- Mobile: the same outlined chip but icon-only (no text), so it stays compact like today.

So yes it works on mobile - via an icon-only version of the same chip, not the wide text label. I will wire the CommentTypeChip to take mobileLayout and switch label vs icon. If you would rather it always show icon + label (both, on all sizes) I can do that instead - just let me know. Either way, please also confirm the scope on this question (everywhere comments show a type, vs just the wizard cards) and I will implement + you verify live.

#### Resolved Question Q-all-127<a name="q-all-127"></a>  
T-all-2173 section contrast (planning view too subtle: sidebar vs main barely differ, card borders invisible). Sampled current colors: sidebar #A9D4D9, main #B8E2E5, cards #B8DFE2 with no visible border. Screenshot (sections.png) in chat shows the current look vs three directions, all keeping the teal/blue theme. Which direction should I implement (then verify live)?

> ##### Reply C-all-980<a name="c-all-980"></a> 
No the cards in each section - Assistance, Paused / Approval, Work Ready, and Tasks Complete are a progress towards lighter color indicating done. We don't want to change that since it was recommended by a different user.

#### Option O-3<a name="o-3"></a>
#### Keep backgrounds
Leave the sidebar and main backgrounds as they are now, but add a soft shadow edge between the sidebar and main, and make cards crisp white with a clearly visible border + shadow. Most conservative; fixes the card complaint and adds a sidebar edge, but sidebar/main stay close in color.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Light canvas
Make the main content area a near-white light tint (#EAF6F7) so it reads as a clean canvas, keep the teal sidebar (#A9D4D9) which now clearly pops, and give cards a white background with a visible border + soft shadow. Strongest, most modern separation and directly fixes both complaints; biggest visual change (main area goes from teal to near-white). This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Light canvas gives the clearest, prettiest section separation and directly fixes both complaints: a near-white main area makes the teal sidebar read as a distinct panel, and white bordered cards pop off the canvas. It still obeys the theme (teal sidebar, blue accents). Certainty 3 rather than higher because it is the biggest shift (the main area stops being teal), so it is a genuine taste call from the screenshot - if you want to keep the teal feel everywhere, Deeper sidebar is the strong middle option and Keep backgrounds is the safe minimal one.

#### Option O-2<a name="o-2"></a>
#### Deeper sidebar
Keep teal backgrounds but deepen the sidebar to a richer teal (#8FC5CC) and lighten the main a bit, with white bordered cards. Sidebar clearly separates from main while the whole app stays teal; medium change.


This option is in stage In Dialog.
#### Resolved Suggestion S-all-78<a name="s-all-78"></a>  
C-all-994 verification (I can't run the authenticated app here, so please eyeball it live in light + dark). Open a job and look at the header tab strip (Overview / Open tasks / Assistance / Notes):
- On desktop the tabs should now be text only (no icons) - label + the outlined count chip; the selected tab is blue text with a blue underline, the others neutral grey. Confirm the strip reads clean and the old icon/underline/chip color clash is gone.
- Shrink the window to mobile width (or load on a phone): the tabs should collapse to outlined icons only (Info / Assignment / ContactSupport / Note outlined), since the labels are hidden for space there. Confirm each section's icon still shows, the selected one is blue with the underline, and the count chip (just the number) still appears.
- Confirm clicking each tab still switches sections as before.

#### Resolved Task T-all-2179<a name="t-all-2179"></a>  
When expand a row that is compressed in wizard lose the chip saying what it is.

#### Resolved Question Q-all-138<a name="q-all-138"></a>  
C-all-994 — the job header tab strip (Overview / Open tasks / Assistance / Notes). It's the @mui-treasury GMail tabs: each tab is a heavy filled MUI icon (Info / Assignment / ContactSupport / Note) + label + an outlined count chip, and the selected tab turns its icon, text and the underline all blue (#2F80ED) — which fights the orange/red count chips, so the colors read "out of whack", and the icon+text combination is clunky. You noted the GMail pattern was arbitrary, so departing from it is on the table. Which direction should the header take? Labeled mockup of all three to follow. In all of them the colors are brought into line (one calm accent for the selected state) and the outlined count chips are kept.

##### From AI user:
> ##### Reply C-all-995<a name="c-all-995"></a> 
Posted a labeled mockup — temporary build file tmp-jobheader-tabs.html at the repo root (screenshot tmp-jobheader-tabs.png), one panel per option tagged O-1 / O-2 / O-3 plus a "Current (today)" panel, the tab strip in light and dark.

My recommendation: O-1 (clean text tabs, no icons), certainty 4. Reasoning:
- It addresses all three of your gripes at once: the heavy, mismatched icons are gone, the clunky icon+text layout is gone, and the only colors left are the calm grey/blue text and the outlined count chips (no more blue-underline-vs-orange-chip clash).
- The four labels (Overview / Open tasks / Assistance / Notes) are short and self-explanatory, so dropping the icon costs almost nothing in scannability.
- It's the smallest, lowest-risk change to the markup (the GmailTabItem just stops passing an icon) while looking the most finished.
O-3 is the pick if you'd rather keep a per-section icon — it stays familiar and fixes the colors, but still carries the icon+text layout you weren't thrilled with. O-2 (segmented pills) is the most on-brand with the recent button/pill work but the biggest change and a heavier strip, and the count chip has to live inside the selected pill. Note: O-1 and O-3 keep the existing blue underline as the selected accent; say the word if you'd rather the selected accent be a different color.

#### Option O-1<a name="o-1"></a>
#### O-1 Clean text tabs (no icons)
Drop the icons entirely — the icon+text combo is the clunky part. Each tab is just its label plus its outlined count chip. Unselected = neutral grey text; selected = brand-blue text with a tidy brand-blue underline. Fixes both gripes at once (no heavy mismatched icons, no icon/text awkwardness) and is the simplest, calmest result; the count chips keep carrying the color. Trade-off: loses the at-a-glance icon for each section (the labels are short and clear, so low cost).


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Dropping the icons fixes all three gripes at once - the heavy mismatched icons go away, the clunky icon+text layout goes away, and the only colors left are calm grey/blue text plus the outlined count chips (no more blue-underline-vs-orange-chip clash). The four labels are short and self-explanatory so losing the icon costs almost nothing, and it's the smallest, lowest-risk markup change. O-3 is the fallback if you want to keep a per-section icon; O-2 (segmented pills) is the most on-brand but the heaviest change and forces the count chip inside the selected pill.

#### Option O-4<a name="o-4"></a>
#### Clean for desktop and refined for mobile.
For space reasons still have to use icons on mobile.


This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Seems reasonable.

#### Option O-2<a name="o-2"></a>
#### O-2 Segmented pill tabs
Drop the GMail underline and make the strip a segmented/pill control matching the new ChoicePills + outlined-button vocabulary the app adopted: the selected tab is a filled brand-blue (or soft-tinted) pill, the others are plain text pills; a subtle hover on each. Icons dropped (or an optional small leading icon). The biggest visual change and the most 'on brand' with the recent button work; trade-off is the count chips sit inside/next to a pill so the strip is a bit heavier and wider.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### O-3 Refined icon tabs
Keep the GMail icon+text+underline pattern but fix it: switch the heavy filled icons to lighter outlined ones at a consistent size, render every icon+label in a calm neutral grey at rest, and give the selected tab a single consistent accent (icon + text + underline all the same brand blue) instead of today's filled-black-vs-blue mismatch. Least change / most familiar; addresses 'colors out of whack' while keeping the per-section icon, but still carries the icon+text layout you weren't thrilled with.


This option is in stage In Dialog.
#### Resolved Question Q-all-117<a name="q-all-117"></a>  
How bold should the visual changes be? The current light theme pairs a blue primary (#2F80ED) with a fairly saturated teal paper surface (#A9D4D9, with cards/dialogs overridden to white in dark mode but not light). This single decision affects every "better look" and the contrast task.

> ##### Reply C-all-964<a name="c-all-964"></a> 
Palette refresh or not is simply a matter of presenting options and we will see which we like and if we can do better than the current.

#### Option O-1<a name="o-1"></a>
#### Conservative polish
Keep the existing palette, fonts, and overall layout. Refine spacing/alignment, add smooth hover+click animations, upgrade icons, improve radio buttons, and fix only the clearly failing contrast spots. Lower risk, faster to review. This is my recommendation — it matches a 'better UI' polish job rather than a redesign.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The task list reads as polish ("better buttons look", "better contrast"), not a redesign. A conservative pass keeps the brand palette and lets us fix the concrete contrast failures (the saturated teal paper is the likely culprit) without making every screen subjective. We can always escalate to a palette refresh if the polish doesn't resolve the contrast complaints.

#### Option O-2<a name="o-2"></a>
#### Palette refresh too
In addition to the polish, rework the surface colors — e.g. calmer near-white/neutral paper instead of saturated teal — for stronger contrast and a more modern feel. Higher impact but touches every screen and is more subjective.


This option is in stage In Dialog.
#### Resolved Suggestion S-all-77<a name="s-all-77"></a>  
C-all-992 verification (I can't run the authenticated app here, so please eyeball it live in light + dark). Open a question with options and expand an option so its toolbar shows:
- The four add-a-typed-comment icons should now be type-colored: add-Task green, add-Blocker red, add-Suggestion orange, add-Question blue; the promote/demote arrows, make-task and vote icons stay neutral grey. Confirm the colors read well against the white/teal option row in both themes and aren't too loud.
- The add-Task button's icon is now the Task/Assignment icon (was Notes). Confirm that looks right and the tooltip/behavior (adds a TODO to the option) is unchanged.
- Hovering an icon should still show the circular button hover; clicking each should open the same wizard as before.
- Right-click an option to open the context menu — the same four items there are now type-colored and the Task item uses the Assignment icon too. Confirm that menu still reads cleanly.

#### Resolved Suggestion S-all-79<a name="s-all-79"></a>  
C-all-996 verification (I can't run the authenticated app here, so please eyeball it live on a narrow/mobile width, light + dark). Open a question, expand an option:
- On mobile the option row should now show a single kebab (vertical ⋮) button instead of the inline action icons - no more clipped icons.
- Tapping the kebab should open the labeled action menu (the same one as right-click on desktop): Promote/Demote where applicable, Make a task, Approve/vote, Add task / blocker / suggestion / question, each with its type-colored icon. Confirm every action is reachable and that each still opens the right wizard / does the right thing.
- Promote/Demote should close the menu after acting; picking an "add" item should navigate as before.
- Desktop is intentionally unchanged - confirm the inline icon toolbar still shows there.

#### Resolved Task C-all-971<a name="c-all-971"></a>  
Now looks like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/ed6482f9-be31-49f4-b826-a5a20509df5c.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Report R-all-220<a name="r-all-220"></a>  
C-all-996 "On mobile some icons are hidden" is ready to look at (per the answered Q-all-139, option O-1 your vote).

On a phone the expanded option row's action toolbar (~8 icons) shared the row with the option title and overflowed, clipping the rightmost icons. Now (src/components/Comments/OptionListItem.js):
- On mobile the inline icon toolbar is replaced by a single kebab (vertical ⋮) button; tapping it opens the labeled action menu - the exact same menu OptionListItem already shows for right-click on desktop, listing every action (promote/demote, make task, approve/vote, add task/blocker/suggestion/question) with its type-colored icon. It can never clip and reads better than tiny icons on a phone.
- Desktop is intentionally unchanged - the inline icon toolbar stays.

Nicely low-risk: OptionMenu wasn't touched at all - OptionListItem already kept the anchorEl/recordPositionToggle machinery for right-click, so the mobile kebab just triggers it. Reused the existing 'more' translation; added only the MoreVertIcon import. eslint passes.

Detail in note R-all-219; as-shipped screenshot (the kebab + opened menu) sent in chat.

One actionable item, filed as S-all-79 (not folded in here): I can't run the authenticated app here, so please eyeball it live at mobile width in light + dark - confirm the kebab opens the menu, every action is reachable and does the right thing, and desktop still shows the inline toolbar.

Note: this is the fifth grouped task under T-all-2172 "Better icons" (C-all-988 / C-all-990 / C-all-992 / C-all-994 already in review).

> ##### Reply C-all-998<a name="c-all-998"></a> 
Didn't work:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/2428ab6c-45cd-42cc-b749-60000c0be7c5.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Something on the right is taking up space and producing a blank area.

##### From AI user:
> ##### Reply C-all-1000<a name="c-all-1000"></a> 
C-all-998 resolved (confirmed looks good). The mobile kebab from C-all-996 exposed two layout problems on the option row, both now fixed in src/components/Comments/OptionListItem.js:

1. Blank area on the right: the option row is a flex row whose title had a fixed cap and the right-side controls weren't being pushed out on narrow widths. Fixed by the title behavior below.
2. The inline icon toolbar only fits on a wide row; at mid widths it squeezed/truncated the title (or lost buttons). Fixed by widening when the kebab is used.

Final behavior (three width bands):
- Desktop (>= md): inline icon toolbar. Title takes the room it needs (flex-shrink:0) and the secondary description yields the remainder.
- Mid sizes (sm..md): the kebab "more" menu is used instead of the inline toolbar (new useMoreMenu = breakpoints.down('md')), so the title keeps its room and nothing is truncated.
- Strict mobile (<= sm): kebab menu; there is no description, so the title element fills the row (flex-grow/shrink + min-width:0 inline) and ellipsizes only at the kebab - no trailing blank.

So the "more" kebab now covers phones and mid widths; the inline toolbar appears only when the row is genuinely wide. Still no change to OptionMenu. eslint passes. Committing now with the C-all-996 work.

##### From AI user:
> ##### Reply C-all-999<a name="c-all-999"></a> 
Thanks - fixed the blank area (C-all-998). Diagnosis: the option row is a flex row, and the flex-grow SPACER that pushes the action controls to the right edge was gated desktop-only (along with the description Text). On desktop the description fills the row; on mobile nothing did, so once the wide icon toolbar was replaced by a single kebab, the title+chevron+kebab left-aligned and the rest of the full-width row showed as blank on the right. The old toolbar had hidden this by overflowing into that space.

Fix (src/components/Comments/OptionListItem.js): the flex-grow spacer now renders on mobile too, so the chevron + kebab are pushed to the right edge - title on the left, actions on the right, no trailing blank. Desktop is unchanged. eslint passes. Before/after screenshot sent in chat.

S-all-79 still covers the live check - please re-verify at mobile width when you get a chance.

#### Resolved Question Q-all-139<a name="q-all-139"></a>  
C-all-996 — on mobile the option-row action toolbar (the OptionMenu icons: promote/demote, make-task, vote, add-Task/Blocker/Suggestion/Question — up to ~8) overflows the narrow card and the rightmost icons get cut off (the screenshot shows it clipped mid-row). The toolbar shares the row with the option title, so space is very tight. You suggested either smaller icons or a "more" control. How should mobile handle it? Helpful context: OptionMenu already has a full labeled menu version (used for right-click on desktop) listing every one of these actions with text — so a "more" button can reuse that exact menu, which also reads better than tiny icons on a phone. Labeled mockup to follow.

##### From AI user:
> ##### Reply C-all-997<a name="c-all-997"></a> 
Posted a labeled mockup — temporary build file tmp-mobile-icons.html at the repo root (screenshot tmp-mobile-icons.png), one phone-width panel per option tagged O-1 / O-2 / O-3 plus a "Current (today)" panel.

My recommendation: O-1 (kebab "more" menu on mobile), certainty 4. Reasoning:
- It can never clip — works no matter how many actions are available or how long the option title is, which is the actual bug here. O-2 (smaller icons) still overflows on the narrowest phones or a long title, so it only mostly fixes it.
- It reuses code we already have: OptionMenu already renders the full labeled MenuItem list for right-click. On mobile we just trigger that same menu from a kebab button (anchored to the button instead of the mouse), so it's low-risk and there's one source of truth for the actions.
- On a phone, a labeled list ("Add blocker", "Add suggestion"…) is far easier to read and tap than ~8 tiny dense icons.
Trade-off vs O-2: actions are one tap deeper. O-3 (hybrid) is reasonable but adds complexity and forces us to pick which 2-3 actions are "primary" — a per-user judgment call I'd rather avoid for a small mobile fix. Desktop is unchanged in all options (the inline icon toolbar stays as-is there).

#### Option O-3<a name="o-3"></a>
#### O-3 Hybrid: few icons + more
Keep the 2-3 most-used actions as (smaller) inline icons and move the rest behind the kebab 'more' menu. Balances quick access to the common actions with a guaranteed-fitting row. Trade-off: more moving parts, and we have to pick which actions are 'primary' (a judgment call that could vary by user).


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### O-2 Smaller icons on mobile
Keep all the icons inline but shrink them on mobile (smaller icon size, tighter gaps/padding, no per-button circular padding) so the full set fits on the row. Preserves one-tap access to every action. Trade-off: with up to ~8 icons sharing the row with the option title, the very narrowest phones (or an option with a long title) can still overflow, and small dense icons are harder to hit and read.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### O-1 More (kebab) menu on mobile
On mobile collapse the whole action toolbar to a single overflow button (a vertical kebab) on the option row; tapping it opens the existing labeled action menu (the same MenuItem list OptionMenu already renders for right-click) with 'Add blocker', 'Add suggestion', etc. spelled out. Robust no matter how many actions are available, never clips, and the text labels are clearer than tiny icons on a phone. Trade-off: actions are one tap deeper than an always-visible icon.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
A kebab "more" menu can never clip regardless of action count or title length (the actual bug), whereas smaller icons (O-2) still overflow on the narrowest phones or with a long title. It reuses the labeled MenuItem list OptionMenu already renders for right-click - low risk, one source of truth - and a labeled list reads/taps far better than ~8 tiny icons on a phone. O-3 (hybrid) works but adds complexity and forces a "which actions are primary" judgment call. Desktop stays unchanged.

> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
Yup.

#### Resolved Task C-all-990<a name="c-all-990"></a>  
Fix icons that show in the swimlanes - over due clock is one example to match and look good. The position of such icons can also be changed if looks better.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e5975119-9f8b-476e-80df-ecc6bac17d90.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

The over due icon is sometimes alongside a message indicator and that can be done more concisely now as with assistance section.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/91b60e07-6560-4167-a550-722e9b0e0056.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Also note that the 1 new above is a chip that somehow escaped the new format.

#### Resolved Task S-all-73<a name="s-all-73"></a>  
Verify the new button look live before I apply the blue "primary" fill across call sites. For T-all-2171 I changed the shared button styling — SpinningIconLabelButton (the Move/Resolve/Grouped icon+label family) and the wizard action buttons (actionPrimary/actionNext/actionSecondary in both AddNewWizards and InboxWizards) — so every button is now a true pill (border-radius 999px) with a soft shadow, hover lift, and press dip, at compact default sizing. The approved mockup (Q-all-119, O-1) is the spec, but I could not run the authenticated app in this environment to screenshot the real result.

Please confirm in your running env, light AND dark mode, that the pill / shadow / press read well at the real sizes: (1) the task-row buttons (Grouped / Move / Resolve), (2) the wizard "Next job" / "All done" buttons, (3) a disabled button, (4) the dark-mode variant. Once you confirm the look, I'll sweep the `primary` prop (solid-blue fill) onto the single main affirmative action of each group, per S-1 — that's the remaining piece of T-all-2171.

#### Resolved Suggestion S-all-75<a name="s-all-75"></a>  
C-all-988 verification (I can't run the authenticated app here, so please eyeball it live). In a planning view, find the assistance section and confirm the new tinted icon badges:
- Color now reads as TYPE: Blocker = red, Suggestion = orange, Question = blue, needs-assignment ("Ready") = green — matching the outlined comment chips on the rows just below in the same card.
- A small red dot sits on a badge only when there's an unread message for it; badges without an unread message are slightly muted. Confirm the dot/muting reads correctly and isn't too faint.
- Hover still shows the explanatory tooltip (issuePresent / questionPresent / messagePresent etc.).
- Check a card with several indicators at once (question + suggestion + blocker, or "Ready" + blocker in backlog) — confirm the badges stay on one line and don't crowd the relative-time text.
Please confirm in BOTH light and dark mode.

#### Resolved Task C-all-967<a name="c-all-967"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c08f099f-1c3d-4def-87f7-1a9048ab6904.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Two issues here.

1. The buttons are not "tight"
2. In dark mode the buttons are still incorrectly showing light mode colors.

#### Resolved Question Q-all-118<a name="q-all-118"></a>  
T-all-2171 "Better buttons look": I built a temporary options page (tmp-ui-options/buttons.html, screenshot shared in chat) rendering the current button against three directions on the app's teal paper surface. Which direction should I implement across SpinningIconLabelButton (the app's main reusable button)? Each adds the press feedback the current button lacks, which feeds directly into the next task T-all-2170.

##### From AI user:
> ##### Reply C-all-966<a name="c-all-966"></a> 
Not your imagination, and two separate things were going on:

1) My "current" tile was an idealized re-creation, not a screenshot of the real app, and I only drew it at the small size — so it looked smoother and more consistent than what you actually see. That was misleading; I've redone the comparison (v2 screenshot in chat) using the real button CSS at the real sizes.

2) The shape really is inconsistent in the app, and the cause is in the code: SpinningIconLabelButton hard-codes `border-radius: 15px` on every variant. 15px is an absolute value, so the corner curve never changes with height. A tall button (Add task / All done) ends up reading as a slightly-rounded rectangle, while a short button (Move / Resolve) with the same 15px reads as a near-pill. Same component, different apparent shape. The container amplifies it — flex rows stretch buttons to different heights and the `buttonWhiteBackground` variant caps height at 1.8rem — so identical buttons render at several heights and therefore several different roundnesses. That size-dependent rounding is the "distortion" you're picking up.

This actually sharpens the fix for "better buttons look": make the radius consistent so the shape is the same everywhere. Two clean ways, both shown in v2:
- Option A: a single small radius (10px) + even heights — corner looks identical at every size.
- Option C: `border-radius: 999px` (a true pill) — radius always exceeds half the height, so it's a perfect pill at any size by construction, and stays closest to today's rounded identity.

The current 15px is the awkward middle that looks different at every size. My recommendation remains C, but A is the safe pick if you want minimal change. Let me know which and I'll implement it.

> ##### Reply C-all-965<a name="c-all-965"></a> 
On the buttons.html page what you are calling "current" looks considerably better than what I am seeing in this picture below.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/113c1e7b-7084-4388-baef-07c67f0079bd.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Could the buttons in the picture above in the task be somehow affected by the container they are in so that there shape is slightly distorted? Or is this in my imagination?

#### Option O-2<a name="o-2"></a>
#### A - Refined outline
Most conservative. Keeps the outlined language but on a white surface with a softer 12px radius, medium weight, a gentle hover shadow and a 1px press dip. Primary action filled blue. Lowest visual change, safest.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### C - Elevated pill
Keeps the brand's fully-rounded pill shape but adds a real drop shadow, a hover lift, and a scale+dip on press. Most tactile / obviously-clickable, and the press feedback carries straight into T-all-2170. Primary actions get a solid blue fill for hierarchy. This is my recommendation — it improves look and click feel together while keeping the rounded brand identity.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
C (elevated pill) solves "better look" and the upcoming "click animation" task (T-all-2170) in one move: the shadow/lift/press-dip is the tactile feedback the current button is missing, while the rounded pill keeps the existing brand identity so it's not a jarring redesign. Moderate certainty only because between A and C is a genuine taste call you should make from the screenshot — A is the safe choice if you want minimal change.

#### Option O-3<a name="o-3"></a>
#### B - Soft tonal
Borderless light-blue tonal fill, flatter and more modern, tinted text, solid-blue primary. Biggest visual shift of the three; reads strongest against the teal surface but is the furthest from today's look.


This option is in stage In Dialog.
#### Resolved Question Q-all-133<a name="q-all-133"></a>  
T-all-2178: the compressed comment lists in wizards (e.g. the "these comments will be resolved" step, and the reply-parent card) look cramped - avatar + author + body + chevron jammed on one line, ragged fit-content widths. Screenshot comments.png in chat shows the current look vs three cleaner directions, all full-width and distinguishing the comment type (suggestion=orange, blocker=red, task=green, etc.). Which direction should I implement (then verify live, light + dark)?

#### Option O-3<a name="o-3"></a>
#### Type-chip cards
Each comment is a clean card with a small outlined type chip (Suggestion / Blocker / Task) on the left, then the body and chevron. The type is spelled out as a labeled chip rather than just a color - most explicit, but adds a chip to every row.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Compact list
One bordered list container with the comments as rows separated by dividers, each with a small type-color dot + body + chevron. Most compact and tidy for longer lists; drops the per-card look and the avatar in favor of density.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Type-accent rows
Full-width cards with a type-colored left edge (suggestion/blocker/task), the body prominent, and the author + type as small subtext under it; chevron on the right. Closest to the current card style but cleaner, consistent width, and the color now signals type instead of always-blue. This is my recommendation - it reuses the same type-accent treatment we just shipped for the job-card inner items (C-all-982), so the app stays consistent.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Type-accent rows fixes the cramped/ragged problem (full-width consistent cards, clear hierarchy with body prominent and author/type as subtext) and reuses the exact type-colored left-edge treatment we just shipped for the job-card inner items (C-all-982), so the compressed comments and the job cards read consistently. The blue-only accent and fit-content widths were the core issues; this addresses both. Certainty 3 because it is a taste call - Compact list is better if these lists get long and you want density, and Type-chip cards if you want the type spelled out in words.

#### Resolved Question Q-all-126<a name="q-all-126"></a>  
T-all-2173 "Better contrast on colors chosen for all screens." The job's earlier direction (Q-all-117) was conservative: keep the palette, fix the clearly-failing contrast spots. I'm now connected to the running app and can measure WCAG contrast ratios and verify fixes live. How do you want to approach it?

#### Option O-1<a name="o-1"></a>
#### You point me at spots
You flag the low-contrast text/elements that bother you (the way you did for alignment), and for each I measure the actual contrast ratio, fix it while keeping the palette, and verify live. Fast, focused on what you actually notice, and bounded. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Pointing-at-spots worked very well for the alignment task and is bounded — you flag what actually bothers you, I measure/fix/verify each live, and we avoid me churning through a full two-mode audit of every screen flagging things that may not matter. The conservative-polish direction (fix clear failures, keep palette) fits a targeted approach. I can always escalate to a fuller audit of a specific screen if you want.

> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### I run a measured audit
I screenshot the main screens in light AND dark mode, compute WCAG contrast ratios for the text/element pairs, and bring you a prioritized list of the clear failures (below 4.5:1 for normal text) with proposed palette-preserving fixes. More thorough but a bigger pass, and may flag things you do not care about.


This option is in stage In Dialog.
#### Resolved Task C-all-992<a name="c-all-992"></a>  
The question interface works well functionally but now maybe the icon buttons can be done in a better or more matching way.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e23a73d9-3551-45a5-a84a-29e9baa69151.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Question Q-all-125<a name="q-all-125"></a>  
T-all-2166 "improve alignment and centering where possible" is broad and visual — alignment issues are hard to enumerate from code, and you're the one with the running app. How do you want to scope it? (I can't run the authenticated app here, so for spotting misalignments your eyes are far more reliable than my guessing.)

#### Option O-1<a name="o-1"></a>
#### You point me at spots
You screenshot the specific misalignments / off-center elements you want fixed (the way you've been flagging things), and I fix each one. Most reliable for a visual 'where possible' task, and avoids me editing CSS blind across the whole app. This is my recommendation.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Alignment is a per-pixel visual judgment that I can't reliably find from source, and I can't run the authenticated app to spot it. You've been flagging issues precisely via screenshots, and that's been by far the fastest path to the right fix. Pointing me at the specific spots avoids me churning CSS blind across dozens of screens. The action-row rework is a worthwhile concrete second option since the recent button/pill changes likely disturbed the hand-tuned checkbox margins there.

#### Option O-3<a name="o-3"></a>
#### Wizard step centering pass
I make the wizard steps consistent — intro text, the new pills, and the action buttons aligned/centered to a consistent left edge and spacing. Touches many wizard steps.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Start with the action rows
I rework the comment/task/bug action row so the buttons, the Visible / In-progress checkboxes, and the severity dropdown are cleanly vertically centered — replacing the hand-tuned marginTop values that were aligned to the old taller buttons and were likely thrown off by the recent button/pill changes. Concrete and self-contained; I can do it now, you verify live.


This option is in stage In Dialog.
#### Resolved Report R-all-208<a name="r-all-208"></a>  
T-all-2179 "When expand a row that is compressed in wizard lose the chip saying what it is" is ready to look at.

What was wrong: a compressed comment row draws its type indicator with the new outlined CommentTypeChip directly; on expand the row switches to CardType, which only rendered the chip inside a `{label && ...}` gate. TODO_TYPE (Task) and REPORT_TYPE (Note) have no default label in labelIntlIds, so those two lost their chip on expand. Blocker / Question / Suggestion kept it only because they have default labels.

Fix (src/components/CardType.js): the comment-type and vote-certainty chip now renders regardless of whether a label was passed — CommentTypeChip supplies its own "Task"/"Note"/etc. label — so the expanded view matches the compressed view for every comment type. Detail in note R-all-207.

Scope/regression: TODO/REPORT only reach CardType via comment rendering; the other CardType call sites (Voting certainty, Decision OPTION/PROPOSED, Planning stages) are unchanged. eslint passes on the changed file.

One actionable item is filed as S-all-74 (not folded in here): I can't run the authenticated app in this environment, so please eyeball an expanded Task and Note row in light + dark to confirm the chip persists.

## Job J-all-314<a name="j-all-314"></a>
### Has to be a way to tell users to run install again for the AI stuff.
A new install script, CLI script, proxy script, or rules MD has to create a notification after you get the latest. Tricky.


This job is in stage Complete.
#### Reports 
#### Report R-all-169<a name="r-all-169"></a>  
T-all-2152 is closed out in two parts. First, R-all-167 explains why the equality comparison needs no version ordering: the stored seen value is only ever a copy of the backend's stamp, so any mismatch means a -s release happened since the user last acknowledged one. Second, the real gap C-all-959 identified — an undismissed toast dying on refresh and not returning until the next 5-minute poll — is fixed per the Q-all-106 decision (O-1): WebSocketContext.js now runs the version check at load and again when workspaces finish hydrating, so the toast reappears immediately and keeps reappearing until the user actually closes it. Acknowledgment still requires a real click; details in R-all-168.

Ready to look at: refresh the page with an unacknowledged reinstall stamp and the toast should be back within a second or two of the app loading rather than minutes later. Forced signouts and the ordinary refresh notice also now fire at load. The full end-to-end pass remains gated on the S-all-68 backend trigger change, as already planned in the resolved S-all-69.

#### Notes 
#### Note R-all-168<a name="r-all-168"></a>  
Implemented per Q-all-106 (O-1, click-to-acknowledge kept): the version check is now extracted into a checkAppVersion helper in WebSocketContext.js that runs at provider mount and again when the user's workspaces finish loading (hasNonDemo flipping), in addition to the existing 5-minute interval and websocket push. So after a refresh or close-and-reopen the undismissed reinstall toast reappears immediately instead of after up to 5 minutes, and markSeen still only fires when the user actually closes the toast — nothing in the app calls toast.dismiss() globally, so there is no path that stamps seen without a real click.

The re-run on workspace load matters because the reinstall notice is suppressed until demo status is known; without it, the mount check would land while hasNonDemo is still false and the toast would again wait for the first poll tick. A side effect of checking at load: forced signouts (cache_clear_version mismatch) and the ordinary new-version refresh notice also fire immediately on load now instead of up to 5 minutes late. Toasts are deduped by toastId so the extra checks cannot stack duplicates. ESLint passes.

#### Note R-all-154<a name="r-all-154"></a>  
Implementation notes for reviewers and for the S-all-66 backend work:

**Contract for the table-changed trigger (S-all-66):** the new DynamoDB attribute is `requires_script_reinstall` (boolean, default false), set by `record_release.py -s true`. Per Q-all-95 the trigger should deliver it to the UI as a monotonically increasing integer version — same transformation as `requires_cache_clear` — in both the `UI_UPDATE_REQUIRED` websocket payload and the get app version response, under the key `requires_script_reinstall`.

**Front end behavior** (all in `src/contexts/WebSocketContext.js`):
- Persistent toast `noticeScriptReinstall`: "The Uclusion AI integration has been updated. Please re-run the installation command found under Integrations > MCP & CLI." (Q-all-96)
- Last-seen version stored in login-persistent storage under `script_reinstall_version`, written only when the user closes the toast (Q-all-97). Because dismissal is what marks it seen, a notice suppressed at one check (e.g. markets not loaded yet) simply retries on the next websocket push or 5-minute poll.
- Missing stored version initializes silently to the current version, mirroring the cache-clear flow (Q-all-99).
- Suppressed on mobile via user-agent detection (`isMobileDevice()` in `src/utils/userFunctions.js`, uses `navigator.userAgentData.mobile` with a user-agent regex fallback, per Q-all-98) and for users whose active planning workspaces are all demos (C-all-955, checked via `marketIsDemo` over `getMarketDetailsForType(..., PLANNING_TYPE)`).
- The script notice is independent of the forced-signout and refresh notices; signout takes effect on toast close as before, and since `script_reinstall_version` is login-persistent it survives the signout.

#### Note R-all-156<a name="r-all-156"></a>  
Correction to R-all-154 now that Q-all-100 settled T-all-2149 on "Keep Boolean, track by app_version":

**Contract for the table-changed trigger (S-all-66):** pass `requires_script_reinstall` through as the boolean it is in the table — no integer conversion, exactly like `requires_cache_clear` is handled today. The integer-version contract described in R-all-154 is obsolete; that earlier note was based on the mistaken belief that something already converted `requires_cache_clear` to a version number.

**Front end (T-all-2149):**`notifyNewApplicationVersion` now treats both flags as booleans and dedupes by `app_version`. The forced signout fires only when `requires_cache_clear` is true AND the stored `login_version` differs from the current `app_version` (the reloader stores the current `app_version` on close), which fixes the old repeated-signout bug. The script-reinstall notice uses identical semantics with its own `script_reinstall_version` key, marking the current `app_version` seen on dismissal. A legacy `login_version` of boolean `true` from the old buggy storage is re-initialized to the current `app_version` so nobody gets a spurious signout from stale storage.

#### Note R-all-167<a name="r-all-167"></a>  
It works by change detection, not ordering — the inequality is deliberate and ordering is never needed. The invariant: `seenVersion` is only ever assigned values that came from the backend's `script_reinstall_version` stamp itself (either silently on a fresh browser, or via `markSeen` when the user dismisses the notice). The client never invents or computes a version. And the backend stamp only changes when a release runs with `-s`.

So at any poll/push:
- `seen === stamp` → the user already acknowledged (or was initialized at) the most recent reinstall-requiring release → stay quiet.
- `seen !== stamp` → the stamp has changed since the user last acknowledged it, which by construction means at least one `-s` release happened in between → notify. Dismissal copies the new stamp into `seen`, returning to the quiet state.

"Higher/lower" would only matter if `seen` could hold a value that never was the stamp, which can't happen, or if the stamp could move backwards (a rollback re-running record_release with `-s` and an older app_version) — and in that case re-notifying is the correct behavior anyway, since the deployed scripts changed again. This also self-heals legacy storage: if a boolean-era build left `true` (or any stale value) under the key, it's `!==` the stamp, the user gets one notice, and dismissal overwrites it with a real stamp.

The forced-signout path uses the identical scheme against `cache_clear_version`, and `clearUclusionLocalStorage` preserves the LOGIN_PERSISTENT bucket, so both stored stamps survive signouts and cache clears.

> ##### Reply C-all-959<a name="c-all-959"></a> 
The user does not have to dismiss the notification - he can just refresh the page or close the page and open again later. If you want to go this route you will have to make sure the toast survives these events or just assume the user has seen it and go ahead and mark seen without requiring a click.

#### Resolved 
#### Resolved Task S-all-66<a name="s-all-66"></a>  
Backend change needed beyond the two repos listed: triggered/deployment_group_version_table_changed.py must also be modified so the new script-reinstall flag propagates from the deployment group version table into the UI_UPDATE_REQUIRED websocket payload and the get app version response, the same way requires_cache_clear does today. Without that the new -s flag set by record_release.py never reaches the front end. Per David in chat, he will take this piece.

#### Resolved Question Q-all-103<a name="q-all-103"></a>  
requires_cache_clear has the same gap T-all-2150 describes: a user who skips the -c release is never force-signed-out, even though their cache is stale. Should the same fix (persisted cache_clear_version instead of a per-release boolean) be applied to the cache-clear path in this job?

#### Option O-2<a name="o-2"></a>
#### No, scope this job to the script-reinstall flag only
Leave requires_cache_clear as a boolean for now and fix only the script-reinstall path that T-all-2150 is about. The cache-clear gap would need its own job later, and the two paths would temporarily use different mechanisms.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Yes, fix both paths the same way
Add cache_clear_version alongside script_reinstall_version in the model and record_release.py, and switch the forced-signout comparison in WebSocketContext.js to it. Both notices then share one consistent mechanism, and a stale-cache user who was offline during the -c release still gets signed out on return — arguably more important than the reinstall notice since cache clear affects correctness.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The cache-clear path has the identical flaw and the fix is the same three small edits, so doing both now keeps one mechanism instead of two. Slightly less certain only because force-signout is more disruptive if anything goes wrong, but a user with a genuinely stale cache being silently skipped is worse.

> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Resolved Report R-all-157<a name="r-all-157"></a>  
T-all-2149 is done: both flags now work as booleans deduped by app_version, per Q-all-100.

In `src/contexts/WebSocketContext.js`:
- The forced-signout path is fixed: it fires only when `requires_cache_clear` is true and the stored `login_version` differs from the current `app_version`, and the reloader stores the current `app_version` on toast close. Previously the boolean comparison meant repeated signouts the whole time the flag was true.
- The script-reinstall notice uses the same semantics with its own `script_reinstall_version` storage key — show when `requires_script_reinstall` is true and the stored version differs, mark the current `app_version` seen on dismissal. Mobile/demo suppression and silent first-time initialization are unchanged.
- Legacy storage holding boolean `true` in `login_version` (possible under the old bug) is re-initialized to the current `app_version` so stale storage cannot cause a spurious signout.

No changes were needed in circleci_orbs or the workflow — the booleans written by `record_release.py -c/-s` are now exactly what the front end expects. R-all-156 has the corrected S-all-66 contract: the trigger should pass `requires_script_reinstall` through as a boolean, not convert it. ESLint passes. End-to-end testing still per S-all-67 once S-all-66 lands.

#### Resolved Question Q-all-106<a name="q-all-106"></a>  
Per C-all-959 on T-all-2152: the reinstall toast doesn't survive a refresh or page close, and there is no version check at app startup — today it only reappears at the next 5-minute poll tick or release push, so a user who refreshes can go unnotified for up to 5 minutes (and meanwhile may believe they were never told). Which way should acknowledgment work?

#### Option O-2<a name="o-2"></a>
#### Mark seen on display, no click required
Stamp the seen version as soon as the toast is shown. Simplest change and never nags, but the toast can appear in a background tab or be wiped by an immediate refresh without ever being read, and then it never returns — the user's scripts silently stay stale until the next -s release.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Keep click-to-acknowledge, re-show immediately on load
Keep markSeen on dismissal, and add a getAppVersion check when WebSocketContext mounts so the toast reappears immediately after any refresh or reopen instead of waiting for the first 5-minute poll. The notice nags once per session until the user actually closes it, which guarantees it was seen before we stop showing it. Side benefit: forced signouts and the ordinary new-version refresh notice also fire at startup instead of up to 5 minutes late.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The reinstall notice is actionable — if it's never read, the user's CLI/AI integration silently stays stale, which is the exact failure J-all-314 exists to prevent. Mark-on-display (O-2) can stamp seen while the toast sits in a background tab or is wiped by an instant refresh, and then it never returns. Re-showing on load costs one extra getAppVersion call at mount and makes forced signouts immediate too. Not a 5 only because the nag-until-clicked behavior is mildly annoying for users who ignore toasts.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Resolved Task T-all-2152<a name="t-all-2152"></a>  
```
if (seenVersion !== scriptReinstallVersion) {
```

```
console.log(`Script reinstall with required version ${scriptReinstallVersion} and seen version ${seenVersion}`);
```

```
const markSeen = () => setLoginPersistentItem(LAST_SCRIPT_REINSTALL_VERSION, scriptReinstallVersion);
```

```
sendInfoPersistent({ id: 'noticeScriptReinstall' }, {}, markSeen);
```

```
}
```

Without any concept of versions being higher or lower how is this logic supposed to work?

#### Resolved Report R-all-160<a name="r-all-160"></a>  
T-all-2150 is fixed per Q-all-102 and Q-all-103: both flags moved from per-release booleans to persisted version stamps, so users who skip the -c or -s release are still notified when they next return.

In circleci_orbs:
- `models/deployment_group_version_model.py` adds nullable `cache_clear_version` and `script_reinstall_version` attributes; the booleans remain for the transition.
- `utils/record_release.py` stamps the new attributes with the release's app_version when -c/-s is true and otherwise leaves them untouched, so they persist across later releases. The CLI contract and the reusableBuild.yml invocation are unchanged ("set -s back to false after" still applies — leaving it true would re-stamp and re-notify on every release).

In uclusion_web_ui `src/contexts/WebSocketContext.js`:
- The reinstall notice now compares the stored seen version against the backend's script_reinstall_version and stores that required version on dismissal; a null required version means no release has needed a reinstall yet, and fresh browsers still initialize silently per Q-all-99. Mobile/demo suppression unchanged.
- The forced signout works the same way against cache_clear_version, fixing the identical gap per Q-all-103.

Until the S-all-68 backend trigger change lands, the new payload fields are undefined and the front end shows neither notice — fail-safe, no spurious signouts during the transition. S-all-68 has the backend contract (including why existing rows must backfill null), and S-all-69 has the end-to-end test plan including the skipped-release case T-all-2150 raised. ESLint passes on the JS and both Python files compile.

##### From AI user:
> ##### Reply C-all-957<a name="c-all-957"></a> 
You're right — they aren't needed and I removed them. My transition rationale didn't hold up: an old cached client that misses a forced signout still gets the ordinary "new version available" refresh notice (that path only compares app_version), and once the user refreshes, the new UI sees the cache_clear_version mismatch and signs them out anyway. So the booleans bought nothing.

Removed requires_cache_clear and requires_script_reinstall from deployment_group_version_model.py and the corresponding set() actions from record_release.py; only app_version plus the conditional version stamps are written now. The -c/-s CLI flags are unchanged — they just decide whether to stamp.

One note for S-all-68: deleting the attributes from this model doesn't delete them from existing DynamoDB rows, so the rows keep whatever boolean values were last written. Once the backend model and trigger stop reading them they're dead data, but the trigger change should land before any release runs with -s true again, since a frozen requires_script_reinstall=true forwarded by the old trigger would re-notify per release on any client running the short-lived boolean UI build.

> ##### Reply C-all-956<a name="c-all-956"></a> 
Why do we need

```
requires_cache_clear = BooleanAttribute(default=False)
```

```
requires_script_reinstall = BooleanAttribute(default=False)
```

in the data model still?

#### Resolved Task T-all-2150<a name="t-all-2150"></a>  
I don't understand how this will work when I set the flag back to false. The version that required MCP / CLI install again will only be set for users that received the first release. Anyone who didn't get the release when the MCP / CLI changed will never know they are behind.

#### Resolved Suggestion S-all-69<a name="s-all-69"></a>  
Re-run the end-to-end test (supersedes the resolved S-all-67 plan) once the S-all-68 backend change lands: run `python -m utils.record_release -a <new_version> -c false -s true` against dev, confirm script_reinstall_version is stamped in DynamoDB, and verify the reinstall toast appears once and not again after dismissal. Then the key new case T-all-2150 is about: release again with -s false, clear the browser's script_reinstall_version storage back to an older value (simulating a user who skipped the -s release), reload, and confirm the toast still appears even though the latest release did not set -s. Also verify a fresh browser profile initializes silently with no toast, and that the forced-signout path behaves the same way against cache_clear_version with -c.

#### Resolved Task C-all-955<a name="c-all-955"></a>  
We also need to not display this notice to users that are just in demo workspaces.

#### Resolved Question Q-all-99<a name="q-all-99"></a>  
On a browser with no stored script-reinstall version (brand-new user, new browser, or cleared storage), should the reinstall notice show or initialize silently? The cache-clear flow initializes LAST_LOGIN_APP_VERSION silently when missing so fresh installs are not signed out. Mirroring that exactly means a user who does not open the app between this UI release and the first -s release would never see that first notice. The reason on Q-all-98's chosen option ('a reminder of the ability to integrate with AI is good anyway') could argue for showing instead.

#### Option O-1<a name="o-1"></a>
#### Initialize silently like cache clear
When no script version is stored, store the current one and show nothing. New users and fresh browsers never see a stale notice; only -s releases after their first app load trigger it. Same semantics as the existing cache-clear flow.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Consistent with the cache-clear semantics and avoids showing a reinstall notice to people who never installed anything; the missed-first-release window only affects users who do not open the app between this UI release and the first -s release, which for active users should be small.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### Show when missing
Treat missing as version 0 so any -s release ever made shows the notice once. Guarantees the first -s release reaches everyone, but every new user / new browser / cleared-storage session sees a reinstall notice on first login even if they never installed the integration.


This option is in stage In Dialog.
#### Resolved Question Q-all-96<a name="q-all-96"></a>  
What should the reinstall notification in the UI say? It will be a persistent toast like the existing 'A new version is available!' notice. Note the install command itself needs a workspace id and group id (see Integration Preferences page), so embedding a literal command in a global toast is awkward.

#### Option O-3<a name="o-3"></a>
#### Include the install command inline
Embed the curl install command in the notice. Most direct, but the toast is global and the command requires a workspace id and group id, so the UI would have to pick one (or show a partial command).


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Point to Integration Preferences
Something like: 'The Uclusion AI integration (install script, CLI, proxy, or rules) has been updated. Please re-run the installation command found under Integration Preferences.' Keeps the toast generic while telling the user exactly where to get their workspace-specific command.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Pointing to Integration Preferences sends the user to the one place that already renders their workspace- and group-specific install command, so the toast stays generic without losing actionability.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### Point to documentation
Something like: 'The Uclusion AI integration has been updated. Please re-run the install per https://documentation.uclusion.com/cli.' Works even for users who do not remember where Integration Preferences is, but adds a hop to find the actual command.


This option is in stage In Dialog.
#### Resolved Question Q-all-100<a name="q-all-100"></a>  
For T-all-2149: which way should the cache-clear and script-reinstall flags be modeled so the front end can dedupe per release? Today requires_cache_clear is a Boolean everywhere and the front end's integer comparison never worked: while the flag is true the signout fires repeatedly, and LAST_LOGIN_APP_VERSION only ever stores a boolean. Whatever we pick applies to both flags.

#### Option O-2<a name="o-2"></a>
#### Model as version numbers
Change both attributes to numbers: record_release.py sets them to e.g. epoch seconds when -c/-s is true and leaves them unchanged when false. The trigger passes the numbers through. The front end's existing integer comparison then works as written. Costs a model migration (existing rows hold booleans), record_release changes, and means -c/-s false no longer resets the attribute.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Keep Boolean, track by app_version
Table keeps the two booleans exactly as record_release.py now writes them, and the trigger passes them through untouched. The front end dedupes by storing the delivered app_version string (the git sha prefix, which uniquely identifies a release) in LAST_LOGIN_APP_VERSION / script_reinstall_version when the user signs out or dismisses, and only fires when the flag is true AND the stored version differs from the current app_version. No further circleci_orbs or trigger changes beyond passing the new boolean through; only WebSocketContext.js logic changes.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Boolean is the natural modeling for 'this release requires X', and the app_version sha already uniquely identifies a release, so equality tracking gives correct once-per-release behavior without inventing a synthetic counter, without a table migration, and without touching the already-done record_release changes. It also keeps the nice property that -c/-s false actively resets the flag each release.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Resolved Task T-all-2148<a name="t-all-2148"></a>  
Can follow the -c in uclusion_web_ui/.github/workflows/reusableBuild.yml and have a -s or something that invokes different message and behavior on the front end. Do have to remember to remove the flag though.

#### Resolved Question Q-all-97<a name="q-all-97"></a>  
When should the reinstall notice stop showing for a given user? Unlike the forced-signout flow, nothing on the client can detect that the user actually re-ran the install, so we have to pick a dismissal policy.

#### Option O-2<a name="o-2"></a>
#### Every session until dismissed
Re-show the notice on each new login/session for the current script version, only suppressing it within a session after dismissal. Nags users who already reinstalled, since we cannot detect the reinstall.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Once dismissed, per release
On toast close, store the seen script version in login-persistent storage (same pattern as LAST_LOGIN_APP_VERSION for cache clear). The notice shows once per -s release and never again until the next -s release. Risk: a user who dismisses without reinstalling is never reminded.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Once-per-release matches the existing cache-clear UX and avoids nagging users who already reinstalled; the dismissed-without-reinstalling risk also exists today for the signout notice and seems acceptable.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Resolved Report R-all-155<a name="r-all-155"></a>  
All three tasks are implemented and resolved; only the S-all-66 backend trigger change (David) remains before the flow works end to end.

**circleci_orbs (C-all-954):**`deployment_group_version_model.py` gains `requires_script_reinstall` (boolean, default false); `record_release.py` accepts `-s/--script` and sets it on every deployment group alongside the existing cache-clear flag.

**uclusion_web_ui (T-all-2148, C-all-955):** - `.github/workflows/reusableBuild.yml` now passes `-s false` with a comment explaining to set it true for a reinstall release and to remember to set it back.
- `src/contexts/WebSocketContext.js` reads `requires_script_reinstall` from both the `UI_UPDATE_REQUIRED` websocket payload and the 5-minute `getAppVersion` poll, and shows a persistent toast pointing to Integrations > MCP & CLI. Seen-version dedupe, silent first-time initialization, and suppression on mobile and for demo-only users are implemented per the answered questions (details in R-all-154).
- New `isMobileDevice()` helper in `src/utils/userFunctions.js` and the `noticeScriptReinstall` string in `en.js` (other locales not touched, matching how `noticeVersionForceLogout` was handled).

ESLint passes on the changed JS files and the Python files compile. Full end-to-end verification is blocked on S-all-66; the proposed test plan for after it lands is S-all-67.

#### Resolved Question Q-all-102<a name="q-all-102"></a>  
T-all-2150 is correct: the booleans are stamped per release, so anyone who skips the -s release returns to requires_script_reinstall=false and never learns they are behind. How should we close that gap?

#### Option O-2<a name="o-2"></a>
#### Leave the boolean set to true permanently
Never pass -s false again; dedupe purely by app_version on the front end. This does notify late users, but it re-notifies every user on every subsequent release while the flag is true, which is exactly the over-notification the boolean+dedupe design was trying to avoid. Not recommended.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Track reinstall state per user on the backend
Record on each user which script version they last installed (e.g. stamped by the install command itself) and notify until it matches. Most accurate — it would even catch users who dismiss the toast without reinstalling — but requires new backend state, an install-side reporting hook, and is much more work than the deployment-group version stamp.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Persist the version that last required reinstall
Replace the per-release boolean with a persisted marker. record_release.py -s stamps script_reinstall_version = that release's app_version on the deployment group and it stays there across later releases (no more resetting to false). The front end shows the notice whenever its stored seen version differs from the backend's script_reinstall_version, and on dismissal stores that required version (not the current app_version). A user returning weeks later still sees a mismatch and gets the notice exactly once. Fresh browsers initialize silently to the current required version per Q-all-99. The booleans can remain in the model during transition so nothing breaks before the backend trigger change lands.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The version stamp directly fixes the late-user gap with minimal new machinery: one persisted attribute on the deployment group, a one-line semantic change to -s in record_release.py, and a comparison swap in the front end. The permanent-true boolean over-notifies on every release, and per-user backend tracking is far more work than the problem warrants.

> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
Again I will handle the changes in the repo you don't have access to, to match the changes you make in the ones you do.

#### Resolved Suggestion S-all-68<a name="s-all-68"></a>  
Backend changes needed for the Q-all-102/Q-all-103 version-stamp contract (replaces the S-all-66 boolean contract): the deployment_group_version model in the backend repo needs the new cache_clear_version and script_reinstall_version string attributes, and the trigger plus getAppVersion must pass both through to the UI_UPDATE_REQUIRED payload and the version response unchanged (the front end now destructures cache_clear_version and script_reinstall_version instead of the booleans). Important: leave the new attributes null on existing rows rather than backfilling a historical version — the front end treats null as "no release has required this yet", so a null backfill means no notices until the first real -c/-s release, whereas backfilling an old version would make every existing browser's stored value mismatch and fire one spurious forced signout/notice for everyone. The booleans can keep flowing during the transition (old cached front ends still read them; new front ends ignore them) and be dropped once this lands.

#### Resolved Task T-all-2149<a name="t-all-2149"></a>  
The existing cacheClearVersion logic seems to have had a bug. requires_cache_clear is stored as a Boolean and there is nothing along the way to convert it. Either the modeling in the model needs to change and be populated with a version number or we use Boolean and store the current version as LAST_LOGIN_APP_VERSION for tracking.

Similarly then requires_script_reinstall must somewhat match.

#### Resolved Question Q-all-95<a name="q-all-95"></a>  
What shape should the new script-reinstall flag arrive in at the front end (in the UI_UPDATE_REQUIRED websocket payload and the getAppVersion response)? Today requires_cache_clear is a boolean in the DynamoDB table but the trigger delivers it to the UI as an integer version, which is what lets the UI dedupe the forced signout per release (compared against LAST_LOGIN_APP_VERSION in login-persistent storage). Proposed field name: requires_script_reinstall (name flexible).

#### Option O-2<a name="o-2"></a>
#### Plain boolean
The UI receives true/false. Simpler backend, but the UI cannot distinguish one -s release from the next, so deduping the notice across releases requires extra bookkeeping (e.g. pairing it with app_version).


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Integer version like requires_cache_clear
Table stores a boolean set by -s; the table-changed trigger delivers a monotonically increasing version number to the UI. The UI stores the last-seen script version in login-persistent storage and only shows the notice when the delivered version is newer. Matches the existing cache-clear pattern exactly and gives clean once-per-release behavior.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Matching the requires_cache_clear integer-version pattern reuses proven plumbing end to end (trigger, payload, and the UI's login-persistent dedupe) and keeps the two flags symmetrical, which makes the front-end change small and predictable.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Resolved Question Q-all-98<a name="q-all-98"></a>  
Who should see the reinstall notice? Not every signed-in user has the AI/CLI integration installed, and a 're-run install' notice is noise for those who don't. Is there a reliable client-side indicator that a user has installed the CLI/MCP integration (something analogous to what backs CLISecret / Integration Preferences), or should everyone get the notice?

#### Option O-3<a name="o-3"></a>
#### All users but not on mobile.
We have no way of knowing whether installed or not except on mobile. Note that should do better than just screen size to detect mobile - I think there is an example of checking agent already somewhere in front end.


This option is in stage In Dialog.
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
Alternative is the install script leaves some marker for the front end that install happened but that is fragile and unnecessary since a reminder of the ability to integrate with AI is good anyway.

#### Option O-2<a name="o-2"></a>
#### Only users with the CLI integration
Gate the notice on an indicator that the user actually installed the integration. Requires such an indicator to exist client-side (or be added to the version payload by the backend).


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### All signed-in users
Simple: show the toast to everyone, same as the new-version and forced-signout notices. Users without the integration just dismiss it once.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Showing to everyone is the simplest correct behavior and matches the other release notices; only worth gating if a reliable installed-CLI indicator already exists client-side, which I have not found.

#### Resolved Task C-all-954<a name="c-all-954"></a>  
In circleci_orbs (poorly named) repo have to modify record_release.py and deployment_group_version_model.py also.

#### Resolved Task S-all-67<a name="s-all-67"></a>  
End-to-end test once the S-all-66 trigger change lands: run `python -m utils.record_release -a <sha> -c false -s true` against the dev table and verify (1) the toast appears on a desktop browser in a non-demo workspace via both the websocket push and the 5-minute poll, (2) it does not appear on mobile or for a demo-only user, (3) closing the toast persists across reloads and sign out/in, and (4) a second -s release shows the notice again. Until then the front end can only be spot-checked by hand-injecting `requires_script_reinstall` into the version payload.

## Job J-all-326<a name="j-all-326"></a>
### AI ready front end.

This job is in stage Complete.
#### Reports 
#### Report R-all-263<a name="r-all-263"></a>  
T-all-2220 is ready to look at (details in note R-all-262).

What was wrong: the comment header's top row had no shared vertical alignment, so differently sized icon buttons (edit is 'small', delete is default size on desktop) and a short-code label pulled up by a -0.6rem margin landed on different baselines — the pencil dropped below the rest, and option comments drifted further because their code rendered as an unstyled bare div.

What changed (implements O-1 from Q-all-160, single centered row):
- Comment.js: added alignItems:'center' to the header flex row so timestamp, edit pencil, short code, and delete share one centered line.
- Comment.js: removed the -0.6rem superscript hack on the short-code linker so it sits inline.
- InvesibleCommentLinker.js: styled the option-comment short code to match the non-option button (color, 0.875rem, nowrap, right padding).

ESLint passes on both files. T-all-2220 is resolved.

Not done: I can't exercise the running app from here, so the visual result is unverified end-to-end. Filed S-all-89 with the exact things to check (normal comment, option comment, and other types for regressions).

> ##### Reply C-all-1026<a name="c-all-1026"></a> 
Alignment still looks off to me. If you measure at the pixel level what do you see?

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/bbbb57f8-863d-43a5-92b0-e0d43ac600bd.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

##### From AI user:
> ##### Reply C-all-1029<a name="c-all-1029"></a> 
Latest screenshot (C-all-1028) — the row alignment now reads clean (chip, avatar, name, timestamp, link, code, copy, trash all on one line). Addressed the chip's flush-left edge:

Measured: the chip was flush to the card's left edge (~0px gap), while its top gap to the card edge was ~7 device px. The avatar renders ~38 device px for a 30px CSS avatar (≈125% zoom), so that top gap is ~6 CSS px — it's the breathing room the chip gets from being vertically centered in a taller row.

Fix: added paddingLeft: 0.375rem (~6px) to the comment header row so the chip's left inset matches that top spacing. It's on the header row, so it only nudges the left-anchored chip; the right-hand cluster stays anchored to the right. ESLint passes. One more screenshot when you can and I'll confirm the left/top match.

> ##### Reply C-all-1024<a name="c-all-1024"></a> 
The top header row has other elements that are now not on the same line as the fixed ones. Also the fixed ones could be a little closer to the top.

##### From AI user:
> ##### Reply C-all-1027<a name="c-all-1027"></a> 
Measured your screenshot (C-all-1026) at the pixel level — vertical center (cy) of each header element, in image px:

1. Question chip: cy 38.5 (sits ~7-11px HIGH)
2. avatar + author name: cy 46
3. red bell: cy 45
4. timestamp "Created…": cy ~50 (ink centroid reads 54, but that's biased low by descenders in "days/ago/by")
5. link icon: cy 50
6. Q-4 code: cy 49
7. copy icon: cy 48.5

So the action cluster (link / Q-4 / copy / timestamp) is now internally aligned to within ~1.5px — that part of the earlier fix worked. The two things still off:
1. The whole cluster (~49) sits ~3px below the author name (46).
2. The type chip (38.5) sits ~7-11px above everyone — it was pinned to the top.

Causes: the header row was top-aligned (flex-start); the `commentType` class had `alignSelf:'start'` pinning the chip up; and the author block carried an asymmetric `useMarginBottom:'10px'` (in GravatarAndName) that makes its content ride high.

Fix just applied (all scoped to Comment.js, no shared-component edits): row now `alignItems:'center'`; removed the chip's `alignSelf:'start'`; removed the 10px author bottom-margin. With the asymmetry gone and everything centering on one axis, the chip, author, timestamp, code and icons should land on a single line. ESLint passes — please re-screenshot when you can (still can't run the app from here).

##### From AI user:
> ##### Reply C-all-1025<a name="c-all-1025"></a> 
Addressed both points (C-all-1024). The cause of the first one: the left block (chip + avatar + author) is pinned to the top by the `commentType` class's `alignSelf: 'start'`, so when I centered the whole row the right cluster dropped to the middle while the left elements stayed up top — hence "not on the same line."

Revised fix:
- Header row now uses `alignItems: 'flex-start'` so it tops out together; the right-hand action cluster sits up on the same line as the chip/author instead of the vertical middle.
- Wrapped the cluster (timestamp, edit pencil, short code, delete) in its own `alignItems: 'center'` flex so those still line up with each other regardless of button size.
- Made the delete button `size='small'` on desktop too (it was default/medium, edit was already small). That removes the size mismatch and shrinks the cluster height so it sits closer to the top — covering "the fixed ones could be a little closer to the top."

ESLint passes. Still unverified in the running app from here — S-all-89 covers the visual check.

> ##### Reply C-all-1028<a name="c-all-1028"></a> 
Latest:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/b271313f-8fc7-4e77-8a43-c25660d8a701.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Notes 
#### Note R-all-248<a name="r-all-248"></a>  
Done. In DecisionInvestible.js (the expanded option view):

1. Added one permanent bottom padding (1.5rem) on the option body container (`contents`), so it sits below everything — including a name+description-only option that previously had no bottom gap. (You said "some padding"; I used 1.5rem — easy to dial up/down.)
2. Removed the per-element bottom paddings below it so it isn't doubled: dropped the trailing `<div marginTop:1rem/>` spacer after the Voting block, and removed `paddingBottom: 1rem` from the comments section (kept its top `marginTop`).
3. Removed the old conditional hack that put `marginBottom: 4rem` on the right-hand actions column only when there were no voting/comments — that was the previous (mis-placed) attempt at this gap; the permanent body padding replaces it.

Net: the option always has a consistent bottom gap below the description / below the other elements, and those elements no longer carry their own bottom padding. ESLint passes.

#### Note R-all-241<a name="r-all-241"></a>  
Implemented per Q-all-154 O-1 ("Blue outline border") + Q-1 (add a click-through icon). All changes are in the compressed comment/task card used by wizards and the inbox.

**1. Blue link outline (`Comment.js`, `containerBlueLink` style)** — replaced the near-invisible gray border (`1px solid rgba(0,0,0,0.12)`) that T-all-2178 introduced with a blue link border `1px solid #2F80ED`. Added a hover state that deepens the border to `#1565C0` and adds a soft blue glow (`0 1px 8px rgba(47,128,237,0.4)`), so the card clearly reads as clickable. Kept the clean rounded card from T-all-2178 — no return of the old heavy full-glow box-shadow.

**2. Click-through icon (`Comment.js`, `compressedCommentCard`)** — added an `OpenInNew` icon (blue `#2F80ED` in light mode) as a `TooltipIconButton` to the left of the existing expand chevron, shown only when `isInbox` (the case where clicking the row actually navigates to the full comment). Its onClick runs the same `navigate(history, formCommentLink(...))` the row already does. The down-chevron still means "expand in place" — the two icons are visually and semantically distinct. New tooltip string `rowOpenComment` ("Open the full comment.") in en.js.

ESLint passes on the changed files. Not committed yet.

#### Note R-all-253<a name="r-all-253"></a>  
Root cause found and fixed. Your pointer to "Go to question" was right — and it explains why the back end looks like it honors is_sent yet the draft question stays unsent.

The "Go to question" handler (myOnFinish in both AddOptionStep.js files, and the equivalent in ConfigureCommentStep.js) calls sendComment to flip the draft question to is_sent=true. But commit e337176e8 ("refactor: simplify comment handling by removing unused label parameters") changed sendComment's signature from (marketId, commentId, label, marketType) to (marketId, commentId, marketType) and did NOT update the three callers. They still call the old 4-arg form:

sendComment(marketId, commentId, undefined, DECISION_TYPE)

Under the new 3-arg signature that binds marketType = undefined and silently drops DECISION_TYPE. So "Go to question" was telling the back end to send the question with no marketType, instead of DECISION_TYPE for the inline-decision question. The send never completes properly, so the question created by "Add Options" (is_sent=false, as intended) is never flipped to sent.

Fix: restored the dropped argument in all three callers to sendComment(marketId, commentId, DECISION_TYPE):
- src/components/AddNewWizards/Discussion/AddOptionStep.js:87
- src/components/AddNewWizards/JobComment/AddOptionStep.js:107
- src/components/AddNewWizards/ConfigureCommentStep.js:136

Note: the two first-screen buttons in CommentAdd.js were already correct (Add options -> is_sent=false, Ask question -> is_sent=true); they were not the bug. The break was the dropped marketType on the send path.

Still needs a runtime check (see the testing suggestion I filed) since the is_sent-stays-false symptom depends on back-end behavior I can't observe directly.

#### Note R-all-243<a name="r-all-243"></a>  
Implemented Q-all-155 O-1 ("Unified composer card"), scoped entirely to the edit screen (CommentEdit.js) so the shared add/reply composers are untouched.

What changed (CommentEdit.js only):
- Wrapped the editor + its relocated toolbar in a single new `.composer` div: one rounded (12px), bordered surface (`#dadce0` light / dark-bg border in dark mode), `overflow: hidden`, capped at 680px to match the editor's own width.
- Scoped overrides under `.composer` (no global CSS touched, so add/reply composers are unaffected):
 - `.ql-container.ql-snow { border: none }` — drops Quill's default full box border; the surface now provides the single border.
 - `[id^="editorBox-"] { min-height: 3.5rem !important }` — shrinks the fixed 8rem empty box so a short comment no longer sits in a big blank area (still grows with content). The 8rem is an inline style, hence `!important`.
 - `.ql-toolbar.ql-snow { width:100%; border-radius:0; margin:0; border-top: hairline }` — turns the detached floating rounded pill into a flush full-width bottom bar inside the surface, with a hairline divider. Closes the gap.
- Made the outer Card transparent (it was a redundant white box) and tightened the CardContent/CardActions padding so Update / Cancel / "Storing locally" read as a clean footer below the composer.

ESLint passes. Could not auto-screenshot (the app needs login and there's no headless browser here), so this needs a visual check on a running instance. Not committed yet.

#### Note R-all-246<a name="r-all-246"></a>  
Implemented Q-all-156 O-2 — the edit-comment screen is now a top-level modal, keyed by comment id, that survives the task being moved to a different job mid-edit.

New:
- `contexts/EditCommentContext/EditCommentContext.js` — holds `editComment = { marketId, commentId }` plus `openEditComment` / `closeEditComment`.
- `components/Comments/EditCommentModal.js` — a MUI Dialog rendered at the top level (in Root). It resolves the comment by id from CommentsContext (the same lookup CommentReplyEdit does) and renders `<CommentBox replyEditId={commentId}>`, so the existing comment header + the unified GMail-style composer (the earlier CommentEdit styling work) render inside the dialog. Width capped ~760px to hug the 680px composer; paper/content overflow visible so Quill toolbar pickers aren't clipped.

Wiring:
- Root.js hosts `EditCommentContext.Provider` (wrapping all comment-rendering pages) and renders `<EditCommentModal />`.
- Comment.js `toggleEdit` and Reply.js `handleEditClick`: opening now calls `openEditComment(marketId, id)` instead of navigating to the `/comment/:marketId/:commentId` page; closing (Update/Cancel) calls `closeEditComment()` when this comment is the one open in the modal. Both keep the old `/comment` navigation as a fallback (so deep links to that route still work full-page).

Why it's safe (per your C-3 + the existing design): the dialog is hosted in Root and looks the comment up by id, so when a task moves jobs and its list row unmounts, the dialog stays open and on-screen. Saving is unaffected — `updateComment` keys off marketId + commentId + version (no investible_id, market can't change), none of which a move alters.

Notes for review:
- Backdrop/Escape close keeps the localStorage draft (so nothing is lost); the explicit Cancel button discards it, as before.
- The `/comment/:marketId/:commentId` route page (CommentReplyEdit) is intentionally left intact for deep links.
- Replies edit through the same modal now too.

Verified: `react-scripts build` succeeds and ESLint passes on all changed files. Still needs a behavioral check on a running instance (open edit, type, ideally move the task, save).

#### Note R-all-245<a name="r-all-245"></a>  
Confirming the modal direction: yes, a modal is the right call and is safe — with one caveat about where it's hosted.

Why it's safe:
1. The Quill draft is already persisted to localStorage keyed to the comment (`editor-comment-edit-editor<id>`), and CommentEdit restores it (`getQuillStoredState(editorName) || initialBody`). So the typed text is recoverable across an unmount even today — it is not truly "wiped".
2. A modal (MUI Dialog) renders in a portal at document.body, so the edit UI is structurally decoupled from the comment's position in the list. When the task moves to a different job and the list reflows, a modal can't get visually mangled or scrolled away the way the in-place editor can.

The one caveat: today CommentEdit is rendered by the in-list `Comment` component (Comment.js:1097). A Dialog still *rendered by that same Comment* would still close if that Comment unmounts when the task leaves this job's view — a portal relocates the DOM, not the React ownership/lifecycle. The draft survives in localStorage (reopen restores it), but the dialog itself would close. To keep the dialog OPEN straight through a move, it has to be hosted at a stable top-level location instead of inside the moving row. See the question I'm filing for that choice.

#### Note R-all-250<a name="r-all-250"></a>  
Two updates in DecisionInvestible.js:

1. Q-all-157 O-4: the bottom gap is now a single named constant `OPTION_BOTTOM_PADDING` (set to 2.5rem) at the top of the file — tweak that one value to play with it.

2. C-all-1017 (short description → right-column created-by/files bump the option below): root cause was the `borderLeft` class on the actions column carrying `marginBottom: -42px`, which pulled that column past the option's bottom. Combined with removing the old conditional 4rem margin, a short-description option (where the right column is the taller one) had no bottom gap. Fix: zeroed that -42px and applied the same `OPTION_BOTTOM_PADDING` to BOTH columns (body + actions), so whichever column is taller still ends with the same gap and nothing bumps the option below.

Net: one knob controls a consistent bottom gap regardless of which column is taller. ESLint passes. Still wants your eyes on the running app — especially the short-description case and confirming options with voting/comments didn't gain too much bottom space.

#### Note R-all-258<a name="r-all-258"></a>  
Fixed the flush-right spacing (C-all-1021): added `marginLeft: 0.5rem` (separates the icon from the Created/Updated date) and `marginRight: 1rem` (pulls it off the card's right edge) to the OpenInNewIcon in the full commentCard header. Consistent with the sibling header buttons that use marginRight for the same reason. The runtime visual check in this suggestion still stands.

#### Note R-all-259<a name="r-all-259"></a>  
Root cause + fix.

How short-code URLs resolve: the ticket index (TicketIndexContext.js:11) is keyed by `${marketId}/${ticketCode}`. The canonical short-code URL `/${marketId}/Q-all-156` works because Root.js calls getUrlForTicketPath, which looks up `pathname.substring(1)` = `${marketId}/Q-all-156` — a key hit.

Why the dialog form failed: the normal in-app URL is `/dialog/${marketId}/${uuid}`. Editing the uuid to a short code gives `/dialog/${marketId}/Q-all-156`. isTicketPath still matches (the `/Q-` triggers it) so Root.js routes it as a ticket, but the lookup key became `dialog/${marketId}/Q-all-156`, which isn't in the index — so it never resolved.

Fix (marketIdPathFunctions.js getUrlForTicketPath): strip a leading `/dialog` before building the lookup key, so `/dialog/${marketId}/Q-all-156` looks up `${marketId}/Q-all-156` and resolves to the canonical URL just like the short form. The isInvestibleTicket/isOptionTicket branch checks are substring-based and already work with the prefix.

Scope note: the task also mentions that searching by short code "was a thing once" but downplays it ("who would know to do that"), and the explicit instruction was to make the dialog URL form work — so I scoped this to the URL. Say the word if you want short-code search restored too; that's a separate change.

Not done: can't exercise the running app from here. Filed a verification suggestion with steps.

#### Note R-all-256<a name="r-all-256"></a>  
Root cause + fix.

Why it happened: in the "Okay that these comments will be resolved?" step (CloseCommentsStep.js:135), when there is exactly one comment `inboxMessageId` is set to that comment's id so it renders expanded for readability. In Comment.js the expand branch (`inboxMessageId === id` && small body, isLargeDisplay(body,7) false) renders the full `commentCard` rather than the `compressedCommentCard`. T-all-2181 added the OpenInNewIcon click-through affordance only to the compressedCommentCard, so the single expanded comment was missing it.

What changed: added the same OpenInNewIcon TooltipIconButton to the full commentCard header (Comment.js, in the cardType/date flex row), guarded by `isInbox && isSent` — exactly the condition under which that card already navigates to the comment on click. Icon navigates via formCommentLink, same as the compressed card. Reused the existing `rowOpenComment` translation.

Not done: can't exercise the running app from here, so the visual placement is unverified end-to-end. Filed a verification suggestion with the steps.

#### Note R-all-261<a name="r-all-261"></a>  
Also restored short-code search (per the follow-up ask), since it was low-risk.

History: short-code search used to live in SearchBox.onSearchChange and was removed in commit ff7e1163f ("fix: links to investibles and comments"). The old version called getTicket(ticketState, value) and navigated to formInvestibleLink — but it would no longer work as-is for two reasons: (1) the ticket index is now keyed by `${marketId}/${ticketCode}`, so a bare typed code has no marketId to match, and (2) it only handled investibles, not options/comments.

What I did:
- Added getUrlForTicketCode(code, ticketState, marketsState, commentsState) in marketIdPathFunctions.js: finds the index entry whose last path segment equals the typed code and reuses getUrlForTicketPath, so it resolves jobs, options, AND comments correctly.
- In SearchBox.updateIndex, if the query resolves to a ticket it navigates there and returns; otherwise it falls through to the normal text search. Mirrors the original "navigate if it's a code, else search" behavior. Runs on Enter and on the debounce, so it doesn't yank you away mid-keystroke.

ESLint passes on both files. Still needs a runtime check (added steps to S-all-88).

#### Note R-all-262<a name="r-all-262"></a>  
Implemented O-1 (single centered row). Changes:

1. Comment.js header row — added `alignItems: 'center'` to the header flex container so the timestamp, edit pencil, short code, and delete icon all sit on one vertically-centered line. Root cause of the drift: the edit button is `size='small'` while the delete button is default size on desktop, so their icon centers landed at different heights when the row used the default `align-items: stretch`.

2. Comment.js linker wrapper — removed the `marginTop: '-0.6rem'` hack that pulled the short code up into a superscript-style corner label; with the row now centered it sits inline at the same height as the icons.

3. InvesibleCommentLinker.js — option comments (short code `O-*`) previously rendered their code as an unstyled bare `<div>`; now styled to match the non-option button (color, `fontSize: 0.875rem`, nowrap, right padding) so it aligns the same way. This is the "especially for option comment" part of the task.

ESLint passes on both files. I can't exercise the running app from here, so the visual result is unverified end-to-end — filed a verification suggestion with steps.

#### Resolved 
#### Resolved Question Q-all-158<a name="q-all-158"></a>  
B-all-452 (is_sent true for the "Ask question" button): before I change anything, I want to reconcile what I found with what you observed, because the current frontend already does what the task describes — and that makes me suspect the real cause is one layer down.

In CommentAdd.js the planning-market question buttons are at lines 579-593:
- "Add options" (onNext) -> handleSave(false, ...) -> is_sent=false (correct, stays false)
- "Ask question" (onOtherNext) -> handleSave(true, ...) -> is_sent=true (already what the task asks for)

So the "Ask question" button is already passing is_sent=true to saveComment today. Given that, a question still coming back unsent would have to come from somewhere else. The one place I can see that overrides the question's fate regardless of is_sent is handleSave lines 384-387: for EVERY planning-market question, createInlineDecision is true, so marketType is forced to DECISION_TYPE and an inline decision (draft) market is created -- even when you click "Ask question" with no options. The returned comment is response.parent, and the inline decision market is a draft ("Inline question markets use draft").

My theory: clicking "Ask question" still spins up a draft inline decision market, and that draft is why the question reads as unsent even though is_sent=true was passed. If that is right, the real fix is to NOT create the inline decision market when sending a question with no options -- i.e., make createInlineDecision also depend on not-sending (only create the draft when the user chose "Add options"). That is a single change at line 384, not at the button.

But I have not watched the runtime, so I do not want to ship a fix in the wrong layer. Two things would settle it:
1. When you click "Ask question" (no options) and see the bug, what do you actually observe -- does the question land but show as unsent/draft, does it bounce you into the add-options flow, or something else?
2. Is the inline-decision-market-on-ask-question my theory describes the behavior you intended this task to fix, or did you genuinely see the "Ask question" button itself passing is_sent=false somewhere I am not looking?

> ##### Reply C-all-1018<a name="c-all-1018"></a> 
If you press Add Options and then change your mind and choose Ask Question then the question has already been sent with is_sent false. What does the Ask Question button on the add options wizard do with is_sent?

I don't see any indication the back end is not honoring is_sent.

#### Resolved Question Q-all-157<a name="q-all-157"></a>  
T-all-2198: how much bottom padding should the option body have below the description / other elements? (Implemented permanently below everything; I used 1.5rem. The task said "some padding," so the amount is a judgment call.)

#### Option O-2<a name="o-2"></a>
#### 1rem (tighter)
Smaller gap, denser. Use if 1.5rem looks too loose, especially when the option already has voting/comments below the description.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Just make this a constant that I can play with.
Set the constant to 2.5rem for now.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### 1.5rem (current)
Moderate gap. What I implemented - a clean bottom gap for a name+description-only option without looking too airy when voting/comments are present.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
1.5rem is a sensible middle: enough of a bottom gap that a name+description-only option no longer looks cramped, without adding too much air when the option also has voting/comments stacked below. I'd only move off it if it reads too loose with content present (then 1rem) or still cramped when empty (then 2rem) — a quick look on a running instance will settle it. Low-stakes, easy to change.

#### Option O-3<a name="o-3"></a>
#### 2rem (roomier)
Larger gap, more breathing room at the bottom. Use if 1.5rem still looks cramped for the name+description-only case.


This option is in stage In Dialog.
#### Resolved Question Q-all-154<a name="q-all-154"></a>  
T-all-2181: T-all-2178 replaced the compressed comment card's blue-glow box-shadow (`containerBlueLink` in Comment.js) with a subtle gray border + soft shadow. In wizards/inbox, clicking that compressed task/comment card navigates ("clicks through") to the full comment, but the gray border now looks identical to every other static card, so the click affordance was lost. Which mechanism should signal "this row is clickable / click through"?

#### Option O-2<a name="o-2"></a>
#### Restore original blue glow
Revert containerBlueLink exactly to the pre-2178 blue-glow box-shadow (0px 1px 8px 0px blue). Literal 'add it back' — strongest signal but the heavier glow is what T-all-2178 was cleaning up.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Blue outline border
Keep the clean rounded T-all-2178 card, but make its border blue (the app's link/question blue, #2F80ED) instead of the near-invisible gray. Reads as a clickable link while preserving the clean card look. Optionally deepen the blue / add a subtle blue glow on hover for extra clarity.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
"Blue outline border" best satisfies the task's intent ("blue link outline ... more clear") while respecting why T-all-2178 cleaned up the heavy glow in the first place. A blue 1px border on the existing rounded card reads unmistakably as a link/clickable element, costs one line, and keeps the clean card aesthetic. Restoring the full blue glow (O-2) undoes the 2178 cleanup; link-styled text + open icon (O-3) is clearer about "open" semantics but is a bigger change and risks the body text wrapping/competing with the type chip. I'd pair O-1 with a slightly stronger blue + soft glow on hover for extra affordance.

> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Let's try with both the recommendations you are making inside this option.

##### Question Q-1<a name="q-1"></a> (under Q-all-154 ▸ option O-1) 
Is there a suitable click through icon that can also be added to indicate to the user he can click through by clicking the icon just in case the blue outline fails to convey the click through property?

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
Yes. The card already shows a **down-chevron (ExpandMoreIcon)** on the right, but that means "expand inline" (toggleCompression) — not "go to the full item". So adding a dedicated click-through icon is a good idea, as long as it's visually distinct from that expand chevron.

Recommendation: **`OpenInNew`** (@material-ui/icons/OpenInNew) — the universal Material "open this in full" glyph (two overlapping squares with an out-arrow). It unambiguously reads as "open/go to the full comment", which is exactly what clicking the row does in a wizard/inbox. I'd render it as a `TooltipIconButton` (tooltip e.g. "Open") placed just left of the existing expand chevron, with its own onClick that navigates (the same `navigate(history, formCommentLink(...))` the card body already runs). Net result: the whole row keeps the blue outline + click-to-open, and there's now an explicit icon the user can click to open as well — with the down-chevron still meaning expand-in-place.

Alternative considered: `KeyboardArrowRight`/`ChevronRight` (the iOS "drill-in" affordance). It's lighter, but it sits right next to a down-chevron and the two chevrons could read as confusingly similar (down vs right), and we already use KeyboardArrowRight elsewhere for pagination. `OpenInNew` avoids that collision and is clearer about "open". My vote is OpenInNew unless you'd prefer the lighter chevron look.

#### Option O-3<a name="o-3"></a>
#### Link-styled text + open icon
Leave the card border neutral, but style the comment body like a hyperlink (link-blue text, underline on hover) and swap the expand chevron for a small 'open/launch' arrow icon. Signals 'click to open' via the content rather than the whole card edge.


This option is in stage In Dialog.
#### Resolved Task T-all-2217<a name="t-all-2217"></a>  
When there is only one comment the OpenInNew icon is missing:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/2682a855-e761-47b7-8702-cc01e18250e1.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Report R-all-257<a name="r-all-257"></a>  
T-all-2217 is ready to look at (root cause and fix in note R-all-256).

What was wrong: in the "Okay that these comments will be resolved?" step, when exactly one comment needs resolving it renders expanded as the full comment card (not the compressed row). The OpenInNew click-through icon T-all-2181 added lived only on the compressed row, so the single expanded comment was missing it — matching the screenshot.

What changed: added the same OpenInNewIcon affordance to the full comment card header in Comment.js, guarded by `isInbox && isSent` (the exact condition under which that card already navigates to the comment on click). It sits in the cardType/date flex row and navigates via formCommentLink, identical to the compressed row; reused the rowOpenComment translation. The compressed multi-comment path is unchanged.

Not done: I can't exercise the running app from here, so the visual outcome is unverified end-to-end. I filed S-all-87 with the exact steps to confirm. Once that passes, T-all-2217 is safe to resolve (already moved to Tasks Complete).

#### Resolved Task S-all-87<a name="s-all-87"></a>  
T-all-2217 verification (runtime): please confirm the OpenInNew icon now appears in the running app. Steps: open a job that needs a stage change requiring exactly one comment to be resolved, so the "Okay that these comments will be resolved?" step shows a single expanded comment card (the screenshot case). Expected: the comment card now shows the blue OpenInNew ("open in new") icon in its top-right header next to the Created/Updated date, and clicking it navigates to the comment. Also sanity-check the multi-comment case still shows the icon on each compressed row (unchanged). Once confirmed, T-all-2217 is safe to resolve.

> ##### Reply C-all-1021<a name="c-all-1021"></a> 
The OpenInNew icon is flush right and needs spacing.

#### Resolved Task T-all-2209<a name="t-all-2209"></a>  
Have AI fix the edit comment screen. Currently looks like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/3d2fab67-dd9b-44ec-9843-007157b0b3d2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Report R-all-244<a name="r-all-244"></a>  
T-all-2209 is ready to look at (details in note R-all-243). The edit comment screen is redesigned per Q-all-155 O-1 into a single GMail-style composer card, scoped to the edit screen only — the add/reply composers are untouched.

Before: the editor box and the toolbar pill read as two detached bordered blocks with a big empty gap, and a one-line comment sat in a tall blank box.

After: editor + toolbar live in one rounded bordered surface — text area on top (no separate border), toolbar as a flush bottom bar with a hairline divider, no gap — the empty min-height is shrunk so short comments no longer float in a big white box, and Update / Cancel / "Storing locally" sit as a clean footer below it.

How to check: edit any existing comment (the pencil/edit action on a comment) and confirm the composer now reads as one cohesive card. Compare against adding a new comment to confirm that flow is unchanged.

Heads up: I couldn't auto-screenshot it here (the app needs login and there's no headless browser in this environment), so this is the one task in the set that wants your eyes on a running instance before resolving. Happy to tweak border weight / radius / min-height once you see it. Not committed yet — say the word and I'll commit starting the message with T-all-2209.

> ##### Reply C-all-1011<a name="c-all-1011"></a> 
It's better but what GMail does for edit is the equivalent of forward:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/b8a7cf93-20cc-4ce6-b434-e9d6e6fc2773.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Note that the editor controls and all buttons are inside the container that you are typing into.

##### From AI user:
> ##### Reply C-all-1012<a name="c-all-1012"></a> 
Updated per C-all-1011 — moved the action row inside the composer container so it matches GMail's model (formatting controls AND buttons all inside the box you type into).

CommentEdit.js now renders the whole thing as a single bordered surface: editor text area on top, the toolbar as a flush bar, and the Update / Cancel / "Storing locally" row as a footer INSIDE the same surface (new `composerFooter` class) — previously those buttons were outside, below the card. Dropped the now-redundant Material `Card`/`CardContent`/`CardActions` wrappers (and their imports) since the composer div is the container now; the editBox ref moved onto it.

ESLint passes. Still needs your eyes on a running instance (no headless browser / login here). If you'd rather the toolbar look like GMail's inset rounded grey pill (sitting above the button row) instead of the current full-width flush bar, say so and I'll switch it — that's the one remaining visual difference from your reference.

#### Resolved Question Q-all-155<a name="q-all-155"></a>  
T-all-2209 (fix the edit comment screen). The base layout is in CommentEdit.js: a white card with the Quill editor on top and Update/Cancel below. Three things make it look bad: (a) the editor box and the toolbar read as two detached bordered blocks with a gap between them; (b) the editor has a fixed 8rem min-height, so a short comment sits in a big empty white box; (c) the author header + editor + toolbar + buttons don't cohere into one composer. Which redesign direction do you want?

#### Option O-2<a name="o-2"></a>
#### Reuse the add-comment composer
Make the edit screen render through the same composer container/layout the new add-comment wizard (T-all-2168 GMail composer) already uses, so adding and editing a comment look identical instead of edit having its own design. Best if the add composer is already the look you want.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Minimal tidy-up only
Keep the current structure but just remove the gap (attach the toolbar to the editor), shrink the empty min-height, and align the Update/Cancel button styling. Lowest risk / smallest change, but still a bespoke edit layout rather than a real redesign.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Unified composer card
Wrap the text area and the toolbar in ONE rounded, bordered surface (toolbar as the bottom bar inside it, no gap), let the height grow with content from a small start instead of a fixed 8rem empty box, and put Update / Cancel / 'Storing locally' as a clean footer row. Edit then reads like one modern GMail-style compose card. Bespoke to the edit screen.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
"Unified composer card" directly fixes all three problems (detachment, empty 8rem box, incoherent pieces) and gives the modern compose look the screenshot is missing. I lean here but only at certainty 3 because "Reuse the add-comment composer" (O-2) could be the better long-term call: if the add-comment GMail composer is already the look you want, sharing one layout means edit and add never drift apart and is less code to maintain — I'd switch my vote to that if the add composer already looks right. I'd avoid "Minimal tidy-up" (O-3) since you said the base design is bad, not just slightly off. Note: the editor/toolbar are shared by every composer (QuillEditor2), so making the toolbar attach inside one bordered surface needs to be done carefully (or scoped to the edit screen) so it doesn't change the add/reply composers unintentionally.

> ##### $${\color{orange} 25 out of 100 - Somewhat Uncertain Reason \space For}$$ E-2<a name="e-2"></a>
Will see what this looks like.

#### Resolved Suggestion S-all-89<a name="s-all-89"></a>  
T-all-2220 verification (runtime): please confirm the comment header alignment in the running app. Check (1) a normal comment (e.g. a Suggestion like the S-1 in the task screenshot) — the timestamp, edit pencil, short code, and delete icon should all sit on one vertically-centered line with the pencil no longer dropped below; (2) an option comment (short code O-*) — its code should line up at the same height/size as a normal comment's code rather than as a bare lower div; (3) a few other comment types (Question, Issue, reply) to confirm nothing else in the top row regressed. I can't exercise the running app from here, so this is the only unverified part. Once it looks right, T-all-2220 is safe to stay resolved.

#### Resolved Question Q-all-156<a name="q-all-156"></a>  
T-all-2209: converting the edit comment screen to a modal. How robust should the modal be against the task being moved to a different job mid-edit? (Background in note R-all-245: the Quill draft is already persisted to localStorage and restores on reopen; the open question is where the dialog is hosted.)

#### Option O-1<a name="o-1"></a>
#### Pragmatic modal (in place)
Wrap the existing CommentEdit in a MUI Dialog rendered where it is now (by the comment's Comment component). Gains: portal decoupling so the editor can't be visually mangled/scrolled by a list reflow, plus the localStorage draft backstop so typed text is never lost. If the comment's row actually unmounts because the task moved out of this job's view, the dialog closes but the draft is safe and restores when reopened. Smallest, lowest-risk change.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
I lean to the pragmatic in-place modal as the first step: it delivers the bulk of the benefit (portal decoupling so the editor isn't mangled by a reflow) and, combined with the existing localStorage draft persistence, means the typed text is never actually lost — which is the core of the "wiped out" worry. It's a small, low-risk change we can ship and eyeball now. The top-level hosted modal (O-2) is the bulletproof version but it's a real refactor and opens save-time correctness questions (saving a comment whose job/market moved out from under the open dialog), which deserve their own thought. My recommendation: do O-1 now, and only escalate to O-2 if you actually see the dialog closing on a real move and the localStorage restore isn't good enough UX. Certainty 3 because the right answer depends on how often a concurrent move really happens and whether a closed-but-restorable dialog is acceptable — your call.

##### Question Q-1<a name="q-1"></a> (under Q-all-156 ▸ option O-1) 
Can you explain what "Gains: portal decoupling so the editor can't be visually mangled/scrolled by a list reflow" means?

I was concerned with the user experiencing the sudden wipe out of the editor he is in which this option does not fix. You are saying this option prevents something from happening but I don't understand what that is.

##### From AI user:
> ##### Reply C-1<a name="c-1"></a> 
You're right, and good catch — let me separate the two problems, because they are different and O-1 only addresses the lesser one.

**What "portal decoupling / mangled by a list reflow" means (the thing O-1 fixes):** Today the editor is an element sitting inline in the scrolling comment list. While you're typing, the list around it can re-render — a teammate's comment appears above yours, the list re-sorts, or an image above finishes loading and grows taller. When that happens, your editor (being in the normal document flow) shifts up/down on screen, the page may auto-scroll, and your cursor/scroll spot inside the box can jump. A modal renders in a fixed overlay floating on top of everything, so churn in the list underneath can't move, scroll, or jump the box you're typing in. That's the "reflow mangling" it prevents.

**The thing you actually care about — the editor suddenly disappearing because the task moved to a different job — O-1 does NOT fix.** You've understood it exactly. If the task leaves this job's view, the comment's row unmounts, and a dialog rendered by that row goes with it (it closes). O-1's only mercy is that the typed text is saved in localStorage so it isn't gone forever, but the box would still vanish from under you — which is the bad experience you described.

**Only O-2 fixes that.** Hosting the dialog at a stable top level (not inside the moving row) means the dialog stays open and keeps your text on screen straight through the move, regardless of which list currently holds the comment.

So given your priority is preventing the sudden wipe-out, O-2 is the right choice — I'm revising my recommendation from O-1 to O-2 (voting it now). The honest trade-off remains: O-2 is a bigger change and needs care at save time if the comment's job/market changed while your dialog was open — I'll handle that as part of the work.

#### Option O-2<a name="o-2"></a>
#### Top-level hosted modal
Host a single app-level edit dialog driven by global edit state keyed to the comment id, so the dialog stays OPEN straight through a move regardless of which list currently shows the comment. Fully addresses the 'wiped out' worry, but is a bigger refactor and needs care for save-time correctness if the comment's job/market context changed while the dialog was open.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
#### From AI user:
Revising my recommendation from O-1 to O-2. Your Q-1 is correct: O-1 does not prevent the editor from vanishing when the task moves jobs — it only prevents reflow jumpiness and keeps the text in localStorage. Since your stated priority is that the user must not experience the editor suddenly wiping out from under them, O-2 (a top-level hosted dialog keyed to the comment id, decoupled from whichever list shows the comment) is the option that actually delivers that — the dialog stays open and on-screen through the move. Certainty 4 rather than 5 only because O-2 carries a real save-time correctness concern (saving a comment whose job/market context changed while the dialog was open), which I'll need to handle deliberately.

> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

##### Question Q-2<a name="q-2"></a> (under Q-all-156 ▸ option O-2) 
Hold up your original recommendation might be right - I don't know why are changing it even though no new evidence has been presented.

What are the risks of this top level hosted modal? Is the concern that it would introduce too much untested code?

##### From AI user:
> ##### Reply C-4<a name="c-4"></a> 
This is new evidence, and it changes my recommendation — stating exactly what changed so this isn't another tone-driven flip.

**What you established (C-3):** market can't change, and `updateComment` saves by `marketId` + `commentId` + `version`, with no `investible_id` parameter. A job/group move touches none of those, so saving from a still-open dialog after a move is safe. That removes item 2 (save-time correctness) — which was the *deciding* risk I had against O-2.

**What I found digging into it:** editing a comment today already navigates to a dedicated route page, `CommentReplyEdit` at `/comment/:marketId/:commentId`, which resolves the comment by id from `CommentsContext` (`getComment(commentsState, marketId, commentId)`). In other words the edit screen is ALREADY decoupled from the job's task list and already keyed by comment id — a move updates the comment's group/investible in context but `getComment` still finds it, so today's full-page edit already survives a move.

**Why that flips the call:** - O-1 (a modal rendered inline by the in-list comment row) would actually REGRESS today's safety — it would newly tie the editor to a row that can unmount on a move, reintroducing the very wipe-out you're worried about.
- O-2 (top-level/route-keyed modal looked up by comment id) PRESERVES the decoupling editing already has, just presented as an in-context modal instead of a separate full-page screen. And it's a smaller change than I implied earlier, because it reuses the existing id-lookup pattern (CommentReplyEdit) rather than inventing new global plumbing.

So O-2 is now my settled recommendation — driven by the evidence above, not by emphasis. Your original instinct to question my earlier flip was right; the right answer just turned out to be O-2 for a better reason than I first gave. If you confirm O-2, I'll implement the edit as an in-context modal keyed by comment id (reusing the CommentReplyEdit lookup) so it stays open and saves correctly straight through a move.

> ##### Reply C-3<a name="c-3"></a> 
Changing job or group (market cannot change currently) does not affect comment ID or version. On the update side:

```
export function updateComment(values) {
```

```
const { marketId, commentId, body, commentType, uploadedFiles, mentions, notificationType,
```

```
isSent, allowMulti, isRestricted, inProgress, isVisible, version, tz, resolved } = values;
```

updateComment does not take investible_id as a parameter so that is also safe.

##### From AI user:
> ##### Reply C-2<a name="c-2"></a> 
Fair challenge, and you're right to push. No new *technical* evidence appeared — both options behaved exactly as described from the start. What moved me was my reading of your priority, and I let that flip my recommendation instead of just laying out the tradeoff. That oscillation wasn't useful. Here's the straight risk picture so you can decide.

**Risks of O-2 (top-level hosted modal):** 1. Blast radius / untested code — yes, this is real. It replaces today's inline edit trigger (the `replyEditId` / `toggleEdit` path that every "edit a comment" entry point uses) with a new global edit-state store plus a top-level dialog host. Editing comments/tasks is a core, high-traffic flow used across planning, inbox, wizards, and archives, so new plumbing there risks regressions in many places at once.
2. Save-time correctness — this is the subtler, scarier one (more than raw code volume). `updateComment` saves by comment id + version. If the task's job/group/market changed while your dialog stayed open, the version is stale: the save can conflict (409) or write against a stale context. Doing it right means detecting the change and refetching/merging or surfacing a conflict — a batch of new edge cases.
3. Lifecycle details — the host has to look up the (possibly moved) comment by id from context, handle focus, carry the draft + uploaded-files state, and decide what happens if you try to edit two comments. Each is small but they add up.

**Risks of O-1:** minimal — it's a thin Dialog wrapper around code that already works. Worst case the dialog closes on a move and the draft restores on reopen.

**So is the concern "too much untested code"?** Partly — item 1. But the deciding risk is item 2: putting a riskier save path into a core flow to defend against an event whose frequency I can't measure.

**The decision hinges on one fact I don't have:** how often does a task actually get moved to a different job WHILE someone is mid-edit? If that's rare, O-1 is the better engineering call — the typed text is already safe in localStorage, so the cost of the rare case is a recoverable vanish, which doesn't justify a risky refactor of a core flow. If it's common, or a single in-the-moment vanish is unacceptable, O-2 earns its cost.

**My settled recommendation (no more flip-flopping):** unless you know move-during-edit is common, go with O-1 now — your original instinct — and keep O-2 as a follow-up if you ever see the vanish actually bite users. If you tell me move-during-edit is frequent, I'll switch to O-2 with eyes open about item 2.

#### Resolved Report R-all-249<a name="r-all-249"></a>  
T-all-2198 is ready to look at (details in note R-all-248). In the expanded option view (DecisionInvestible), an option now has one permanent bottom padding below everything, and the voting/comments sections no longer carry their own bottom padding (so it isn't doubled).

What to check: expand an option that is just a name + description (no votes/comments) — it should now have a clean bottom gap instead of being cramped. Then expand one that does have voting/comments and confirm the bottom spacing still looks right (not too much / too little). I used 1.5rem for the permanent gap; say if you want it larger or smaller.

ESLint passes. Couldn't auto-screenshot here, so this one wants your eyes on the spacing. Nothing committed yet — say the word and I'll commit starting the message with T-all-2198.

#### Resolved Report R-all-242<a name="r-all-242"></a>  
T-all-2181 is ready to look at. The compressed comment/task card shown in wizards and the inbox now signals it's clickable again, addressing the regression from T-all-2178.

What changed (all in the compressed card; details in note R-all-241):
- The card border is now link-blue (#2F80ED) instead of the near-invisible gray, with a deeper blue + soft blue glow on hover — so it reads as a clickable "click-through" element while keeping the clean rounded T-all-2178 card.
- Added an OpenInNew "open" icon (blue) next to the expand chevron, shown only where the row actually navigates to the full comment (inbox/wizard). Clicking it opens the full comment; the down-chevron still just expands in place.

How to check: open any wizard that lists tasks/comments (e.g. a job's compressed comment list) and/or the inbox — the task rows should now have a blue outline and an open icon, and both the row and the icon should click through to the full comment. Expand chevron should still expand inline.

Not committed yet — say the word and I'll commit starting the message with T-all-2181.

#### Resolved Task T-all-2212<a name="t-all-2212"></a>  
Tip: Working with HTML/CSS? Install the frontend-design plugin:

/plugin install frontend-design@claude-plugins-official

That slash command has to be run from inside Claude - it doesn't install plugins itself.

#### Resolved Task T-all-2214<a name="t-all-2214"></a>  
A question is addressed stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/Q-all-156 but the normal URL is stage.uclusion.com/dialog/dd56682c-9920-417b-be46-7a30d41bc905/f2f861f8-b5e6-4c73-8c82-ced1fa9a6dad with dialog in there.

So you can't edit the URL to just put a short code in it. Nor does search allow you to get there by putting in a short code though that was a thing once - however who would know to do that.

Just make the form with dialog in the URL also work.

#### Resolved Task B-all-452<a name="b-all-452"></a>  
If send question with no options it is still using is_sent false. is_sent should be true for the ask question button since no further additions to the question are coming. For add options button is_sent stays false since we don't want to send the question without its options.

#### Resolved Report R-all-247<a name="r-all-247"></a>  
T-all-2209 is ready to look at — the edit-comment screen is now a top-level modal (Q-all-156 O-2), combining the earlier GMail-style composer redesign with the move-safe hosting. Details in note R-all-246.

What to check on a running instance:
1. Click edit on a comment (or reply) — it now opens in a centered modal in context, instead of navigating to a separate full-page screen. The composer reads as one card (editor + toolbar + Update/Cancel/"Storing locally" all inside it).
2. Update saves and closes the modal; Cancel closes and discards; clicking the backdrop / Escape closes but keeps your draft (reopen restores it from localStorage).
3. The move-safety case: while editing, if the task is moved to a different job, the modal should stay open with your text intact (it's hosted at the app root and keyed by comment id, not tied to the comment's row).
4. Deep link to /comment/<market>/<comment> still opens the old full-page editor (kept for back-compat).</comment></market>

Verified locally: production build succeeds and ESLint passes on all changed files. I couldn't auto-screenshot (no headless browser / login here), so this one needs your eyes — especially the composer sizing inside the dialog and the toolbar picker dropdowns not getting clipped. Happy to adjust dialog width / padding once you see it. Nothing committed yet — say the word and I'll commit starting the message with T-all-2209.

> ##### Reply C-all-1013<a name="c-all-1013"></a> 
Now that edit comment opens a modal change the mouse changing on hover of a comment that you can edit from pencil icon to the normal hand icon.

> ##### Reply C-all-1015<a name="c-all-1015"></a> 
That worked but the area where the hand icon appears is too small. Can it be extended to a larger area without including buttons and other widgets on the comment?

##### From AI user:
> ##### Reply C-all-1016<a name="c-all-1016"></a> 
Done (C-all-1015): enlarged the click-to-edit area. The whole comment body region (the CardContent) now carries the pointer cursor and opens the edit modal on click — not just the exact text glyphs.

How it stays clean: the header buttons (edit/poke/delete) and the footer CardActions (resolve/reply/etc.) are siblings OUTSIDE the CardContent, so they're naturally excluded; voting/option widgets render outside this card entirely. The existing `setBeingEdited` guard (`invalidEditEvent`) still skips link clicks and text selection, so selecting text to copy or clicking a link won't open the editor. Only active when the comment is editable, not already being edited, and not mobile (mobile still uses the pencil button).

Changed in Comment.js (added cursor + onClick to the body CardContent). ESLint passes. Let me know if the region should be bigger/smaller still.

##### From AI user:
> ##### Reply C-all-1014<a name="c-all-1014"></a> 
Done (C-all-1013): hovering an editable comment now shows the normal pointer (hand) cursor instead of the inline-edit pencil. Changed the `editable` class in ReadOnlyQuillEditor.js (the comment display) from `url('/images/edit_cursor.svg') ..., pointer` to plain `pointer`.

Scoped to comments only, since you said "a comment that you can edit." The same pencil cursor is still used for editing a job/investible description and the locked-dialog / voting body edits (PlanningInvestible, InvestibleBodyEdit, LockedDialog, Voting) — those flows didn't change to a modal, so I left their pencil cursor as-is. Say the word if you want those switched to a plain pointer too. ESLint passes.

#### Resolved Task S-all-85<a name="s-all-85"></a>  
B-all-452 verification (runtime): please confirm the fix end-to-end in the running app, since the is_sent-stays-false symptom depends on back-end behavior I can't observe from the frontend. Steps: (1) Start a new question, press "Add Options" — confirm the draft question is created with is_sent=false. (2) On the options wizard, without adding any options (and again after adding one), press "Go to question" — confirm the question now shows as sent (is_sent=true) and notifies as expected. Repeat in both the discussion (group) and job-comment flows, and via ConfigureCommentStep, since all three callers were fixed. If it sends correctly now, B-all-452 can be resolved.

#### Resolved Task T-all-2220<a name="t-all-2220"></a>  
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/95853fb5-7fbc-417b-adc1-41309ded643a.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Pencil icon out of alignment. Especially for option comment but should get entire top rationalized on all comments such that icons and alignment make sense.

#### Resolved Task T-all-2181<a name="t-all-2181"></a>  
Lost the blue link outline around tasks showing in wizards so don't realize can click through - add back or come up with different mechanism that is more clear.

#### Resolved Report R-all-260<a name="r-all-260"></a>  
T-all-2214 is ready to look at (root cause and fix in note R-all-259).

What was wrong: the ticket index is keyed by `${marketId}/${ticketCode}`, so the canonical short-code URL `/${marketId}/Q-all-156` resolves but the normal in-app form `/dialog/${marketId}/Q-all-156` did not — the leading `dialog/` made the lookup key miss the index, so a short code pasted into a dialog URL never resolved.

What changed: in getUrlForTicketPath (marketIdPathFunctions.js) I strip a leading `/dialog` before building the ticket lookup key, so the dialog form resolves the same item as the short form. One-line, ESLint passes. The isInvestibleTicket/isOptionTicket branch checks are substring-based and already tolerate the prefix; plain short-code links are unchanged.

Scope: I did NOT touch short-code search (the task mentioned it "was a thing once" but downplayed it and asked specifically for the dialog URL). Happy to restore search-by-short-code as a separate change if you want it.

Not done: I can't exercise the running app from here, so the redirect is unverified end-to-end. Filed S-all-88 with the exact steps. Once that passes, T-all-2214 is safe to resolve (already moved to Tasks Complete).

#### Resolved Report R-all-254<a name="r-all-254"></a>  
B-all-452 is ready to look at (root cause and fix in note R-all-253).

What was wrong: "Go to question" (the send path from the add-options wizard) called sendComment with the pre-refactor 4-arg form, so after commit e337176e8 dropped the label parameter, DECISION_TYPE was being silently discarded and marketType=undefined was sent. That's why a question created via "Add Options" (is_sent=false by design) never got flipped to sent.

What changed: restored the dropped marketType argument in all three sendComment callers — Discussion/AddOptionStep.js:87, JobComment/AddOptionStep.js:107, ConfigureCommentStep.js:136 — now sendComment(marketId, commentId, DECISION_TYPE). No change was needed to the first-screen "Ask question"/"Add options" buttons; those were already correct.

Not done: I can't exercise the running app from here, so the actual is_sent=true outcome is unverified end-to-end (it depends on back-end handling of the marketType on send). I filed S-all-85 with the exact steps to confirm. Once that passes, B-all-452 is safe to resolve.

#### Resolved Question Q-all-160<a name="q-all-160"></a>  
T-all-2220 (pencil out of alignment / rationalize the comment header top). The misalignment comes from the short-code label (e.g. "S-1") being pulled up with a -0.6rem top margin so it reads like a superscript in the corner, while the edit pencil sits lower on its own baseline; the header flex row sets no common vertical alignment. For option comments it's worse because the code renders as an unstyled bare div instead of the styled button normal comments use. What's the intended end state for the top row (timestamp, edit pencil, short code, delete)?

#### Option O-2<a name="o-2"></a>
#### Keep short code as a corner label
Keep the short code as a small quiet label tucked up in the corner, but bring the edit pencil up to share the same centered baseline as the timestamp and delete icon. Only the icons line up; the short code intentionally stays a small superscript-style label above them.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Single centered row
Put timestamp, edit pencil, short code, and delete icon all on one horizontal line, vertically centered with even spacing. Drop the -0.6rem superscript hack so the short code sits inline at the same height as the icons, and make option comments render their code with the same styling/alignment as normal comments. Cleanest 'everything lines up' look.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
A single vertically-centered row is the most legible 'rationalized' result and removes the special-casing (negative-margin hack, bare-div for options) that caused the drift in the first place. The corner-label look only made sense as an accident of the -0.6rem margin; keeping it deliberately would mean preserving two different vertical baselines, which is exactly the inconsistency this task is complaining about.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Resolved Task S-all-88<a name="s-all-88"></a>  
T-all-2214 verification (runtime): please confirm a short code pasted into a dialog-form URL now resolves. Steps: (1) Navigate to any question/job/option normally so the URL is the dialog form, e.g. /dialog/<marketid>/<uuid>. (2) Edit the URL, replacing the uuid (last path segment) with a short code, e.g. /dialog/<marketid>/Q-all-156, and load it. Expected: the app redirects to that item (the same place the short-code link /<marketid>/Q-all-156 goes). (3) Sanity-check a comment short code (e.g. R-all-...), a job (J-...), and an option (O-...) the same way, and confirm the plain short-code links still work unchanged. Once confirmed, T-all-2214 is safe to resolve.</marketid></marketid></uuid></marketid>

##### From AI user:
> ##### Grouped task C-all-1022<a name="c-all-1022"></a> 
Extra verification step (short-code search was also restored, R-all-261): in the search box, type a short code such as Q-all-156 (or a J-/O-/R- code) and press Enter — it should jump straight to that item instead of showing text-search results. Confirm that an ordinary text query (not a short code) still performs a normal search as before.

#### Resolved Task T-all-2198<a name="t-all-2198"></a>  
When an option is just name and description need some padding below the description. Put that in below the other elements permanently and make sure those elements don't have bottom padding.

> ##### Grouped task C-all-1017<a name="c-all-1017"></a> 
Handle the case of the description not being very long. In that case there is no padding and the right most information and actions bump into the bottom option.

## Job J-all-319<a name="j-all-319"></a>
### Marketing feedback.

This job is in stage Complete.
#### Notes 
#### Note R-all-239<a name="r-all-239"></a>  
Reverted the over-aggressive mobile changes per feedback. Removed the 470px stage height cap, restored all backlog cards and column content (no MobileOnlyHidden), and reverted wizard mobile typography/button scaling. Kept only the fixes that address actual layout defects without truncating: top bar hides Search/Home/Next message/help on narrow widths (single 48px row with logo + mode + avatar), tab strip scrolls horizontally instead of wrapping, and AppWindow has overflow-x hidden. Full tall column board is back on mobile.

#### Note R-all-236<a name="r-all-236"></a>  
Fixed: the animation container no longer changes height between scenes (was distracting). The board scene stays mounted (just visually hidden) to reserve its height, and the wizard overlays it, so the window holds a constant height across the loop. Verified the app window measures 680px in both the board and the wizard states.

#### Note R-all-238<a name="r-all-238"></a>  
Answer to the task question: I can see mobile size myself — no high-res screenshot needed. I tested at 390×844 (same breakpoint the storefront uses via MUI `xs` / MobileHome).

Defects found and fixed in `src/shared/PlanAnimation.js`:
1. **Top bar** — Search, Home, Next message, and help icon were cramming/wrapping on narrow widths. On mobile they are hidden; the bar is a single 48px row with logo + dark-mode toggle + avatar.
2. **Tabs** — Job Progress / Job Backlog / Bugs / Notes were wrapping onto multiple lines. Tab strip is now horizontal scroll (no wrap, hidden scrollbar).
3. **Animation height** — the full desktop board stacked into a very tall column on mobile. Stage is capped at 470px on mobile with overflow hidden; extra backlog cards and columns 2–3 are hidden so the teaser shows Add job + two mini-cards + one swimlane card.
4. **Wizard** — heading, padding, pills, and Create job / Use approvals buttons scaled for narrow width; editor goes full width.
5. **Scene height consistency** — verified app window stays 559px in both board and wizard states on mobile (no jump between scenes).

If anything still looks off on your physical device, a screenshot would help — but the main layout issues were reproducible in emulation.

#### Note R-all-237<a name="r-all-237"></a>  
Done. (1) Stopped at two scenes — scene 3 was never built and Q-all-153 resolved to keep the wizard pre-filled (no typing animation), so the loop is just board -> cursor clicks Add job -> create-job wizard -> back. (2) Removed the caption from the animation (src/shared/PlanAnimation.js). (3) Added 'Add a job, and your AI plans it with you' as the heading of the Walkthrough section directly below the animation (src/shared/Walkthrough.js), sitting above the existing 'Rules for this flow are automatically installed and you can tweak them.' sub-line. The Walkthrough's first diagram step is '1. Create the job' with the same job/description the wizard shows, so the section reads as picking up exactly where the animation leaves off. Verified live: the animation window ends and flows straight into the new heading and the diagram.

#### Note R-all-234<a name="r-all-234"></a>  
All 4 addressed in src/shared/PlanAnimation.js using ../uclusion_web_ui as the source of truth (latest screenshot in the Cursor chat):
1. Logo: now rendered at 112px wide (was a tiny 19px-tall sliver) so the Uclusion wordmark reads clearly.
2. Card alignment: removing the false headers had pulled the middle/right columns up; added an invisible header spacer (same height as the 'David Israel' header) to those two columns so their first cards sit level with the first card under the name again.
3. Dark mode toggle: replaced the custom pill with the app's actual control — MUI's Brightness4 icon (from uclusion_web_ui/src/containers/Header/index.js, which uses Brightness4 in light mode / Brightness7 in dark).
4. Sidebar chips: now outlined. I adopted the canonical outlinedChipStyle palette from uclusion_web_ui/src/components/CustomChip/chipStyles.js (white fill, 1.5px colored border + colored text; 'new'=red #c8362f/#e85757, counts=teal #347079/#7fb6bd) and applied it consistently to the sidebar counts, the column count chips, and the '2 new' tab badge.

Resolving. Still pending your go-ahead on scene 1 before I build scenes 2 and 3 (and the motion pick on Q-all-152).

#### Note R-all-235<a name="r-all-235"></a>  
Scene 2 built and verified in the running storefront (src/shared/PlanAnimation.js). The animation is now a looping state machine: scene 1 (static status board, per Q-all-152 O-1) holds, then an animated macOS-style cursor glides to the '+ Add job' button, clicks (ripple feedback), and the board area is replaced by the create-job wizard — top bar, teal sidebar, and tab strip persist, matching /tmp/createJob.png. The wizard reproduces the heading 'How would you describe this job?', the sub-line, the Immediate/Ready to assign/Not ready priority pills (Immediate selected, blue), the white description editor with the walkthrough text + 4-bullet list, a Quill-style toolbar row, and the Create job / Use approvals / Cancel buttons. After a dwell it loops back to scene 1. Scene 3 (in-job AI question + pick an option) is not built yet. One open judgment call filed as Q-all-153: whether the description should type itself in vs open pre-filled (I recommend typing it in). Holding for feedback before wiring the typing animation and scene 3.

#### Note R-all-233<a name="r-all-233"></a>  
All 8 items addressed in src/shared/PlanAnimation.js (latest screenshot in the Cursor chat):
1. Replaced the orange dot with a legible light/dark mode toggle (a pill with sun + moon glyphs and a sliding knob) in the top bar.
2. '+ Add job' is now left-aligned under the tabs (not centered).
3. Removed the 'Needs attention' and 'Complete' column headers; only the assignee column keeps its 'David Israel' header, matching the real board.
4. Removed the toggle before 'Paused'/'Complete'; cards now show small assignee avatars there instead (DI, and DI+AI on completed jobs).
5. Count chips ('12 open', '1 new', '5 open', etc.) and the deploy chips are now outlined (colored border + text, transparent fill) instead of filled.
6. Re-sampled colors directly from /tmp/myUclusionStatus.png and applied them: top bar #a9d4d9, sidebar #8fc5cc, board #b8e2e5, accent blue #2f80ed, amber #f29100, red #c8362f for 'new'.
7. Now uses the real logo asset already in the storefront (assets/images/Uclusion_Wordmark_Color.svg) instead of a hand-drawn box.
8. Collaborator/assignee AI avatar now reads 'AI' (was 'AV').

Resolving this grouped task. Scenes 2 and 3 are still pending your go-ahead on scene 1 (and the motion pick on Q-all-152).

#### Note R-all-232<a name="r-all-232"></a>  
Scene 1 first cut is in (new component src/shared/PlanAnimation.js), placed where the old tabs sat in AboveTheFold.js. It renders a framed app window titled 'Storefront' with Status/Inbox view tabs and a '+ Create job' button (the button scene 2 will 'click'), a top status strip (Blocked alert, Estimate-due alert, Deployed v1.4 -> prod), and a 3-column board: Ready to assign (Job+Question, Job+Suggestion, Bug+Blocked), In progress (Tasks with assignee avatar + progress bar), In review (Job approved 4/5, Job in review). Cards 'assemble themselves' via a staggered fade/slide-in on mount.

Decisions / notes:
- Built as a stylized styled-components board (same visual vocabulary + tag colors as Walkthrough.js and AiCollaborationFeature.js), NOT a literal app screenshot. The real app repo (uclusion_web_repo) isn't in this workspace, so I matched the existing on-page diagram aesthetic rather than capturing pixels.
- Scenes 2 and 3 (create-job fill from walkthrough step 1, then in-job question/options from step 2) are intentionally NOT built yet, per this task's 'do some of the first scene and get feedback first'.
- The motion treatment for scene 1 is an open execution choice -> filed as a separate question.

#### Note R-all-240<a name="r-all-240"></a>  
Removed all 12 teaser slideshow images that were only referenced by the deleted Teaser.js component. Verified no remaining imports in the repo:

1. helpShot.jpeg, statusShot.jpeg, bugShot.jpeg, tasksShot.jpeg, questionShot.jpeg, blockedShot.jpeg
2. approvalShot.jpeg, approvalWizardShot.jpeg, inboxShot.jpeg, estimateShot.jpeg, navigationShot.jpeg, jobStagesShot.jpeg

Note: `src/shared/helpers/Slideshow.js` (+ Slideshow.css) is now orphaned dead code with no callers; left in place since this task was images only. `darkMode.png` is also still on disk (was DarkModeFeature, not the teaser) — say if you want that removed too.

#### Resolved 
#### Resolved Task T-all-2180<a name="t-all-2180"></a>  
Images are now out of date. Need options for automating image creation. Or need to reduce the number of images presenting.

#### Resolved Task C-all-1010<a name="c-all-1010"></a>  
Some details that need fixing:

1. Make the dark mode toggle button legible - we got rid of that section so we can at least show the button here instead of some sort of orange dot
2. Add Job button is to the left not center
3. There are not "Needs Attention" and "Complete" headers at the top of those columns
4. There is no toggle before the word Paused or the word Complete
5. The chips are colored outlined - not filled
6. Try to more accurately match the colors used by Uclusion - we should be getting that for free if you examine the picture carefully
7. You can just use the Uclusion logo - it's already in use inside uclusion-storefront
8. Using initials inside the avatars is fine but AI is "AI" not "AV"

#### Resolved Task T-all-2206<a name="t-all-2206"></a>  
The animation has some defects in mobile size. Do you need a high res from mobile? Should I just explain them to you? Can you see the mobile size yourself?

#### Resolved Task B-all-447<a name="b-all-447"></a>  
Rename MCP & CLI - they don't know what it means. Don't use term on above the fold or explain it.

#### Resolved Task T-all-2205<a name="t-all-2205"></a>  
Stop here with two scenes but remove the caption from the animation.

Then make "Add a job, and your AI plans it with you" the title of the section below.

The idea is that it is clear that the section below the animation is picking up where the animation left off and that making that whole flow into the animation would be painfully long.

#### Resolved Task T-all-2177<a name="t-all-2177"></a>  
Plus remove dashes on captions and third section in ai collaboration.

#### Resolved Question Q-all-150<a name="q-all-150"></a>  
Direction is set (re T-all-2180): build ONE Stripe-style React animation (no screenshots) to replace the GmailTabs + Teaser slideshow in the 'Want more before you sign up?' section, and delete the single-click dark-mode section (DarkModeFeature). The animation is a lightweight teaser to nudge hesitant signups, NOT a replacement for the real demo workspaces that launch on startup. Open scope question: besides those, 16 screenshots remain on the page (the 10-image 'Your first hour' onboarding grid in AboveTheFold.js, 3 in CLIFeature.js, 3 in AdvancedCollabFeature.js). How far should we go?

> ##### Reply C-all-1007<a name="c-all-1007"></a> 
Only 2 of those 16 are actually screen shots of the Uclusion app - "Name a private workspace and go" and "Structured comments". I think those two will be manually maintained for now. Adding a task for me to do that.

#### Option O-2<a name="o-2"></a>
#### Also strip the 10-image onboarding grid to icon+text
In addition to the tabs animation + dark-mode removal, reduce the 'Your first hour with Uclusion' grid from 10 screenshots to icon + text only. The grid already has an icon+text fallback (StepMediaPlaceholder), so this is mostly deleting the image wiring. Keep the CLI and collab shots.

Pros: removes the second-largest screenshot cluster (10 images) cheaply; cleaner, faster page.
Cons: onboarding section loses literal product visuals; CLI + collab shots (6) still remain and can go stale.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### This round only: tabs animation + remove dark mode
Do just the agreed changes now: replace the GmailTabs + Teaser slideshow (12 *Shot.jpeg) with the single React animation, and delete the dark-mode section (darkMode.png). Leave the other 16 screenshots (onboarding grid + CLIFeature + AdvancedCollabFeature) untouched for now and revisit later.

Pros: smallest, lowest-risk change; ships the biggest staleness win (the 12-image slideshow) fast.
Cons: 16 screenshots still on the page that can still go stale; page is stylistically mixed (one polished animation alongside older screenshots).


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Full Stripe-ification: remove ALL remaining screenshots
Remove every literal screenshot on the landing page. Page becomes text + icons + the single hero animation (plus the existing code diagrams in Walkthrough and AiCollaboration). Onboarding grid goes icon+text; CLIFeature and AdvancedCollabFeature shots are dropped or converted to text/code snippets.

Pros: fully eliminates the staleness problem; maximally on-brand, consistent dev-tool aesthetic; minimal ongoing maintenance.
Cons: largest amount of work this round; loses all literal 'this is the real app' proof except what the animation conveys.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Keep CLI + collab shots as the only real screenshots
Replace the tabs/Teaser with the animation, delete dark mode, convert the onboarding grid to icon+text, but deliberately KEEP the CLIFeature (3) and AdvancedCollabFeature (3) screenshots as the only literal product proof, since those show concrete dev-facing artifacts (CLI report, github action, slack unfurl, workspace creation, suggestion).

Pros: keeps a little authentic 'real app' credibility where it matters most to developers; still removes the bulk of stale images.
Cons: those 6 screenshots still need manual updates when the UI changes; slight stylistic inconsistency remains.


This option is in stage In Dialog.
#### Resolved Question Q-all-149<a name="q-all-149"></a>  
Re T-all-2180: the homepage presents ~29 product screenshots that go stale on every app UI change (10 onboarding step PNGs in AboveTheFold.js, 12 *Shot.jpeg slides in the Teaser slideshow, 3 in CLIFeature.js, 3 in AdvancedCollabFeature.js, 1 in DarkModeFeature.js). Note that Walkthrough.js and AiCollaborationFeature are already pure code/CSS diagrams that never go stale, and the uclusion_ui_tests repo already uses Cypress against the real app. Which direction should we take?

#### Option O-3<a name="o-3"></a>
#### Reduce the number of images presenting
Cheapest, fastest path: cut the volume rather than fix the pipeline. Drop the 10-card onboarding screenshot grid down to icons+text only, and trim the 12-slide Teaser to ~3-4 highest-value shots (e.g. dashboard, inbox, one collaboration view). Far fewer images to ever update.

Pros: immediate, minimal effort; dramatically fewer assets to keep current; tighter, less cluttered page.
Cons: less comprehensive product tour / less visual proof; the surviving screenshots still go stale and still need manual updates.


This option is in stage In Dialog.
#### Option O-5<a name="o-5"></a>
#### Use the code in uclusion_web_repo and fake in memory data to simulate screen...
...shots instead of diagrams.


This option is in stage In Dialog.
#### Option O-2<a name="o-2"></a>
#### Convert screenshots to code-built diagrams
Follow the precedent already in this repo: Walkthrough.js and AiCollaborationFeature are styled-component diagrams with zero screenshots and never go stale. Rebuild the onboarding steps grid and the Teaser slideshow (and the CLI/collab/dark-mode shots) as lightweight code diagrams/mockups, keeping at most 2-3 true hero screenshots.

Pros: effectively eliminates the staleness problem; faster page load and smaller bundle; fully on-brand and responsive; no capture pipeline to maintain.
Cons: diagrams are stylized, not literal proof of the real product; building each section is manual front-end work; loses some 'this is the actual app' credibility.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Hybrid: automate the few real shots, diagram the rest (recommended)
Combine the above. Automate via Cypress only the handful of shots that must look literally real (e.g. the dashboard/status and inbox hero shots). Convert the onboarding steps grid and the remaining Teaser slides to code diagrams like Walkthrough. Trim redundant slides while we are in there.

Pros: keeps authentic 'real app' proof where it matters while removing most of the staleness surface; balances effort vs. credibility; smallest ongoing maintenance load.
Cons: two mechanisms to set up and document; need a clear rule for which assets are 'real screenshot' vs 'diagram'.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Automate capture via existing Cypress suite
Reuse the uclusion_ui_tests Cypress project to drive the real app through each documented state and call cy.screenshot(), writing files directly into uclusion-storefront/src/assets/images (matching the current names like inboxShot.jpeg, statusShot.jpeg, step-01-signup.png, etc.). One command regenerates every shot, so they are never out of date.

Pros: screenshots are always current and show the real UI; leverages infrastructure we already maintain; no per-image manual work after setup.
Cons: needs deterministic seed/demo data so shots are stable; requires naming/cropping/retina conventions and a small build/copy step; meaningful upfront setup; CI run time and flakiness to manage.


This option is in stage In Dialog.
#### Resolved Task B-all-448<a name="b-all-448"></a>  
Potentially landing page still doesn't make clear what Uclusion is beyond a pale form of Linear.

#### Resolved Task T-all-2207<a name="t-all-2207"></a>  
Remove now unused pictures that were formerly used by the slide show in the teaser section.

#### Resolved Question Q-all-153<a name="q-all-153"></a>  
In scene 2 (the create-job wizard), how should the job description appear once the wizard opens? Right now the cursor glides to '+ Add job', clicks, and the wizard opens already filled with the walkthrough text + bullet list. Your scene-2 vision was 'hit Add job and fill it in', which could mean the text should visibly type itself in. Which do you want?

#### Option O-2<a name="o-2"></a>
#### Open pre-filled (current)
The wizard opens with the description already present (as in the screenshot just shared), holds briefly, then loops. Simpler, faster loop, less risk of looking janky, but less of a 'watch it get created' feel.


This option is in stage In Dialog.
> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
You already have this and it looks fine.

#### Option O-1<a name="o-1"></a>
#### Type the description in
After the wizard opens, the description types in character-by-character (and the bullets appear line by line), then the cursor moves to 'Create job'. More motion and reinforces the 'you fill it in' story, but takes longer per loop and is more fiddly to tune. My recommendation - it best matches your stated 'fill it in' intent and is more engaging.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Typing the description in best matches the 'hit Add job and fill it in' intent and makes the loop feel like work being created, which is the whole point of the teaser. The only cost is a slightly longer loop and tuning effort, both manageable.

#### Resolved Task T-all-2202<a name="t-all-2202"></a>  
Remove the title "The walkthrough you are reading was built like this."

#### Resolved Task T-all-2204<a name="t-all-2204"></a>  
More small issues:

1. The logo is too small
2. The cards pushed up to where the false headers used to be and they need to go back down where they were before even with the top of the first card under my name
3. The dark mode toggle is still not legible - you have access to ../uclusion_web_ui - just go see what the actual icon is
4. The chips on the left sidebar are still filled instead of outlined

In general feel free to use ../uclusion_web_ui repo for anything you are having trouble seeing.

#### Resolved Task T-all-2199<a name="t-all-2199"></a>  
Update images in "Name a private workspace and go" and "Structured comments".

#### Resolved Task T-all-2200<a name="t-all-2200"></a>  
Remove the light and dark mode section.

#### Resolved Task T-all-2201<a name="t-all-2201"></a>  
Remove the "Want more before you sign up?" section tabs and tab contents. Put the new animation where the tabs used to be.

#### Resolved Task T-all-2176<a name="t-all-2176"></a>  
Above the fold no good.

"Work was not meant to be all chat."

> ##### Grouped task C-all-983<a name="c-all-983"></a> 
Plus lines underneath are not understable.

#### Resolved Question Q-all-152<a name="q-all-152"></a>  
Scene 1 (status/plan view) motion treatment for the looping teaser: how alive should the board be before it hands off to scene 2's 'Create job' action? See the first cut on T-all-2203 (component src/shared/PlanAnimation.js). I built it as the staggered assemble-in (O-2). This choice also sets the tempo for the scene 1->2->3 loop.

> ##### Reply C-all-1008<a name="c-all-1008"></a> 
First we need much higher resolution than what you did. See /tmp/myUclusionStatus.png taken from my usage of Uclusion and also <https://stripe.com/> has an "Embed payments in your platform" animation. If you cannot see or find the one on Stripe's page I can screenshot it for you.

##### From AI user:
> ##### Reply C-all-1009<a name="c-all-1009"></a> 
Re C-all-1008 (need much higher resolution): I found and reviewed both references — your /tmp/myUclusionStatus.png and Stripe's 'Embed payments in your platform' hero (a crisp browser-framed product replica with a connected-accounts table on a soft gradient). I rebuilt scene 1 in src/shared/PlanAnimation.js as a high-fidelity replica of your real status view rather than the sparse mock:
- Full top bar: Uclusion logo, Home, search 'Search David Israel', 'Next message ->' pill, help/notification icons, DI avatar.
- Teal left sidebar: Uclusion workspace dropdown; Views (+) with Marketing (badge 1) and David Israel selected (white pill + kebab); Compose; Collaborators (+) with overlapping avatars; Messages with For You (badge 2) and From You; Integrations with AI Connection and Slack; Other workspaces (+) with Support.
- Job Progress / Job Backlog / Bugs / Notes-Discussion tabs with the orange '2 new' badge and blue active underline; centered '+ Add job'.
- Backlog strip of 5 mini cards (assignment icon + age + title).
- Three columns: David Israel's paused jobs (toggle + 'Paused' + age), 'Needs attention' (orange/green open-count badges, incl. a 'Marketing feedback' card), and Complete (green toggle + 'Deployed to stage/production' chips + AI report note lines).
- Sits in a browser-style frame on a subtle teal->violet gradient, Stripe-style, and assembles in with the staggered fade (the O-2 motion).

It's all DOM/CSS so it's vector-crisp at any DPI. Still a stylized rebuild (the real app repo isn't in this workspace) — if you'd rather I pull exact pixels/data from uclusion_web_repo, point me at it. Latest screenshot is in the Cursor chat. The motion options on this question still stand; let me know if scene 1 is close enough to move on to scenes 2 and 3.

#### Option O-1<a name="o-1"></a>
#### Static starting frame (no motion)
Scene 1 is a still, fully-rendered board. All motion begins at scene 2 when 'Create job' is clicked. Calmest and most legible; lets the create-job action be the first thing that moves. Con: the hero is static until the loop reaches scene 2.


This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
The hero is static because it doesn't gain anything from motion. Clicking on 'Create job' should take a while so people can see the hero - for instance have the cursor move over from somewhere to the button.

#### Option O-2<a name="o-2"></a>
#### Staggered assemble-in, then settle (recommended)
What's built now: cards fade/slide up in sequence so the board visibly 'builds itself', then settles for a beat before scene 2. Reads as 'your whole plan assembling on one page' (the O-1/O-6 idea) and replays each loop. Con: slight repeated motion every loop.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Voting O-2 (staggered assemble-in). It directly delivers the 'your whole plan assembling on one page' read that won Q-all-151, and because the whole thing loops, the assemble replays naturally each cycle without extra machinery. Static (O-1) leaves the hero frozen until the loop reaches the create-job click, which weakens the first impression; continuous micro-motion (O-3) is the most eye-catching but risks stealing attention from the create-job action that's supposed to be the focal handoff to scene 2, and it's the most to maintain. O-2 is the calm middle that keeps the board feeling alive while keeping the create-job click the clear next beat.

#### Option O-3<a name="o-3"></a>
#### Continuous micro-motion loop
Livelier hero: after assembling, keep subtle motion going (progress bars tick up, a new card lands, an alert pulses) so scene 1 never looks frozen. Most eye-catching. Con: busiest, highest maintenance, risks competing with the create-job action for attention.


This option is in stage In Dialog.
#### Resolved Task T-all-2203<a name="t-all-2203"></a>  
Build the animation but not all at once. Do some of the first scene and get feedback first. If there are implementation choices mock and ask first.

#### Resolved Question Q-all-151<a name="q-all-151"></a>  
For the single Stripe-style React animation that replaces the GmailTabs + Teaser tour (a lightweight teaser to nudge a hesitant signup, NOT a full demo), what should it depict? For context, the four old tabs it replaces were: Plans at a glance, Built in stages, Collaboration features, and Inbox & navigation. Pick the narrative the one animation should carry (these are mutually distinct directions; we build one).

#### Option O-1<a name="o-1"></a>
#### Signature board assembling itself (recommended)
One calm looping hero: Uclusion's status/plan view builds itself on screen — in-progress tasks, ready vs. blocked jobs, approvals, alerts, and deployments populating a single board that is clearly 'better than a Kanban board' (our #1 positioning, and the direct answer to 'pale form of Linear', B-all-448).

Pros: one focused scene = smallest build and lowest maintenance; leads with the strongest differentiator; reads instantly without the viewer having to 'follow' steps.
Cons: shows breadth of the board but not the live You/AI collaboration loop in motion.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Voting O-1 (board assembling itself). Grounding in the actual page: Walkthrough.js already IS the You+AI plan loop as a styled diagram (create job → AI asks → you pick option → AI suggests → convert to task → AI approves → asks for review) sitting right below this section. So O-2 would duplicate the Walkthrough, and O-3 (multi-beat tour) is the mini-demo Q-all-150 explicitly said NOT to build. That leaves the hero animation free to carry the one thing the page doesn't yet show in motion: the board itself. O-1 leads with the #1 positioning ('better than a Kanban board') and is the direct answer to B-all-448 ('pale form of Linear'), while staying the smallest/lowest-maintenance build — which fits the 'lightweight teaser, not a demo' constraint. O-4 (inbox) is my second choice since it dramatizes the hero tagline, but the board is the more immediately impressive first visual and the sharper competitive rebuttal.

#### Option O-2<a name="o-2"></a>
#### The You-and-AI plan loop
Animate one job moving through the protocol: you create a job → AI asks a question → you pick an option → AI suggests → it converts to a task → AI approves and asks for review. Essentially a product-skinned, animated version of the existing Walkthrough diagram.

Pros: tells the core 'plan WITH AI, not just code for you' story in motion; reinforces the brand thesis.
Cons: overlaps with the Walkthrough section that already sits on the page — risk of saying the same thing twice.


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Inbox-driven 'work is more than chat'
Animate the inbox in action: a question, a blocker, an approval request, and an estimate-due alert arrive; each opens a wizard and resolves; 'Next' jumps straight to what matters. Dramatizes the hero tagline and the 'important messages can't be dismissed without action' feature.

Pros: unique angle that ties directly to the headline message; shows the app actively driving work, not passively listing it.
Cons: narrower than the board; the inbox may be a less immediately impressive first visual than the plan view.


This option is in stage In Dialog.
#### Option O-5<a name="o-5"></a>
#### Single differentiator loop: question → options → approval
Tight focus on the one collaboration feature most unlike competitors: a question with voteable options, human + AI votes/approvals, async + Slack. One short loop, one idea.

Pros: smallest possible scope; sharpest 'we are not Linear / not a bug tracker' proof; easiest to keep current.
Cons: shows a single feature only — least sense of the product's overall breadth.


This option is in stage In Dialog.
#### Option O-6<a name="o-6"></a>
#### The animation has three scenes:
1. Starts on a nice looking status / plan view - needs to be decent resolution
2. Hit create job and fill in using step 1. from "The walkthrough you are reading was built like this."
3. Once inside the job show what happens in step 2. of the walkthrough.

Then loop. So the question and response part will be three fold redundant via diagrams and animation on the landing page.


This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
The redundancy is desirable and in fact there are also two blogs and probably whatever cold email that will hit the same point.

#### Option O-3<a name="o-3"></a>
#### Multi-beat auto-playing tour (covers all 4 old tabs)
One animation that auto-cycles through 3-4 short scenes mirroring the removed tabs: (1) plans at a glance, (2) stages + wizards, (3) questions/options/approvals, (4) inbox + next-navigation. Closest 1:1 replacement for what we're deleting.

Pros: preserves the full breadth of the old tour; nobody loses content.
Cons: most complex to build and maintain; drifts toward being a mini-demo — the exact thing we said this should NOT be (the real demo workspaces do that).


This option is in stage In Dialog.
## Job J-all-316<a name="j-all-316"></a>
### Some critical bugs for AI
Front end only.


This job is in stage Complete.
#### Reports 
#### Report R-all-166<a name="r-all-166"></a>  
B-all-443 is now implemented too, so all tasks in this job are done and resolved.

Ready to look at for B-all-443 (per the answers to Q-all-104 and Q-all-105):
- Opening https://stage.uclusion.com/inbox/UNREAD_REVIEWABLE_242798ce-bace-40b1-958f-9a1ce28e9af8 (or any notification whose comment was resolved) now shows "No actions available" with the explanation that the comment was already resolved, a "View resolved comment" button that lands on the right section and Resolved tab (B-all-445), and a Dismiss button that clears the notification and returns to the inbox.
- Any other opened notification that has no wizard for its type now shows the same panel with a generic explanation plus Dismiss, instead of a blank area.
- In the inbox list view these stale notifications remain hidden, as decided in Q-all-105.

Implementation details are in R-all-165 on the task (new BlockedNotificationPanel component plus InboxRow changes). Combined with the earlier B-all-445 work (R-all-163/R-all-164), the full diff touches MarketTodos.js, PlanningDialog.js, DiscussionSection.js, InboxRow.js, BlockedNotificationPanel.js (new), and en.js. Lint is clean across all of them.

#### Notes 
#### Note R-all-165<a name="r-all-165"></a>  
Implemented per Q-all-104 (explanation + dismiss + link) and Q-all-105 (stay hidden in list view):

1. **New BlockedNotificationPanel component** (pages/Home/YourWork) — renders in place of a wizard with the wizard look (baseCard/introText): a "No actions available" title, an explanation line, a "View resolved comment" button (when there is a comment to link), and a Dismiss button that removes the notification and returns to the inbox.

2. **InboxRow.js** — the resolved-root-comment guard that silently returned nothing now only hides the row in list view. When the item is opened directly (/inbox/<id>), it renders BlockedNotificationPanel with the resolved explanation and a link to the resolved comment, which now opens the correct section/Resolved tab thanks to B-all-445.

3. **Generic coverage for "any others where the wizard is blocked"** — if calculateTitleExpansionPanel produces no wizard for an opened item (unhandled type/link combinations), InboxRow falls back to BlockedNotificationPanel with a generic explanation plus Dismiss, instead of the previous blank area.

Note: Dismiss uses the standard removeWorkListItem, so UNREAD_* notifications are deleted while required ones are dehighlighted.

#### Note R-all-163<a name="r-all-163"></a>  
Fixed in three places, all front end:

1. **MarketTodos.js** — the hash-link effect only searched unresolved group bugs, so a link to a resolved bug never matched. It now also searches the resolved bug threads; when the matched root is resolved it switches to the Resolved tab (tab 3), pins/expands the bug (which also pages to it), and opens the Bugs section as before.

2. **PlanningDialog.js** — the resolved-comment branch of the hash effect was sending resolved bugs to the Discussion section. Resolved or not, group TODO comments are now left to MarketTodos, which opens the correct section/tab.

3. **DiscussionSection.js** — added a hash effect: a link to a resolved question/suggestion/note now switches to the Resolved tab, pins/expands the comment, and pages to it (using the same pin + getRealPage mechanism as MarketTodos). Also added the symmetric case: if the section was left on the Resolved tab, a link to an open comment switches back to the Open tab so the scroll target exists in the DOM.

Scrolling itself still happens via ScrollContext's MutationObserver, which keeps watching for the c<commentId> element after the tab switch/expansion renders it.

#### Resolved 
#### Resolved Question Q-all-105<a name="q-all-105"></a>  
For B-all-443: notifications whose root comment is resolved are currently dropped entirely from the inbox list view (InboxRow returns nothing and logs 'Notification out of date with a resolved comment'). Should that stay as-is, with the explanation only appearing when the item is opened directly (e.g. from an email link), or should these rows also appear in the inbox list?

#### Option O-1<a name="o-1"></a>
#### Keep hidden in list view
The inbox list stays clean of stale notifications; the explanatory text only shows when navigating directly to /inbox/<id> from an email or old link. Least behavior change.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Keeping stale resolved-comment notifications hidden in the list preserves the current clean-inbox intent and limits this fix to the actual reported gap (blank page on direct navigation). The backend fix in B-all-444 already reduces how often these occur.

> ##### $${\color{green} 100 out of 100 - Very Certain For}$$
No reason given.

#### Option O-2<a name="o-2"></a>
#### Show row in list view too
Render the row normally in the list; expanding it shows the explanation (and dismiss). More discoverable, but stale notifications clutter the inbox until dismissed.


This option is in stage In Dialog.
#### Resolved Task B-all-444<a name="b-all-444"></a>  
On the back end if <https://stage.uclusion.com/inbox/UNREAD_REVIEWABLE_242798ce-bace-40b1-958f-9a1ce28e9af8> is coming from resolving a bug then don't - we already know that happened from AI.

We also got an email for Notification: Reply but only the UNREAD_REVIEWABLE was there - resolving should not remove the reply notification.

Fix the second problem before the first so can test just using CLI.

Parent comment (bug) is 242798ce-bace-40b1-958f-9a1ce28e9af8 so this is coming from original creation of the bug even though I created it -MAYBE DOESN'T SINCE SPECIAL ASSIGN LOGIC. **Then resolve should have removed it for everyone since UNREAD_RESOLVED is different - and possibly it did slowly.**

#### Resolved Question Q-all-104<a name="q-all-104"></a>  
For B-all-443: when a notification's wizard is blocked because the underlying comment is resolved (e.g. /inbox/UNREAD_REVIEWABLE_242798ce...), what exactly should the inbox item page display instead of the current blank area?

#### Option O-2<a name="o-2"></a>
#### Explanation + dismiss button
Show the explanatory text and a Dismiss button, but no link to the resolved comment.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Explanation text only
Show only the explanatory text. Simplest, but the user cannot clear the notification from this page and the row is hidden in list view.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Explanation + dismiss + link to comment
Show text like 'No actions are available because this comment was already resolved.' plus a Dismiss button to remove the notification and a link to view the resolved comment in its group (which B-all-445 will make open the right section/tab). Without a dismiss button the user has no way to clear the stale notification since it is hidden from the list view.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
The dismiss button is needed because these notifications are hidden from list view, leaving no other way to clear them; the link to the resolved comment gives the user the natural next step and B-all-445 makes that link actually work.

> ##### $${\color{lightgreen} 75 out of 100 - Certain For}$$
No reason given.

#### Resolved Task B-all-445<a name="b-all-445"></a>  
Link to a resolved bug is not working IE doesn't open that section automatically as is done elsewhere. Make sure works for resolved discussion section comment also.

#### Resolved Task B-all-443<a name="b-all-443"></a>  
On <https://stage.uclusion.com/inbox/UNREAD_REVIEWABLE_242798ce-bace-40b1-958f-9a1ce28e9af8> notification is not showing a wizard because underlying comment is resolved. In this case and any others where the wizard is blocked from showing there must be text that explains why.

#### Resolved Report R-all-164<a name="r-all-164"></a>  
B-all-445 is implemented and ready to look at; B-all-443 is not started because it is gated on the two open questions Q-all-104 (what the blocked-wizard page should display) and Q-all-105 (whether such rows stay hidden in the inbox list).

What works now for B-all-445:
- A #c link to a resolved group bug opens the Bugs section, switches to its Resolved tab, expands the bug, and scrolls to it — same behavior links to open bugs already had. Previously the link incorrectly opened the Discussion section with nothing selected.
- A #c link to a resolved question, suggestion, or note opens the Discussion section, switches to its Resolved tab, expands the comment, and scrolls to it.
- Pagination is handled: if the resolved item is past the first page, the list jumps to its page (same pin mechanism the bug tabs use).
- Symmetric fix: if the Discussion section was left on the Resolved tab, a link to an open comment now switches back to the Open tab.

Changes are in MarketTodos.js, PlanningDialog.js, and DiscussionSection.js; details are in R-all-163 on the resolved task. Lint is clean. Once Q-all-104 and Q-all-105 are answered I will implement B-all-443 and extend this review.

## Job J-all-311<a name="j-all-311"></a>
### More AI integration issues.

This job is in stage Complete.
#### Reports 
#### Report R-all-141<a name="r-all-141"></a>  
T-2143 is ready to test. Added an `UNREAD_OPTION` branch in `calculateTitleExpansionPanel` (src/pages/Home/YourWork/InboxExpansionPanel.js) that routes to `AnswerWizard` (marketId = message.market_id, commentId = parent question comment parsed from `type_object_id`), per the Q-all-89 answer. This fixes the blank `/inbox/UNREAD_OPTION_<id>` page — opening a 'new option' notification now shows the question with all options and voting. Lint passes.

To verify: reload your local repro at `/inbox/UNREAD_OPTION_85d30825-...` — it should render the decision/answer wizard instead of a blank page.

Not done (intentionally): T-2144's inbox-vs-counts screening consistency. Per C-all-942 that's being handled on the backend (clearing the notification on resolve), so I left `InboxRow` and `getInboxCount` unchanged — see note R-all-139. T-2144, B-435, and B-434 remain open and were not part of this change.

> ##### Reply C-all-943<a name="c-all-943"></a> 
<http://localhost:3000/inbox/UNREAD_OPTION_85d30825-8a84-4fef-ba42-a976a53e356c> now has the correct title and subtext instead of being blank. Unfortunately the question it is supposed to display does not.

##### From AI user:
> ##### Reply C-all-944<a name="c-all-944"></a> 
Follow-up for C-943 (title/subtext showed but the question didn't). The object id in `type_object_id`/`link` (e.g. 767afdb3) is the story investible, not the question comment, so `getCommentRoot` found nothing. An inline option's question is the inline decision market's `parent_comment_id` (in `parent_comment_market_id`) — same lookup `DecideResponseStep` uses. Two changes: (1) InboxExpansionPanel now routes UNREAD_OPTION to AnswerWizard with the inline decision market (`comment_market_id`) + `comment_id`; (2) DecideAnswerStep, only when `message.type === 'UNREAD_OPTION'` and the market has a parent comment, walks up to that parent question and renders it with options + voting (existing decision flows unchanged). Please reload `/inbox/UNREAD_OPTION_85d30825-...` — the question with its options should now display.

#### Notes 
#### Note R-all-139<a name="r-all-139"></a>  
Per C-all-942 (answer to Q-all-90) the front-end consistency fix is intentionally NOT being made here — the real fix is the backend clearing the UNREAD_OPTION notification when its parent question resolves, after which the inbox-vs-counts mismatch becomes an extreme corner case. So `InboxRow` (parent-resolved screen) and `getInboxCount` were left as-is on the web-ui side.

#### Note R-all-140<a name="r-all-140"></a>  
Fixed the blank `/inbox/UNREAD_OPTION_<id>` page. Root cause: `UNREAD_OPTION` had no branch in `calculateTitleExpansionPanel` (src/pages/Home/YourWork/InboxExpansionPanel.js), so opening the work item rendered an empty `<React.Fragment/>` in `WorkListItem`. Per Q-all-89, added a branch routing UNREAD_OPTION to `AnswerWizard` (DecideAnswerStep) with marketId = message.market_id (the parent market) and commentId = the parent question comment id parsed from `type_object_id` (UNREAD_OPTION_<questioncommentid>). This shows the question with all options including the newly added one, plus voting — the same wizard decisions already use.</questioncommentid>

#### Resolved 
#### Resolved Task B-all-436<a name="b-all-436"></a>  
Got Notification: New or updated option from AI adding options even though thought that was turned off.

#### Resolved Task T-all-2144<a name="t-all-2144"></a>  
The navigation button and sidebar counts both inbox and view are showing a new message while nothing in inbox. This is because the inbox is screening the message for the option being out of date and the other counts are not.

**Really need to use the same message screening in all 4 places but then unclear how anyone knows problem happened - maybe prod does differently than stage?**

#### Resolved Question Q-all-89<a name="q-all-89"></a>  
T-2143 / blank inbox URL — root cause found. An `UNREAD_OPTION` ("New or updated option") notification has no branch in `calculateTitleExpansionPanel` (src/pages/Home/YourWork/InboxExpansionPanel.js). So opening `/inbox/UNREAD_OPTION_<id>` makes `WorkListItem` render an empty `<React.Fragment/>` (WorkListItem.js ~line 210) → the blank page (this happens whether or not the parent question is resolved). The message points at the parent question (the object part of `type_object_id` is the question comment, in `market_id`) and carries the new option's `investible_id` inside the inline decision (`link_type: INLINE_STORY_INVESTIBLE`). When a user clicks a "new option" notification, what should it open?

#### Option O-3<a name="o-3"></a>
#### Respond within the option (RespondInOptionWizard)
Route to RespondInOptionWizard / DecideResponseStep so the user replies/responds in the context of the option.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Open the decision (AnswerWizard)
Route UNREAD_OPTION to AnswerWizard / DecideAnswerStep (marketId = parent market, commentId = parent question comment root). This shows the question with all of its options including the newly added one, with voting — same wizard NOT_FULLY_VOTED decisions already use. Most consistent with existing decision UX.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
A 'new option' notification is most useful when it drops you into the decision showing the question with all options (including the new one) and voting. AnswerWizard/DecideAnswerStep already does exactly this and is what NOT_FULLY_VOTED decisions use, so it's the least surprising and most reusable. Opening only the bare option (O-2) loses the voting context, and RespondInOptionWizard (O-3) is for replying within an option rather than reviewing a newly added one.

> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
This is the consistent choice.

#### Option O-2<a name="o-2"></a>
#### Open just the new option investible
Navigate to / render the specific newly added option investible via its investible_link, so the user sees only the option that was added rather than the whole question.


This option is in stage In Dialog.
#### Resolved Task T-all-2143<a name="t-all-2143"></a>  
This message shows up and somehow gets screened out of showing in the inbox - not because of version.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/cab567b4-b0d8-42e2-bf1a-28cf41cd1ef1.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task B-all-435<a name="b-all-435"></a>  
Add 2 / 5 - Somewaht Uncertain instead of just the color.

#### Resolved Task B-all-434<a name="b-all-434"></a>  
MD file has to specify using links in code comments:

```
// Day membership uses the comment's `tz` field (creator's IANA zone) when present,
```

```
// falling back to viewerTz, per Q-all-59. The note's bucketing key is
```

```
// floor(updated_at) per Q-all-54, and a resolved task's day is
```

```
// floor(task.updated_at) per Q-all-62 (resolved comments cannot be edited so
```

```
// updated_at reflects the resolve event).
```

#### Resolved Question Q-all-90<a name="q-all-90"></a>  
T-2144 consistency — the inbox screens an UNREAD_OPTION whose parent question is resolved: `InboxRow` (src/pages/Home/YourWork/InboxRow.js ~line 189) returns nothing when `rootComment.resolved` (and for this notification rootComment = the option's parent question). But the nav button + sidebar counts use `getInboxCount` (src/contexts/NotificationsContext/notificationsContextHelper.js) which only checks `isInInbox` and does NOT apply that parent-resolved screen — so the 4 places disagree (counts show a message the inbox hides). When the option's parent question is already resolved/decided, how should the 4 places be reconciled?

> ##### Reply C-all-942<a name="c-all-942"></a> 
We can skip this problem on the front end for now. The bigger issue is that the back end is not clearing this notification on resolve - I will fix that and then this will be an extreme corner case.

#### Option O-1<a name="o-1"></a>
#### Show consistently (keep notification)
Don't screen UNREAD_OPTION on parent-resolved; show it in the inbox (using whatever wizard wins Q-all-89) and keep counting it. Rationale: B-436 shows the worry is unexpected/silent option notifications — a new option arriving is worth seeing even after the question resolved, and silent disappearance hides that something happened.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Lean toward showing consistently. B-436 shows the real concern is option notifications appearing unexpectedly/silently, so silently dropping them in all 4 places makes it harder to know an option arrived (your noted downside). Keeping it visible plus a working wizard makes the 4 places agree and preserves the audit trail. Only moderate certainty because if these notifications are genuinely noise on decided questions, hiding everywhere is defensible.

#### Option O-2<a name="o-2"></a>
#### Hide consistently (screen everywhere)
Apply the same parent-resolved screen used by InboxRow to getInboxCount (and thus the nav button + sidebar), so all 4 places drop the notification once the parent question is resolved. Rationale: a new option on an already-decided question is stale. Downside you noted: nobody sees that the option arrived.


This option is in stage In Dialog.
#### Resolved Task C-all-941<a name="c-all-941"></a>  
Make add option part of CLI so can test this.

#### Resolved Task T-all-2145<a name="t-all-2145"></a>  
Make the options that have messages show bold as per usual.

## Job J-all-325<a name="j-all-325"></a>
### Opening certain wizards inside their containers.


This job is in stage Complete.
#### Reports 
#### Report R-all-255<a name="r-all-255"></a>  
T-all-2215 is implemented. Lint is clean across all changed files and a production build compiles (+251 B). In-app QA still needs a human pass — that checklist is filed as S-all-86.

Scope (per the edited task + Q-all-159 / E-2)
- Inline edit wizard: JOBS only. Option name/description inline edit was taken out of scope, so per your E-2 vote on O-2 the job edit wizard replaces the Overview tab body (mirrors the add wizards) rather than rendering in place.
- Pencil edit button and hand cursor: BOTH jobs and options.

How it works
- InlineWizardHost now handles JOB_EDIT_WIZARD_TYPE -> JobEditWizard. PlanningInvestible's mySetBeingEdited calls openInlineWizard({wizardType: JOB_EDIT_WIZARD_TYPE, ...}) instead of navigating to /wizard; the existing host renders it in place of the Overview tab body. showJobHeaderAboveWizard stays false for job edit, so the name/description header is not duplicated above the editor.
- Closing: JobEditStep's Update and Cancel (and JobUnlockStep's "go back") now close the inline view via InlineWizardContext.closeInlineWizard when present, instead of navigating to the investible link — that navigate is a no-op when you're already on the page, so it would have left the editor open. Outside an inline host (full-screen /wizard route) the context is absent and the original navigate runs unchanged. InlineWizardContext is the existing leaf module, so no import cycle.
- Pencil button (T-all-2215): removed the mobileLayout guard so EditMarketButton shows on desktop too — for jobs (PlanningInvestible, still gated on !inMarketArchives && editable) and options (DecisionInvestible, gated on editable).
- Hand cursor: changed cursor from the edit_cursor.svg pencil to plain pointer in PlanningInvestible.fullWidthEditable (job outer) and InvestibleBodyEdit.containerEditable (the shared job + option name/description container).
- Options stay full-screen: option edit still navigates to /wizard (inline option edit out of scope); only the desktop button and hand cursor changed there.

Files: components/InlineWizard/InlineWizardHost.js; pages/Investible/Planning/PlanningInvestible.js; pages/Investible/InvestibleBodyEdit.js; pages/Investible/Decision/DecisionInvestible.js; components/AddNewWizards/JobEdit/{JobEditStep,JobUnlockStep}.js.

Nothing committed yet. T-all-2215 is depicted and safe to resolve once you've looked; manual QA is tracked in S-all-86.

#### Notes 
#### Note R-all-228<a name="r-all-228"></a>  
Fixed. The inline Cancel was rendered in its own trailing flex:3 actionContainer, and since the button row uses justify-content:space-between with the other action containers growing, it got pushed to the far right of the row. Moved Cancel to render right after the primary action button (e.g. next to "Add Task") with a small left margin; the flex:3 containers still absorb the free space so the primary + Cancel stay packed together on the left. On mobile (column layout) it stacks directly under the primary button. Lint clean.

#### Note R-all-227<a name="r-all-227"></a>  
Q-all-148/O-5 implemented (wording + restyle of the add-comment wizard title). The casual "What is your task?" is replaced by a concise form heading: New task / New question / New suggestion / New blocker / New note (and New progress report). Done in both AddCommentStep components - JobComment (investible side) and Discussion (dialog side) - so all five comment wizards match; terms follow the toolbar labels (e.g. "Add blocker" -> "New blocker"). Title typography tightened from the shared 35px introText to 24px with smaller margins, overridden locally so other wizards' intros are unchanged. Side benefit: removes reliance on the non-existent suggest_changeSimple / suggest_changeTitle message ids the old code referenced. Lint clean.

#### Note R-all-229<a name="r-all-229"></a>  
Revised per direction: removed the separate Cancel button entirely. WizardStepButtons now reuses the existing terminate slot - when a wizard is inline and the step has no terminate of its own (showTerminate falsy), the terminate button renders as "Cancel" wired to closeInlineWizard; if the step already shows a terminate (e.g. "Go to question"), nothing is added and that button stays. So Cancel now appears in the standard terminate position, not a separate/extra button. (Supersedes the earlier "next to primary" attempt.) Lint clean.

#### Note R-all-226<a name="r-all-226"></a>  
Fixed. Root cause from the inline change: BugDescriptionStep preselected the pill via `commentType === '0'/'1'` (string compares). The old full-screen path delivered the open bug section index as a string from the URL, but the inline launch passes it as a number, so 0 === '0' was false and it always fell through to BLUE. Fixed by string-coercing the index in BugDescriptionStep before comparing, so Critical(0)→RED, able(1)→YELLOW, convenient(2)→BLUE again, regardless of number vs string.

Also fixed the identical sibling regression in JobDescriptionStep (line 136): the Backlog "Add job" button passes the backlog section index as a number too, so `jobType === '0'` was failing and Ready jobs defaulted to NOT_READY. Same one-line string-coercion fix. Bug and Job were the only two inline descriptors that pass a numeric index; all the other wizards pass string comment-type constants, so they're unaffected.

Lint clean; trivial coercions within files already covered by the earlier production build. Still needs the same in-app verification as the rest (open Critical bugs → Add bug → RED preselected; open Ready backlog → Add job → READY preselected).

#### Note R-all-231<a name="r-all-231"></a>  
Done. Delete now opens inline like the other add wizards, and inline its back button is "Cancel".

1. InlineWizardHost dispatches DELETE_COMMENT_TYPE -> DeleteWizard (marketId, commentId, isInbox).
2. Comment.js and Reply.js delete buttons call openInlineWizard({wizardType: DELETE_COMMENT_TYPE, ...}) when an inline launch context is available and it's not an inbox item; otherwise they fall back to the full-screen /wizard route (inbox, archives, anywhere without the context).
3. PlanningInvestible now wraps its content in InlineWizardLaunchContext.Provider so the comment delete buttons there can open inline (PlanningDialog already provided it around its body).
4. DeleteWarningStep is inline-aware: when inline it sets showTerminate={!closeInlineWizard} so the back button becomes the standard inline "Cancel" (closeInlineWizard) instead of "Go Back", and after a successful delete it calls closeInlineWizard() to return to the page rather than navigating.

Note: full-screen delete (inbox/archives) keeps its existing "Go Back" button and post-delete navigation - only the inline path changed. Say if you want the full-screen label changed too. Lint clean; full production build compiles.

#### Note R-all-230<a name="r-all-230"></a>  
Fixed. Root cause: the note's compose step renders the InboxWizards WizardStepButtons (a different component from the AddNewWizards one that carries the inline-Cancel logic), and that component's terminate ignores the onTerminate prop - it just calls startOver() (resets the editor) + onFinish(). So inline the "Skip" button reset the field and appeared to do nothing. Fix in CommentAdd: when rendered inline (InlineWizardContext.closeInlineWizard present), the note branch passes onFinish={closeInlineWizard} and relabels the terminate to "cancel". So Skip -> Cancel now closes the inline wizard and returns to the page. Full-screen behavior is unchanged (no context -> original onFinish + "Skip" label). Lint clean; full production build compiles.

#### Resolved 
#### Resolved Question Q-all-159<a name="q-all-159"></a>  
T-all-2215 converts the edit-job and edit-option wizards to open inline instead of on the full-screen /wizard route. Where should the inline edit wizard render? The earlier add wizards (Q-all-145/O-1) replaced the whole tab body / section. Editing is launched from a more specific spot — the job's name+description block in the Overview tab, or an individual expanded option card inside the Discussion section — so an alternative is to render the edit form in place of just the name+description block it edits, leaving the surrounding view intact.

#### Option O-2<a name="o-2"></a>
#### Replace the tab body / section
Mirror the add wizards exactly: opening the edit wizard replaces the entire Overview tab body (job) or hides the surrounding options/section (option) until Cancel or save. Consistent with how add task/question/etc. already behave, but for an option it hides the rest of the option list while you edit one.


This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
I have taken inline option name description edit out of scope so now this is the best choice.

#### Option O-1<a name="o-1"></a>
#### In place of name+description
Render the edit wizard in place of the name+description block being edited. For a job the Overview tab keeps its CardType/created-by row above; for an option the other options stay visible in the list and the editor replaces just that one option's body. Less disruptive, and it works uniformly whether the option lives in a planning job or a dialog discussion (the option screen carries its own inline state, so PlanningDialog needs no change).


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
In place is the better fit for editing. Editing is launched from a specific block (the name+description), unlike the add wizards which create something that didn't exist yet — so replacing only that block reads as "open in place" and keeps useful context (the CardType/created-by row for a job; the rest of the option list for an option). It's also uniform: an option's edit state can live on the DecisionInvestible card itself, so options edit identically whether they're shown inside a planning job or a planning dialog, and PlanningDialog needs no change. The one tradeoff vs O-2 is slight inconsistency with the add wizards' "replace the tab body" behavior, but editing in place is the less disruptive and more contextual experience, which matters more here.

#### Resolved Question Q-all-147<a name="q-all-147"></a>  
After an inline wizard finishes successfully (e.g. a comment is sent or a job is created), what should happen? Today these wizards navigate to the newly created item (e.g. the comment link). Per T-all-2188 the inline open-state is local and clears on any navigation, so either option satisfies that task.

#### Option O-2<a name="o-2"></a>
#### Navigate to created item
Keep today's behavior: on completion navigate to the new comment/job (e.g. formCommentLink), which also clears the inline state. Less code churn and confirms the result by showing it, but bounces the user out of the inline view.


This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Since the user is already on that page he should not experience a bounce. The navigate is necessary because the item may not be on the page yet and we want retain showing the new item in yellow briefly.

#### Option O-1<a name="o-1"></a>
#### Dismiss and stay
Close the inline wizard and stay on the current screen/tab, with the newly created item now visible in place. Keeps the user in the container context the job is built around, no page jump.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Lean toward dismiss-and-stay since the whole point of the job is to keep wizards inside their container; bouncing to the created item undercuts that. Lower certainty because navigate-to-item is today's behavior, is less code churn, and confirms the result — a reasonable call either way, so flagging rather than deciding silently.

#### Resolved Question Q-all-146<a name="q-all-146"></a>  
T-all-2189 requires a way to cancel an open inline wizard and return the page to how it normally displays. What affordance should that be? (Today the wizard is a full-screen route dismissed via browser back, which no longer applies when it is embedded in a tab.)

#### Option O-3<a name="o-3"></a>
#### X close icon
Show an "X" close icon at the top corner of the inline wizard region that dismisses it.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Cancel button in wizard
Add an explicit "Cancel" text button/link in the inline wizard's button row (alongside its existing action buttons). Clicking it clears the local open state and restores the normal tab view. Most discoverable and consistent with the wizard's own controls.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Explicit "Cancel" button in the wizard's button row is the most discoverable and reuses the wizard's existing control area. Toggling the launch control (O-2) is easy to miss as a cancel, and an X icon (O-3) introduces a new top-corner control that the wizard layout doesn't otherwise have.

> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-2<a name="e-2"></a>
The button will not always be called "Cancel". For instance there is already a "Go to question" button on the option creation page after you create a question and that would stay. Cancel would not apply there as it sounds like we are cancelling creating the question which we we are not.

#### Option O-2<a name="o-2"></a>
#### Toggle off launch control
Re-clicking the same launch button (or the already-selected tab) closes the wizard. No new UI, but the toggle is less discoverable as a cancel.


This option is in stage In Dialog.
#### Resolved Task T-all-2215<a name="t-all-2215"></a>  
Make edit jobs inline wizards.

Then for both jobs and options make the pencil icon edit button guarded by mobile visible for desktop and mobile (remove mobile guard). Make the hover mouse over name and description be a hand icon instead of pencil.

#### Resolved Task T-all-2189<a name="t-all-2189"></a>  
Some method for cancelling and returning to the page as it normally displays must be present.

#### Resolved Report R-all-225<a name="r-all-225"></a>  
Implemented: the in-scope add wizards now open inside their container instead of on the full-screen /wizard route. Lint is clean across all changed files and a production build compiles successfully. Manual in-app QA still needs a human pass — that checklist is filed as S-all-84.

How it works
- New leaf module components/InlineWizard/InlineWizardContext.js holds two contexts (launch + cancel) with no wizard imports to avoid an import cycle; InlineWizardHost.js renders the right wizard for a {wizardType, ...params} descriptor and threads isInline.
- Each screen keeps the open-state in local React state (NOT the URL) and clears it on any location change via a useEffect on pathname/hash. That single mechanism satisfies both T-all-2188 (navigate away/back shows the page normally) and Q-all-147/O-2 (post-submit the wizard navigates to the created item, which clears the inline view). Switching tabs also closes it.

Decisions applied
- Q-all-145/O-1: opening a wizard replaces the tab body. PlanningInvestible/PlanningDialog gate their normal tab content on !inlineWizard and render the host instead.
- T-all-2184: for Add approval and Add progress report the job title + description from the review section stay above the wizard (not the JobDescription header), so it reads as opening in place.
- T-all-2187: JobDescription (name + assignment) is suppressed inside the comment/approval wizards via the isInline prop.
- T-all-2189 / Q-all-146/O-1: WizardStepButtons shows a context-driven Cancel that clears the inline state. AddOptionStep passes hideInlineCancel so its existing "Go to question" terminal stays and no duplicate Cancel appears (per your E-2 note that the button isn't always "Cancel").
- S-all-83: every on-screen launch point for an in-scope wizard goes inline — toolbar buttons, the matching keyboard shortcuts (moved into PlanningInvestible/kept in PlanningDialog), the Overview "+" buttons, and the right-nav Accept. Out-of-scope wizards (assignee, approvers, collaborator, job stage) and inbox entry points still open full-screen; child launch sites (MarketTodos, Backlog) fall back to the full-screen navigate when used outside these screens.

Files: components/InlineWizard/{InlineWizardContext,InlineWizardHost}.js (new); WizardStepButtons.js; JobComment/{JobCommentWizard,AddCommentStep,AddOptionStep}.js; Discussion/AddOptionStep.js; Approval/{ApprovalWizard,JobApproveStep}.js; Investible/{Investible,Planning/PlanningInvestible,Planning/PlanningInvestibleNav}.js; Dialog/Planning/{PlanningDialog,DiscussionSection,MarketTodos,Backlog}.js.

Nothing committed yet. All six tasks (T-all-2184/2185/2186/2187/2188/2189) plus S-all-83 are depicted and safe to resolve once you've looked.

##### From AI user:
> ##### Reply C-all-1020<a name="c-all-1020"></a> 
Fixed both placements (lint clean, production build compiles).

Jobs — the pencil now top-aligns with the card. The editRow had a fixed 3rem height + a 0.3rem top nudge that were tuned for the old mobile-only button, which left it sitting too low on desktop; replaced with alignItems: flex-start so it lines up with the top of the CardType header, and marginLeft: auto so it sits at the top-right of the card rather than floating next to the type chip.

Options — on desktop the pencil moved into the right action panel (the md=2 column, alongside the diff toggle / created-by / attachments), rendered at the top of that panel. On mobile, where there is no right panel, it stays in the body under the description as before. Implemented by gating the body button on mobileLayout and adding a !mobileLayout button at the top of the actions column.

Option edit itself is still full-screen (inline option edit is out of scope per Q-all-159); only the button position changed. Both are in the S-all-86 QA checklist (items 1 and, for the new positions, worth a glance on desktop + mobile).

> ##### Reply C-all-1019<a name="c-all-1019"></a> 
The pencil edit icon came out poorly placed for jobs and options. For jobs it is not aligned correctly with the top of the card. For options it is not on the right side action panel - which makes sense for mobile since right side is not there but for desktop will have to be different.

#### Resolved Task T-all-2196<a name="t-all-2196"></a>  
When create a new note on a job there is a Skip button which does nothing - should be cancel.

#### Resolved Task T-all-2187<a name="t-all-2187"></a>  
The name and assignment of the job should no longer display on the job wizards that are now inside the job container. This information is available on the job nav which is still visible.

#### Resolved Task T-all-2195<a name="t-all-2195"></a>  
Cancel button is too far away.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e7a8c69d-37eb-47d8-9d39-e170668374a8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task T-all-2197<a name="t-all-2197"></a>  
Make delete an inline wizard also and change it's back button to just be cancel.

#### Resolved Task T-all-2185<a name="t-all-2185"></a>  
Add task, ask question, add suggestion, add blocker, and add note open inside the planning investible screen with the job tabs, Overview, Open tasks, ..., above and job PlanningInvestibleNav remaining on the right side.

#### Resolved Task T-all-2186<a name="t-all-2186"></a>  
Add job, add bug, add note, add question, and add suggestion open inside the planning dialog screen with the view tabs, Job Progress, Job Backlog, ..., above.

#### Resolved Task S-all-84<a name="s-all-84"></a>  
Manual QA checklist for the inline wizards (I verified lint + a clean production build, but could not drive the app interactively, so these behaviors still need a human pass):

Planning investible screen (T-all-2185/2184):
- Each toolbar button (Add task / question / suggestion / blocker / note) opens the wizard in place of the tab body, with the job tabs above and PlanningInvestibleNav still on the right.
- Keyboard shortcuts ctrl+a / ctrl+q / ctrl+alt+s / ctrl+alt+b / ctrl+alt+n open the same wizards inline (they were moved off Investible.js into PlanningInvestible.js).
- Overview "+" for Add approval and Add progress report open inline with the job title + description still shown above (the review-section copy, not the JobDescription header) (T-all-2184). The right-nav "Accept" also opens approval inline.
- No name/assignment header inside task/question/suggestion/blocker/note wizards (T-all-2187).

Planning dialog screen (T-all-2186):
- Add job (Job Progress and Backlog tabs), Add bug (Todos tab), and Add note/question/suggestion (Discussion tab) open inline with the view tabs above; ctrl+a/q + ctrl+alt+s/n too.

Cross-cutting:
- Cancel returns the page to its normal display (T-all-2189). On the option step after creating a question the existing "Go to question" button is kept and no extra Cancel appears.
- After a successful submit the wizard navigates to the created item and the inline view clears (Q-all-147, O-2).
- Open a wizard, navigate to another job/view, come back: the page shows normally with no wizard (T-all-2188). Switching tabs also closes an open wizard.
- Out-of-scope wizards still open full-screen: assignee, approvers, collaborator, job stage, and any inbox entry point (S-all-83).

#### Resolved Task T-all-2188<a name="t-all-2188"></a>  
If you navigate away from the wizard and come back the original screen shows as before you hit the button. So only state local to the tab you are on is used to indicate displaying the wizard and that state should be gone if you navigate and come back.

#### Resolved Task S-all-83<a name="s-all-83"></a>  
Scope boundary for launch points. The in-scope comment wizards (task/question/suggestion/blocker/note) and approval are reachable from more than the on-screen toolbar buttons the tasks name: on the planning investible screen there are also keyboard shortcuts (Ctrl+A task, Ctrl+Q question, Ctrl+Alt+S suggestion, Ctrl+Alt+B blocker, Ctrl+Alt+N note) and right-nav buttons, all of which currently navigate to the full-screen /wizard route. I suggest we treat "on this screen" consistently: every on-screen launch point for an in-scope wizard (toolbar buttons, the matching keyboard shortcuts, the Overview "+" for approval/report, and the right-nav Accept/approval button) opens it inline. I'd keep OUT of scope — i.e. still full-screen — the wizards the job does not list (assignee, approvers, collaborator, job stage) and any off-screen entry point such as inbox notifications, since those open from a context where the target container isn't on screen. If you'd rather I leave the keyboard shortcuts on the full-screen route for now, say so and I'll narrow it to just the buttons.

#### Resolved Task T-all-2191<a name="t-all-2191"></a>  
Add bug button must remember which section is open as it did before this change. That is if you are looking at the Critical bugs and hit Add bug button then the Critical bug pill is selected by default.

#### Resolved Suggestion S-all-86<a name="s-all-86"></a>  
Manual QA checklist for T-all-2215 (I verified lint clean + a clean production build; the in-app behavior still needs a human pass):

1. Desktop pencil button — on a planning job (Overview tab) and on an expanded option, the pencil edit button now shows on desktop as well as mobile when the item is editable. Confirm it's still hidden in archives / when not editable.
2. Hand cursor — hovering the name+description of a job and of an option shows a plain hand (pointer) cursor, not the old pencil cursor.
3. Job edit opens inline — clicking the job name/description, or the pencil button, replaces the Overview tab body with the edit wizard (no jump to the full-screen /wizard route; URL unchanged). The job header is NOT shown above it (you're editing it).
4. Update — editing name/description and clicking Update saves and returns to the normal Overview with updated content (inline view closes).
5. Cancel — returns to the normal Overview and releases the edit lock.
6. Locked-by-someone-else — the inline editor first shows the Unlock step; "go back" closes the inline view; Break lock proceeds to the edit step.
7. Navigate away/back — with the inline editor open, navigating away and returning shows the page normally.
8. Options stay full-screen — clicking an option's name/description or its pencil button still opens the option edit on the full-screen /wizard route. Inline option name/description edit is intentionally out of scope (Q-all-159 / E-2); only the desktop button + hand cursor changed for options.

#### Resolved Task T-all-2184<a name="t-all-2184"></a>  
Add progress report and add approval are also inside the planning investible screen with the job tabs and job nav but additionally the title and description of the job remain above them also. This is the current name and description of the job display above their respect add buttons in the review section. The idea is that the user feels the wizard opened in place so don't use the JobDescription version.

#### Resolved Task T-all-2190<a name="t-all-2190"></a>  
Test that wizards that reference one of these wizards as part of their steps are unaffected. For instance moving a bug offers a choice of New Job.

#### Resolved Question Q-all-148<a name="q-all-148"></a>  
Now that the add-comment wizards open inline, the top line "What is your task?" (and "What is your question? / suggestion? / blocker? / note?") reads a bit casual. How should we reword/restyle this prompt to look more professional? Same treatment applies to all five comment wizards.

#### Option O-2<a name="o-2"></a>
#### Imperative: Describe the task
Keep a one-line prompt but make it directive: "Describe the task", "Describe the question", etc. Minimal change, reads more formal/action-oriented than "What is your...?".


This option is in stage In Dialog.
#### Option O-4<a name="o-4"></a>
#### Keep wording, restyle only
Leave the "What is your task?" copy but tighten the typography (size/weight/spacing) so it reads less casual. Lowest effort, but the casual phrasing remains.


This option is in stage In Dialog.
#### Option O-3<a name="o-3"></a>
#### Field label + placeholder
Drop the top question entirely; show a small field label ("Task") and/or an editor placeholder like "Describe the task...". Most minimal and closest to a standard form, but loses the prominent heading.


This option is in stage In Dialog.
#### Option O-5<a name="o-5"></a>
#### Do O-4 and O-1. That is change the styling and the wording of the title.

This option is in stage In Dialog.
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-2<a name="e-2"></a>
Will see what it looks like.

#### Option O-1<a name="o-1"></a>
#### Noun heading: New task
Replace the question with a plain bold section title - "New task", "New question", "New suggestion", "New blocker", "New note" - styled like a form header. Gives the now-inline form a clear, professional title and orients the user. Small, low-risk copy change.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{yellow} 50 out of 100 - Somewhat Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Lean to the noun heading ("New task"/"New question"/...). Now that the wizard replaces the tab body it has no title of its own, so a short bold form header both reads professional and orients the user to what opened. It's a small, low-risk copy change. Field label + placeholder (O-3) is the close runner-up and arguably the most modern, but it loses the prominent heading the inline form benefits from. Moderate certainty since this is a taste call.

#### Resolved Question Q-all-145<a name="q-all-145"></a>  
When an in-scope wizard opens inside a tab (e.g. "Add task" in Open Tasks, "Add question" in Assistance, or report/approval in Overview), should it replace that tab's normal body content until cancelled, or render together with the existing content? The tasks specify the chrome that stays (tabs above, nav on the right; title+description above report/approval), but not whether the tab's existing list/voting stays visible while the wizard is open.

#### Option O-2<a name="o-2"></a>
#### Render alongside
Render the wizard above (or below) the existing tab content, leaving the comment list / voting visible while you fill out the wizard. More context stays on screen but the tab gets longer and busier.


This option is in stage In Dialog.
#### Option O-1<a name="o-1"></a>
#### Replace tab body
Opening the wizard replaces the tab's normal content (comment list, voting, etc.) with the wizard until cancelled. Tabs stay above and the nav stays on the right; for Add progress report and Add approval the job title + description also remain above the wizard. This matches how the full-screen wizard takes over today and reads as a focused form.


This option is in stage In Dialog.
#### From AI user:
> ##### $${\color{lightgreen} 75 out of 100 - Certain Reason \space For}$$ E-1<a name="e-1"></a>
#### From AI user:
Replace the tab body. T-all-2184 only calls out that title+description must remain above the report/approval wizards — that wording only makes sense if everything else in the tab is replaced. A focused, single-purpose form matches how the full-screen wizard reads today and avoids a long, busy tab. Keeping the list alongside (O-2) mainly helps when you need to reference existing items while writing, which is the less common case.

> ##### $${\color{green} 100 out of 100 - Very Certain Reason \space For}$$ E-2<a name="e-2"></a>
Correct.

## Job J-all-312<a name="j-all-312"></a>
### More AI integration stuff.


This job is in stage Complete.
#### Resolved 
#### Resolved Task B-all-437<a name="b-all-437"></a>  
When AI does a reply and resolve it is fast enough to create a race condition between the reply notification and resolve removing that notification. **The problem is that the generated comment should have been a note instead of a reply. So either mistakenly sending a notification notices for a note or it didn't create as a note.**

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/84c9c253-39d1-452c-bb5d-0f724bf54038.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

#### Resolved Task T-all-2148<a name="t-all-2148"></a>  
Add to CLAUDE.md an explanation that each proposed test / other remaining work should be added to the job as suggestions instead creating a review report that explains remaining work.

