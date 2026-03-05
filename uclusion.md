| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Build the prompts necessary to get the lastest debuts from Show HN, Product...](#ea70be12-ff47-4e5c-b4cd-013e8415d18a)| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| 04/01| [Update stale documentation screen shots](#9d810e3e-9f32-4f1b-b377-13aebd8fbb64)|  |
| | | | [Remaining back end issues](#5d515962-6d4d-4207-a85f-a0962b31eca0)| Stage |
| | | | [Critical bugs.](#a3bdbe44-f98a-46d7-8b87-5badd9a4db4d)| Stage |
| | | | [Delaware franchise tax.](#d26b4ed9-b655-4c06-94f6-e2ce68cc55bb)|  |
## Job <a name="ea70be12-ff47-4e5c-b4cd-013e8415d18a"></a>
### Build the prompts necessary to get the lastest debuts from Show HN, Product...
...Hunt, etc. that meet the small tech startup criteria - have landing page but not too many engineers.

#### Task <a name="1b428bdd-3434-4c89-be1f-188ab330cf8b"></a> 
<https://platform.claude.com/cookbook/claude-agent-sdk-00-the-one-liner-research-agent> - or do same in Python

#### Task <a name="195e0742-30e7-4de6-94dc-7817796b26e0"></a> 
    import requests

    import json

    import time

    import os

    import google.generativeai as genai

    from bs4 import BeautifulSoup

    from rich.console import Console

    from rich.table import Table

    from rich.panel import Panel



    # --- CONFIGURATION ---

    # Get your key from: https://aistudio.google.com/app/apikey

    API_KEY = ""

    HN_API_BASE = "https://hacker-news.firebaseio.com/v0"

    HISTORY_FILE = "seen_leads_ai.json"



    # Configure the AI

    genai.configure(api_key=API_KEY)

    model = genai.GenerativeModel('gemini-1.5-flash')



    console = Console()



    # --- THE PROMPT ---

    # This is the brain of the agent. It defines what Uclusion is looking for.

    SYSTEM_PROMPT = """

    You are a Lead Qualification Agent for a product called 'Uclusion'.

    Uclusion is an opinionated project management tool for small, developer-centric startups.

    It focuses on asynchronous workflows, deep GitHub integration, and "stories" rather than tickets.



    Your Goal: Analyze the following Hacker News "Show HN" post and determine if the author is a potential customer.



    Criteria for a GOOD Match (Score > 70):

    1. It is a software startup or tool (not a blog post, tutorial, or hardware).

    2. It looks early-stage (small team, seeking feedback, beta launch).

    3. If they are building open source then the main developers must be founders of some startup or consulting company. Exclude open source with lots of not otherwise associated developers.

    4. They are NOT a direct competitor (like Linear, Jira, Asana).



    Output specifically in this JSON format:

    {

    "is_match": boolean,

    "score": integer (0-100),

    "reason": "Short explanation of why it fits or fails",

    "suggested_opening_line": "A casual, developer-friendly opening sentence for a cold email referencing their specific product."

    }

    """



    def clean_html(html_content):

    if not html_content:

    return ""

    soup = BeautifulSoup(html_content, "html.parser")

    return soup.get_text()



    def load_history():

    if os.path.exists(HISTORY_FILE):

    with open(HISTORY_FILE, "r") as f:

    return set(json.load(f))

    return set()



    def save_history(seen_ids):

    with open(HISTORY_FILE, "w") as f:

    json.dump(list(seen_ids), f)



    def get_show_hn_stories():

    """Fetches top 30 'Show HN' stories."""

    # HN has a specific endpoint for Show HN

    url = f"{HN_API_BASE}/showstories.json"

    return requests.get(url).json()[:30] # Limit to top 30 to save tokens/time



    def get_item_details(item_id):

    url = f"{HN_API_BASE}/item/{item_id}.json"

    return requests.get(url).json()



    def analyze_with_ai(title, text, url):

    """Sends the lead data to the AI for grading."""



    user_content = f"""

    Title: {title}

    Link: {url}

    Post Text/Pitch: {text[:1000]} (truncated)

    """



    try:

    response = model.generate_content(

    f"{SYSTEM_PROMPT}\n\nDATA TO ANALYZE:\n{user_content}",

    generation_config={"response_mime_type": "application/json"}

    )

    return json.loads(response.text)

    except Exception as e:

    console.print(f"[red]Error calling AI:[/red] {e}")

    return None



    def run_agent():

    seen_ids = load_history()

    console.print("[bold purple]🤖 Uclusion AI Sales Agent Starting...[/bold purple]")



    story_ids = get_show_hn_stories()

    new_leads = []



    with console.status("[bold green]Scanning and analyzing leads...[/bold green]") as status:

    for item_id in story_ids:

    if str(item_id) in seen_ids:

    continue



    item = get_item_details(item_id)

    title = item.get('title', 'No Title')

    text = clean_html(item.get('text', ''))

    url = item.get('url', f"https://news.ycombinator.com/item?id={item_id}")



    # Simple pre-filter: If it doesn't say "Show HN", skip it (save AI cost)

    # (Though fetching showstories.json usually ensures this)



    # CALL THE AI

    analysis = analyze_with_ai(title, text, url)



    if analysis and analysis['is_match']:

    lead_data = {

    "title": title,

    "url": url,

    "score": analysis['score'],

    "reason": analysis['reason'],

    "opener": analysis['suggested_opening_line']

    }

    new_leads.append(lead_data)

    console.print(f"[green]✔ MATCH FOUND:[/green] {title} ({analysis['score']}/100)")

    else:

    console.print(f"[dim]✖ Skipped:[/dim] {title}")



    seen_ids.add(str(item_id))

    time.sleep(1) # Respect rate limits



    # --- REPORTING ---

    if new_leads:

    console.print("\n[bold]🎯 High Quality Leads Found:[/bold]")

    for lead in new_leads:

    p = Panel(

    f"[bold]Score:[/bold] {lead['score']}\n"

    f"[bold]Why:[/bold] {lead['reason']}\n"

    f"[bold]Icebreaker:[/bold] {lead['opener']}\n"

    f"[link={lead['url']}]Click to View[/link]",

    title=f"[cyan]{lead['title']}[/cyan]",

    expand=False

    )

    console.print(p)

    save_history(seen_ids)

    else:

    console.print("[yellow]No new matches today.[/yellow]")



    if __name__ == "__main__":

    run_agent()




Key from <https://aistudio.google.com/app/api-keys?_gl=1*e918yo*_ga*MTAwNDA0NDQ3OC4xNzY5OTA3NDcw*_ga_P1DBVKWT6V*czE3Njk5MDc0NzAkbzEkZzAkdDE3Njk5MDc0NzAkajYwJGwwJGgyODEwMjUyNzI.>




1. Have to create a new key

#### Task <a name="98d7802c-da57-4a6c-947c-48843b385b00"></a> 


| **Source** | **Why it fits Uclusion** | **What to filter for** |
| --- | --- | --- |
| **Hacker News (Show HN)** | High density of dev tools. | "Show HN", "for developers", "async", "remote", "team". |
| **Reddit (r/SideProject, r/SaaS)** | Founders actively seeking validation. | "MVP", "beta", "looking for feedback", "dev tool". |
| **Product Hunt (Dev Tools)** | The standard launchpad. | "Developer Tools" category, <100 upvotes (early stage). |
| **GitHub** | Where the work actually happens. | New repos with high activity but few stars (growing teams). |








Source ideas from Gemini. In theory have a different script for each of these.

#### Resolved Task <a name="96c754d2-ab0a-4e19-bd3f-3c9a3c18a869"></a> 
Where do we run this? Does it need to be command line to get it to crunch long enough?




1. **Context Windows:** Complex, long-running tasks require agents that can bridge gaps between sessions. **Claude Agent SDK** is recommended for developing such agents, using an "initializer agent" to set up and a "coding agent" to make incremental progress.





<https://platform.claude.com/docs/en/agent-sdk/overview> - has a WebSearch tool

#### Resolved Task <a name="6eed327a-4de2-494b-b36d-16e6b7876843"></a> 
Evaluate Gemini idea for searching HN - offhand it sucks as show HN yes but limiting by keywords no.




    import requests

    import datetime

    import json

    import time

    from rich.console import Console

    from rich.table import Table



    console = Console()



    # Configuration

    HN_API_BASE = "https://hacker-news.firebaseio.com/v0"

    KEYWORDS = [

    "dev tool", "developer", "open source", "api", "sdk",

    "collaboration", "task management", "remote team", "async",

    "productivity", "workflow"

    ]

    # File to store seen IDs so we don't repeat leads

    HISTORY_FILE = "seen_leads.json"



    def load_history():

    try:

    with open(HISTORY_FILE, "r") as f:

    return set(json.load(f))

    except FileNotFoundError:

    return set()



    def save_history(seen_ids):

    with open(HISTORY_FILE, "w") as f:

    json.dump(list(seen_ids), f)



    def get_new_stories():

    """Fetches the latest 500 stories from HN (checking 'newstories' endpoint)"""

    url = f"{HN_API_BASE}/newstories.json"

    response = requests.get(url)

    return response.json()[:200] # Check top 200 new items



    def get_item_details(item_id):

    url = f"{HN_API_BASE}/item/{item_id}.json"

    return requests.get(url).json()



    def analyze_lead(item):

    """

    Returns True if the item looks like a target for Uclusion.

    """

    if not item or 'title' not in item:

    return False



    title = item['title'].lower()



    # 1. Filter for 'Show HN' (Makers showing off work)

    if "show hn" not in title:

    return False



    # 2. Keyword Matching (Is it relevant to Uclusion?)

    if any(keyword in title for keyword in KEYWORDS):

    return True



    return False



    def run_agent():

    seen_ids = load_history()

    new_leads = []



    console.print("[bold blue]🔎 Scanning Hacker News for Uclusion Leads...[/bold blue]")



    story_ids = get_new_stories()



    for item_id in story_ids:

    # Skip if we've already seen this lead

    if str(item_id) in seen_ids:

    continue



    item = get_item_details(item_id)

    if analyze_lead(item):

    lead = {

    "title": item.get('title'),

    "url": item.get('url', f"https://news.ycombinator.com/item?id={item_id}"),

    "comments_url": f"https://news.ycombinator.com/item?id={item_id}",

    "score": item.get('score', 0)

    }

    new_leads.append(lead)

    seen_ids.add(str(item_id))



    # Rate limit slightly to be polite

    time.sleep(0.1)



    # Output Results

    if new_leads:

    table = Table(title=f"🚀 New Leads found: {datetime.date.today()}")

    table.add_column("Title", style="cyan")

    table.add_column("URL", style="magenta")

    table.add_column("Score", style="green")



    for lead in new_leads:

    table.add_row(lead['title'], lead['url'], str(lead['score']))



    console.print(table)

    save_history(seen_ids)

    else:

    console.print("[yellow]No new relevant leads found this run.[/yellow]")



    if __name__ == "__main__":

    run_agent()

## Job <a name="f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f"></a>
### Better archive.



1. Move archive to left nav and make it per workspace
2. Add a group drop down
3. Split out objects in tabs - Tasks Complete, Not Doing, Bugs, Discussion

#### Task <a name="bf1d3f46-f7ab-4213-8b02-81fb4af34e5b"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8120554f-18cb-4c1f-900a-966cb2d9bd8e.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Some freaky text stuck in corner - only on stage. Also double scroll bars doing nothing.

#### Task <a name="d6946616-8a26-42d7-9243-a024200c3cc5"></a> 
**The important part is that the inset no longer open when search as count will display on side nav.**

#### Task <a name="05c06cda-1c40-470a-8ca1-46d414a03d21"></a> 
Add to solo demo archived stuff in all categories so can test.

#### Task <a name="7d5d5a86-51c4-426d-a0cb-e8ffe45f5250"></a> 
Show tasks complete as paginated rows as with backlog.

#### Task <a name="c1430d15-702c-4731-859f-8520bf003dea"></a> 
Can keep Archive on inset also if want - just it's a link into having the drop down set to that view.**﻿**

#### Task <a name="dddc34c9-9309-4cd4-b112-8fd30e4e9106"></a> 
Also need counts from search on other views for anything not showing in the current view (when autonomous).




When search group drop down not in effect and just shows all results.

#### Task <a name="2fcd674f-7c8d-46cf-85e8-6f10a428863c"></a> 
Change sub text on archive to say archive instead of group archive.

#### Task <a name="924ecad1-9099-4100-a608-bbbf24594cb6"></a> 
Make sure empty text does not display in archive. Currently it does at least for bugs.

#### Task <a name="8afc772c-c0e4-4131-abc3-2f930687e764"></a> 
Just copy how chat inset works for Gmail - it does cover stuff up. No need to push everything over as now which ends up being hokey.

## Job <a name="9d810e3e-9f32-4f1b-b377-13aebd8fbb64"></a>
### Update stale documentation screen shots
#### Resolved Task <a name="e651dc48-234e-440f-8fa0-9e215e22a64d"></a> 
Almost all documentation pictures that come from Uclusion app screen shots.

#### Resolved Task <a name="4957ab06-e55a-4948-910c-d21ffb3f0a48"></a> 
Inbox dark mode date needs to be white.

#### Resolved Task <a name="bc224c1c-8dfd-496c-a85b-2fc57c0e6c3d"></a> 
All blog pictures that come from Uclusion app screen shots.

#### Resolved Task <a name="a495ccb2-6d43-41d3-8c76-8d8b5741a4ae"></a> 
All front end pictures that come from Uclusion app screen shots.

## Job <a name="5d515962-6d4d-4207-a85f-a0962b31eca0"></a>
### Remaining back end issues
All currently known.

#### Resolved Task <a name="b097101a-dae2-406c-ac90-de23f91aa566"></a> 
The action moving to complete took a long time to resolve the open tasks.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/7811b2d6-d717-453a-a343-deab460e7fa7.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

> ##### Grouped task <a name="d57adbc0-572b-46e1-afd7-6de66dce5386"></a> 
**Actually no the correct way to do this is to filter better on the status display so that async has time to catch up.**

#### Resolved Task <a name="6a5ec178-53a0-4dc2-9128-4b97917650d5"></a> 
Changing the assignment from someone else to me when I have an existing approval does not work. Probably need to drop automatically removing my own approval when I am the one changing assignment.




Also check for any quick delete of your approval.

> ##### Grouped task <a name="d12b3f53-1cde-4bb4-b6dd-a7e1ba56b195"></a> 
Then change front end to not go into update approval when drag and drop and already have a vote OR just fix that stage for this case.

#### Resolved Task <a name="075badfd-12c4-4688-aaa5-68fee3cd0f0e"></a> 
You have an SSL/TLS certificate from AWS Certificate Manager in your AWS account that expires on Apr 13, 2026 at 23:59:59 UTC. This certificate includes the primary domain [preview.documentation.uclusion.com](http://preview.documentation.uclusion.com/) and a total of 1 domains.




AWS account ID: 264600994537

AWS Region name: us-east-1

Certificate identifier: arn:aws:acm:us-east-1:264600994537:certificate/423c7b15-1c3c-45d6-889b-2ea181761a00




**Remove this certificate - see email.**

#### Resolved Task <a name="39f63963-4ba5-454d-bef0-197b2c8de2d5"></a> 
When you move a task to a bug any replies on it resend their notifications.

#### Resolved Task <a name="4d996224-4a16-443f-b97f-412a3df8e6bd"></a> 
    22602-During handling of the above exception, another exception occurred:

    22670-

    22671-Traceback (most recent call last):

    22706-  File "/var/task/handlers/update.py", line 69, in post_validation_function

    22782-    user.update(actions=actions)

    22815-  File "/opt/python/lib/python3.10/site-packages/pynamodb/models.py", line 436, in update

    22905-    data = self._get_connection().update_item(hk_value, range_key=rk_value, return_values=ALL_NEW, condition=condition, actions=actions)

    23042-  File "/opt/python/lib/python3.10/site-packages/pynamodb/connection/table.py", line 122, in update_item

    23147-    return self.connection.update_item(

    23187-  File "/opt/python/lib/python3.10/site-packages/pynamodb/connection/base.py", line 912, in update_item

    23291:    raise UpdateError("Failed to update item: {}".format(e), e)

    23355:pynamodb.exceptions.UpdateError: Failed to update item: An error occurred (ConditionalCheckFailedException) on request (OBNN9GKOBDIPL0SJI94IBRP6VFVV4KQNSO5AEMVJF66Q9ASUAAJG) on table (uclusion-users-dev-users) when calling the UpdateItem operation: The conditional request failed

    23635-

    23636-During handling of the above exception, another exception occurred:

    23704-

    23705-Traceback (most recent call last):

    23740-  File "/opt/python/lib/python3.10/site-packages/pynamodb/connection/base.py", line 365, in _make_api_call

    23847-    return self.client._make_api_call(operation_name, operation_kwargs)

    23919-  File "/opt/python/lib/python3.10/site-packages/botocore/context.py", line 123, in wrapper

    24011-    return func(*args, **kwargs)

    24044-  File "/opt/python/lib/python3.10/site-packages/botocore/client.py", line 1078, in _make_api_call

    24143-    raise error_class(parsed_response, operation_name)

    --

    25478-Traceback (most recent call last):

    25513-  File "/opt/python/lib/python3.10/site-packages/ubcommon/handlers/abstract_request_handler.py", line 32, in handle_request

    25637-    return create_standard_return_body(post_validation_function(event, data, context, validation_context),

    25744-  File "/var/task/handlers/update.py", line 75, in post_validation_function

    25820-    user.update(actions=actions)

    25853-  File "/opt/python/lib/python3.10/site-packages/pynamodb/models.py", line 436, in update

    25943-    data = self._get_connection().update_item(hk_value, range_key=rk_value, return_values=ALL_NEW, condition=condition, actions=actions)

    26080-  File "/opt/python/lib/python3.10/site-packages/pynamodb/connection/table.py", line 122, in update_item

    26185-    return self.connection.update_item(

    26225-  File "/opt/python/lib/python3.10/site-packages/pynamodb/connection/base.py", line 912, in update_item

    26329:    raise UpdateError("Failed to update item: {}".format(e), e)

    26393:pynamodb.exceptions.UpdateError: Failed to update item: An error occurred (ValidationException) on request (1GO9UIJ948JTP8PI25N6L7FKGBVV4KQNSO5AEMVJF66Q9ASUAAJG) on table (uclusion-users-dev-users) when calling the UpdateItem operation: Invalid UpdateExpression: Two document paths overlap with each other; must remove or rewrite one of these paths; path one: [version], path two: [version]

    26784-/aws/lambda/uclusion-users-dev-users_update 2026/03/03/[$LATEST]c333a99c9cb44e309d978431eff4a03b [WARNING]        2026-03-03T04:20:42.300Z        65d0b467-ce55-4180-a2bb-1aff3dfef1a0  {'user_id': 'a2f1fe14-2b98-40dc-8cd7-a953678f71c5', 'needs_onboarding': False, 'onboarding_state': 'DEMO_CREATED'}

    27068:/aws/lambda/uclusion-users-dev-users_update 2026/03/03/[$LATEST]c333a99c9cb44e309d978431eff4a03b [INFO]   2026-03-03T04:20:42.300Z        65d0b467-ce55-4180-a2bb-1aff3dfef1a0  {'invoked': 'uclusion-users-dev-users_update', 'statusCode': 500, 'body': '{"error_message": "<class \'pynamodb.exceptions.UpdateError\'>"}'}




Cause this trick failing:




    try:

    user.update(actions=actions)

    except UpdateError as e:

    if 'onboarding_state' not in data:

    raise e

    # Do one retry as onboarding state is must have

    user = UserModel.get(hash_key=user.external_id, range_key=user.account_id, consistent_read=True)

    user.update(actions=actions)

## Job <a name="a3bdbe44-f98a-46d7-8b87-5badd9a4db4d"></a>
### Critical bugs.
#### Resolved Task <a name="225e42f3-9282-46a2-a546-0d409965f9e2"></a> 
Remove the hover color from navigate button on mobile. Also hints from Add button.




Actually same on Add buttons and maybe all with hover / press - the color does not go back to normal. Check or have AI put in the correct way.




Same for tabs - the changes Ethan had make don’t work on mobile.

> ##### Grouped task <a name="eafc8662-57f8-4fe4-991b-989f2923d7c3"></a> 
Test on iPhone as dev tools not honoring fix.

#### Resolved Task <a name="bf554e8a-5f5b-49b4-b1d9-5baf091115ab"></a> 
Created a new job out of two critical bugs and the description didn't auto fill.

#### Resolved Task <a name="ad1cead2-893b-4f0a-b411-2cd8a4ac9043"></a> 
Use of isSingleUser in CommentAdd is wrong - could have just not added the second user yet. Can check if fully autonomous instead. Probably true on whatever doing with ISSUE type but not sure.

## Job <a name="d26b4ed9-b655-4c06-94f6-e2ce68cc55bb"></a>
### Delaware franchise tax.
