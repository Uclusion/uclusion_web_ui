| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Build the prompts necessary to get the lastest debuts from Show HN, Product...](#ea70be12-ff47-4e5c-b4cd-013e8415d18a)| [Remaining back end issues](#5d515962-6d4d-4207-a85f-a0962b31eca0)| 02/26| [Bugs B-all-401, B-all-400](#f7e64af2-2c81-4baa-b2f7-a40df723db52)| Deployed to production |
| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| | | [Dark mode for app](#effdb67c-5825-421b-a298-48770945da5f)| Deployed to production |
| [Update stale documentation screen shots](#9d810e3e-9f32-4f1b-b377-13aebd8fbb64)| | | [Mobile issues.](#c27ba80a-bc55-45b7-8dae-0bbae049e570)| Deployed to production |
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
#### Task <a name="e651dc48-234e-440f-8fa0-9e215e22a64d"></a> 
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

#### Task <a name="b097101a-dae2-406c-ac90-de23f91aa566"></a> 
The action moving to complete took a long time to resolve the open tasks - probably async. Since this call from the action is already async should resolve them synchronously.

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/7811b2d6-d717-453a-a343-deab460e7fa7.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

> ##### Grouped task <a name="d57adbc0-572b-46e1-afd7-6de66dce5386"></a> 
Try to share the code to do this between async and sync (invoked from the action).

#### Task <a name="39f63963-4ba5-454d-bef0-197b2c8de2d5"></a> 
When you move a task to a bug any replies on it resend their notifications.

## Job <a name="f7e64af2-2c81-4baa-b2f7-a40df723db52"></a>
### Bugs B-all-401, B-all-400

#### Resolved Task <a name="3e6bb486-ad35-4235-8e46-6dcb9fa30bec"></a> 
Now when do Ready for Work -> Reject assignment -> Back to Inbox it goes back to a different wizard than started with and hitting buttons there doesn't work.

#### Resolved Task <a name="65bc9fa9-be29-4ed2-bb2e-4d9b93051c02"></a> 
Back to Inbox wizard appears for outbox also but sends to undefined. Can do Ready for Work -> Other options -> Back to Inbox.

#### Resolved Task <a name="bb04c532-ac14-4a5b-b722-0781a831a54e"></a> 
Next view from navigation button must go to Job progress tab and not whatever tab already on.

#### Resolved Task <a name="d29780df-27a6-4c74-86d8-e007227cde9b"></a> 
Next task on local goes to




<http://localhost:3000/dialog/161f6b87-f72d-4c85-afac-7ae4827ba924/0f7cbe80-64e3-46af-84e0-7290c2ae55ca#c75e3ebfc-b9dc-46d8-b888-1266c5d8422c>




which then spins forever looking for that comment.




**Problem is that this is a child comment and nothing knows how to get there. Just link to parent as can't get to children cause logic of potentially opening compressed to get there was funky and want context from parent anyway.**

## Job <a name="effdb67c-5825-421b-a298-48770945da5f"></a>
### Dark mode for app
Have to have it and doesn't seem like that hard to do. Just make the background colors come out of the theme and have setting to change theme to dark.




Does seem to also work off of a signal from OS as some things in browser go dark when use dark on OS.

#### Resolved Task <a name="951a3004-573d-4e06-be0b-5d36f0f87c4f"></a> 
Number of replies chip on BuglistItem not working in dark mode.

#### Resolved Task <a name="05da9aa2-de7e-4b6d-84ee-a74babb69de1"></a> 
MenuLists need work - inbox, bugs, backlog, options, etc.

#### Resolved Task <a name="9ef67ef5-439f-4fd2-bbc7-744452fc4b4e"></a> 
Check dark mode when chips.




Use dark mode on stage for a while.

#### Resolved Task <a name="76e4cad8-390e-4c55-911a-4544b795f380"></a> 
Fix user preferences.

#### Resolved Task <a name="aef1d487-32cc-4aec-b8b7-0c89f29b1081"></a> 
Fix all the wizards.

#### Resolved Task <a name="7113cf47-f30b-4201-a661-a68aa59745b7"></a> 
Try making the boxes in swimlanes and assistance a different color - just do slight shades of the background color - get AI to generate them and have them go from paused to complete with complete the lightest.

> ##### Grouped task <a name="47b4200e-2430-4ae6-af5a-6270e1911d08"></a> 
Fix the drag and drop color also.

#### Resolved Task <a name="963a9bc8-e6e5-48f9-8eb1-5c51b6522634"></a> 
On comments and anywhere else round all corners.




Action buttons should match the rounding done for Next button.

#### Resolved Task <a name="ae93ff66-3e53-4c18-abbc-09f38da0ca3a"></a> 
Make sure anything clickable like the commit message and tab names etc. changes color.




This includes add button on wizards which is not changing color.

#### Resolved Task <a name="4c575926-cbe2-49ca-8877-02ef46d70099"></a> 
Check mobile - button should be not present there.

#### Resolved Task <a name="31b39ecb-197a-4120-b8a3-4449e433a958"></a> 
Use one color for created updated by text on comments - is greyish on child and black on parent - regardless of mode.

#### Resolved Task <a name="c8fdae53-c03f-42fd-8321-a7ae06759a8d"></a> 
Check remaining FormControl in both add and inbox wizards.

#### Resolved Task <a name="a0485f7c-fb9c-4fea-8ce9-89ae97950f26"></a> 
In light mode when a row in inbox etc. is new it should be the light blue of the background color instead of the current darker color of the sidebar. Similarly for dark mode.

#### Resolved Task <a name="623614ad-814c-4a4d-b0a7-4c1c9e732d9b"></a> 
Quill editor background should be more greyish in dark mode - black text still works but display won't be so glaring.




Same for rectangular action buttons at top and next button?

#### Resolved Task <a name="eec1e53e-82db-468e-a8e3-2fb68fc8d8ea"></a> 
"Move to which job" - remove highlight on selection as did elsewhere.

#### Resolved Task <a name="3a81e818-ed5f-4c69-a10d-2c1b57455cca"></a> 
Make comment and investible description boxes darker shade of grey than current.




Also the same for wizard background.

#### Resolved Task <a name="0c7a4a36-ffe8-4131-abfc-b72e7e744fa7"></a> 
Icons on investible right nav.

#### Resolved Task <a name="3ebd6230-64ae-4651-b64f-165dda904529"></a> 
Close integrations chevron not visible in light or dark mode unless hover and so don't know can close.

#### Resolved Task <a name="f60da6bd-8b22-4531-b7a5-aee0e58aa360"></a> 
Fix the background of inbox wizards to be the same as add wizards.

#### Resolved Task <a name="4174dcb1-2680-4bc3-acdd-91489b297897"></a> 
Add another view to demo so can check collapse icon visible in dark mode.

#### Resolved Task <a name="94e04ea2-17e3-4cdb-8607-16d46dcbff08"></a> 
Get rid of the line under the name in swimlanes.

#### Resolved Task <a name="50ba92b2-572e-477a-9360-1c1cb761f91a"></a> 
Consider dark mode for app and landing page.




**See if AI can do this for you.**

#### Resolved Task <a name="8efc886a-ebb9-4207-9f69-7f128691021f"></a> 
Fix pitch black that is there when edit a comment.

#### Resolved Task <a name="017a1dc8-edaa-4ce6-9e9a-5fac9f54d477"></a> 
Workspace menu drop down needs work.

#### Resolved Task <a name="84d3f75d-14dc-4a6b-a9c1-71bbd00d7503"></a> 
Visible checkbox on comment is wrong color.

#### Resolved Task <a name="c293bb08-c18c-4d24-9bec-613dbf0f4c6b"></a> 
Highlight of left nav item must be darker or can't read it - or make everything in it darker.

#### Resolved Task <a name="76688d5e-8b0d-418c-84b9-6b67b4942009"></a> 
Can't get to workspace integration preferences from workspace drop down - even in light mode.

#### Resolved Task <a name="db79b78f-7f22-4ade-abed-8d22e408f225"></a> 
When drag and drop section is high lighting white in dark mode swimlanes.

#### Resolved Task <a name="5118b044-abae-416e-9f9a-dd0c8bbac97a"></a> 
Change colors on identity box - darker in dark mode and darker in light mode too but less.

#### Resolved Task <a name="3e1cd93a-8ee0-4811-899d-57247dc4ca97"></a> 
Get rid of the sidebar border line in dark mode.

## Job <a name="c27ba80a-bc55-45b7-8dae-0bbae049e570"></a>
### Mobile issues.
#### Resolved Task <a name="39bf8c1f-32bc-46a5-a58d-0ecf3ad36233"></a> 
On mobile when open collaborators get white instead of blue.

#### Resolved Task <a name="38481d49-e8b4-4ce3-ba3b-d915f090b07b"></a> 
Details section on mobile needs to default to open.

#### Resolved Task <a name="4b3c9ca4-7326-4271-82de-803ef5e16876"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/da90ff1b-a4ad-482a-bbe7-7db577d17a1f.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Still too much left padding to fit

#### Resolved Task <a name="aad2b51c-2d4f-4b6c-b404-6a59999ae994"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c1fb4684-0181-4398-b875-e2bb38c3ae7b.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




After link option to task and resolve question have weird floating header

#### Resolved Task <a name="acf05f3f-b694-40f7-8cd9-e846823909f4"></a> 
Drop tool bar and drawer on mobile and just do exactly with menu as did for identity (which works on mobile). Make sure the color is okay - there is some weird white.

#### Resolved Task <a name="21c29a24-a2c5-4809-a8cd-4d60de64b362"></a> 
Try again get rid of some of the floaty on mobile. Might be able to repro at intermediate sizes.




This is intermittent and does not repro at intermediate sizes.




**Maybe give AI a crack at it.**

#### Resolved Task <a name="42ce409a-ce4d-468a-ae2a-4a0bf4c5560c"></a> 
Need refresh button since reload doesn’t do refresh necessarily and not obvious. This button should run sync so spinning on and returns error if fails just like anything else.




Put this button on the workspace dropdown - mobile and desktop. Call it "Manual sync".

