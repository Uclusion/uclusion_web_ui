| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| [Build the prompts necessary to get the lastest debuts from Show HN, Product...](#ea70be12-ff47-4e5c-b4cd-013e8415d18a)| 02/11| [Should fix UI bugs.](#3af2201b-8111-46e9-b746-2f33cf1312bd)| Deployed to production |
| [Anything with tabs or left side panel now has different look - including the...](#9d810e3e-9f32-4f1b-b377-13aebd8fbb64)| | | [Dark mode for app](#effdb67c-5825-421b-a298-48770945da5f)| Deployed to production |
| [Button on the question that generates AI prompt onto the clipboard.](#436e8e41-b8c4-4c73-8818-4d563a81ca44)| | | [Substitute for the comparison section,](#283ed39c-2e32-4d70-9c99-a9aef975439a)|  |
| | | | [Organization section needs work.](#bffa8a04-9a95-4a38-b477-14171fb76464)|  |
| | | | [Mobile issues.](#c27ba80a-bc55-45b7-8dae-0bbae049e570)| Deployed to production |
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

## Job <a name="9d810e3e-9f32-4f1b-b377-13aebd8fbb64"></a>
### Anything with tabs or left side panel now has different look - including the...
...shot of estimating in messages section above the fold.

#### Task <a name="a495ccb2-6d43-41d3-8c76-8d8b5741a4ae"></a> 
Anything with tabs or left side panel now has different look - including the shot of estimating in messages section above the fold.

## Job <a name="436e8e41-b8c4-4c73-8818-4d563a81ca44"></a>
### Button on the question that generates AI prompt onto the clipboard.
Probably skipping pictures and file attachments.

#### Task <a name="17c54d09-22e8-4b03-a8bf-f59463c1ab1b"></a> 
This button should produce markdown as <https://github.com/microsoft/markitdown> claims it is native to LLMs. Furthermore need the same markdown with token included image URLs that getting for public status report.

#### Task <a name="c37e86d4-1efc-4dea-ae23-1fd0171f3175"></a> 
Button on the question that generates AI prompt onto the clipboard. Probably skipping pictures and file attachments.

## Job <a name="3af2201b-8111-46e9-b746-2f33cf1312bd"></a>
### Should fix UI bugs.
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

> ##### Grouped task <a name="b85b71e3-3eb8-4b69-9d35-1c486b2101ed"></a> 
Remove going to individual not new notifications other than critical bugs and outbox from navigation button.




Navigation will go to one of four places:

1. New notifications expanded
2. A critical bug notification
3. Swimlanes of all views that is member of
4. In progress tasks in assigned jobs

> ##### Grouped task <a name="2d774af4-91ba-41a1-8b46-c5185eac71ed"></a> 
When choose add peers get this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/f8ed40e6-f4f2-465a-af22-e956e251d543.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

That's too confusing - second step in the wizard has to ask if the people you are adding are on the same team or observers. If same team just create new named view and if not then automatically create autonomous view.




**That means can't create the workspace till know as there must be at least one view.**




**================**




![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e5bf8cf9-020c-49d7-81ae-e8f3c85af7a6.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




This above is too confusing. How about just two choices "Single person view" or "Team view". Sub-text explains that a workspace must have at least one view. If choose team view you name it yourself with sub-text that explains what a view is - the finish button there creates the workspace.

> ##### Grouped task <a name="395caf80-2822-43fd-ae11-1a4ca6b17957"></a> 
Remove view link to documentation and make collapsible section like all the rest and have collapsed by default when there is only one view.




**J**ust drop the whole weird sidebar language and do as one thing.

> ##### Grouped task <a name="3e5e867f-97a0-4156-93d1-ba8dbe4319a9"></a> 
Remove explanation of views from intro to workspace screens.

> ##### Grouped task <a name="6cff6d27-fbd1-455e-a1ab-4ad8aeb59e1b"></a> 
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

> ##### Grouped task <a name="528c8325-07e1-4366-9b2c-9d2ffcdf4a83"></a> 
If have reply on that suggestion then after make the suggestion a task and put it in progress and put reply in progress, the reply disappears.

#### Resolved Task <a name="395caf80-2822-43fd-ae11-1a4ca6b17957"></a> 
Remove view link to documentation and make collapsible section like all the rest and have collapsed by default when there is only one view.




**J**ust drop the whole weird sidebar language and do as one thing.

#### Resolved Task <a name="1e78582a-7193-4907-b060-85dad860e25a"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/80873630-89de-4414-8a96-9aad0098400c.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Don't display the view name in ticket code. It already displays on right nav under View and on left nav if in that view.

#### Resolved Task <a name="1ba98476-cd57-40f9-af2e-be2cacea2d05"></a> 
Put in debug log statements to figure out when search bar is re-rendering and flickering. Related to Must fix bugs. - T-all-7 ?

> ##### Grouped task <a name="2e922336-b81d-49cb-853a-0e7f89942d95"></a> 
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

#### Resolved Task <a name="87d078c7-9375-412a-9367-fb7509a8adc3"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/65826b2f-930a-42a1-863e-c24890e7db47.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Tab extends beyond rows weirdly.

#### Resolved Task <a name="c3fec27e-6465-4b09-b299-b4205f34d957"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/d06b3c63-0d12-4bb7-ac65-aa3577f134b8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Make In progress left most on both parent and child. Drop date on child - parent doesn't have both so why should it.

#### Resolved Task <a name="6cff6d27-fbd1-455e-a1ab-4ad8aeb59e1b"></a> 
Make solo demo single view only.

#### Resolved Task <a name="8a4ee34b-6a80-4aa0-bfed-49825d42f892"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/c047efba-47bc-4389-8a4f-858fa4f06772.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Counts don't add up - 7 - 5 = 2 missing.

#### Resolved Task <a name="f9ce3d3e-7db4-42f6-9872-66a03e5e1729"></a> 
Make the search bar look more standard - use AI if necessary.

#### Resolved Task <a name="83af94b4-f765-4d25-bf40-c87c0eda20ac"></a> 
When search resolved tasks must display on tasks page as well so that search works. Currently it shows resolved found as on tasks page but nothing there.




During search either show both resolved and unresolved on tasks page or one on the other respectively and nail up resolved tab on overview.




Actually do the former - when searching doesn't matter resolved or not and not many will display.

#### Resolved Task <a name="da760056-b86d-42ef-b830-97d1f17019b9"></a> 
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/102fb8cb-439c-470d-bf57-02c62b3dae35.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




In a team view so should have Add with voting button available. **Plus errors out if hit Configure voting button.**

#### Resolved Task <a name="cb34dbe5-e22d-46aa-99f8-232cb75191ca"></a> 
Reply linking icon is in corner but for comment is in middle. Too confusing. Probably reply one should move to middle cause as it is looks like the avatar for the name which it isn't.

> ##### Grouped task <a name="dd255c52-1d03-4c52-bc58-9abb4f2c2145"></a> 
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

## Job <a name="effdb67c-5825-421b-a298-48770945da5f"></a>
### Dark mode for app
Have to have it and doesn't seem like that hard to do. Just make the background colors come out of the theme and have setting to change theme to dark.




Does seem to also work off of a signal from OS as some things in browser go dark when use dark on OS.

#### Resolved Task <a name="05da9aa2-de7e-4b6d-84ee-a74babb69de1"></a> 
MenuLists need work - inbox, bugs, backlog, options, etc.

#### Resolved Task <a name="9ef67ef5-439f-4fd2-bbc7-744452fc4b4e"></a> 
Check dark mode when chips.




Use dark mode on stage for a while.

#### Resolved Task <a name="76e4cad8-390e-4c55-911a-4544b795f380"></a> 
Fix user preferences.

#### Resolved Task <a name="aef1d487-32cc-4aec-b8b7-0c89f29b1081"></a> 
Fix all the wizards.

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

#### Resolved Task <a name="017a1dc8-edaa-4ce6-9e9a-5fac9f54d477"></a> 
Workspace menu drop down needs work.

#### Resolved Task <a name="84d3f75d-14dc-4a6b-a9c1-71bbd00d7503"></a> 
Visible checkbox on comment is wrong color.

#### Resolved Task <a name="c293bb08-c18c-4d24-9bec-613dbf0f4c6b"></a> 
Highlight of left nav item must be darker or can't read it - or make everything in it darker.

#### Resolved Task <a name="76688d5e-8b0d-418c-84b9-6b67b4942009"></a> 
Can't get to workspace integration preferences from workspace drop down - even in light mode.

#### Resolved Task <a name="3e1cd93a-8ee0-4811-899d-57247dc4ca97"></a> 
Get rid of the sidebar border line in dark mode.

## Job <a name="283ed39c-2e32-4d70-9c99-a9aef975439a"></a>
### Substitute for the comparison section,

#### Resolved Task <a name="6d550fb7-e7d7-4985-bd2b-75ca88df6f2e"></a> 
See if can find substitute for the comparison section or way to make it reasonable - get kid's help.




Video explaining in progress/ navigation / subtask is possible.

## Job <a name="bffa8a04-9a95-4a38-b477-14171fb76464"></a>
### Organization section needs work.
Only the first picture should remain and even that might not be first. Bugs and backlog need pictures and backlog shows in assistance - show or explain that somehow.

#### Resolved Task <a name="1a051204-930b-4117-b22b-57011239af31"></a> 
Show close up of assistance section and context menu on something in backlog showing that you can move to Not Ready - that also shows stages.

#### Resolved Task <a name="347b4083-564f-4865-aa98-5ffd973fc01f"></a> 
Show bugs and explain they can be moved back and forth from jobs.

#### Resolved Task <a name="0ab02d42-364a-45b9-9e22-b4264d7185b5"></a> 
No reason not to add a plus sign next to tasks so that can create from there.

#### Resolved Task <a name="5c9637a6-b94c-4a16-9aea-fe8bcc4d2cc0"></a> 
Do the full context menu even if in swimlanes - no reason not to and now no stage header.

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

