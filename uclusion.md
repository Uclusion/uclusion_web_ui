| No Estimate | Estimated | Done |
|--------------|---------------|--------------|
| [Website feedback.](#website-feedback.)| [Import / Export strategy and script.](#import-/-export-strategy-and-script.)| [Python 3.9 end of life - problem is that layers and Lambda runtime must match...](#python-3.9-end-of-life---problem-is-that-layers-and-lambda-runtime-must-match...) |
| | 11-29-2025|  |
| [Should fix bugs.](#should-fix-bugs.)| |  |
| [Button on the question that generates AI prompt onto the clipboard.](#button-on-the-question-that-generates-ai-prompt-onto-the-clipboard.)| |  |
| [See if React now supports a better way to keep a websocket open - otherwise...](#see-if-react-now-supports-a-better-way-to-keep-a-websocket-open---otherwise...)| |  |
| [Mobile issues.](#mobile-issues.)| |  |
## Job
### Website feedback.
From various sources.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/26c15d5b-1c91-4f1d-9c77-12b975ceaaae.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='516' /> 

Update the action.yml to have an check in square icon and a color.

#### Task
YouTube (probably) video showing hooking up and using the CLI after landing on demo.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/2ae68ccb-efdd-48e8-a891-aa13b2b1dd42.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='508' />

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
> ##### Subtask
Put this picture and explanation as first slide under organization tab and drop crappy third slide.

#### Question
## How to sell/explain Github actions feature?




Video won't work as code in Idea, switch to Uclusion to copy job info, paste in commit back in Idea is not sexy.
### Option
### Same three use cases but present like https://www.brkaway.co/ does with their...
Same three use cases but present like <https://www.brkaway.co/> does with their cards of info and pictures.

### Option
### Just close up on the job labels on one side and the Github action simple...
...config to setup on the other. Then same left and right thing for both TODO sync and data export.


#### Task
Fix existing screen shots of planning investible that have this wrong.

#### Task
Show before and after for Github actions issue to show how much better in Uclusion.

1. Open tasks
2. Overview
3. Github issue version
> ##### Subtask
Can use a fade transition to sell this.

#### Task
Add and use release-job action on stage.

#### Task
Check for market place examples from competitors to give a hint.

#### Task
<https://www.brkaway.co/> - very similar to Uclusion maybe can learn from their site. **Note the effort they put into proving that they are specific to their audience:**

1. Asana for creator management
2. Years in the industry before building this solution
3. Explanation of extra features like approvals in terms of the flow they are supporting
4. Their why section better than your comparison section as they maintain they are a whole different product - not apples to apples





**Consider replace comparison with their why section - including copying their widgets. People who innovate are their own market and need a different tool from project management like Asana / Jira (which they hate).**




**Might be able to keep the comparison but have it be lower.**




Everything below the demo button goes in this new section and move changing text below the button 

#### Task
Compare to some of <https://saassy-board.com/leaderboard>

#### Task
Fix point of spear blog. Make this founder to founder - hey trust me style as Ben was mentioning - we're not those guys.

#### Task
Release latest check in to update-job and test with a short code that has a space in it.

#### Task
Do job-label.

#### Task
See <https://www.teamcamp.app/> which doesn't even have pricing on main page - Uclusion landing just not enough sections.




They did video and tabbed pictures (their pictures are larger but that's not better) and click through for details.




Maybe have some larger pictures available from links on comparison? Maybe throw in a video also?

#### Task
[Same three use cases but present like https://www.brkaway.co/ does with their...](/dialog/dd56682c-9920-417b-be46-7a30d41bc905/f577ab3a-9234-4f4d-af83-ed7aa1b25fce#option92b659f9-03c1-4d6c-9f9b-1156ca37c770)




Cases are link job, link code Todo, and export data. Give AI a shot at copy style- make sure set model first and use @




<https://wanderlog.com/> also has features section with a grid of features that can be considered.

#### Task
Setup for the action - needs its own public repository - <https://docs.github.com/en/actions/how-tos/create-and-publish-actions/manage-custom-actions>




Also Readme with instructions etc.

#### Task
Fix mobile images with Shots tool also.

#### Task
Check out what Github did <https://github.com/marketplace/actions/add-to-github-projects>

#### Task
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

#### Task
1. Redo website starting from scratch with asking AI to copy a site - provide the screenshots and video to the AI also. **Actually no need to be so dramatic - can have AI create section by section in classes it creates from scratch.**
2. ~~Move Uclusion to Github Actions~~
3. ~~Expand CLI to allow easily moving tickets to completion based on build reaching production - make this flexible so they can track dev, stage, prod - maybe is already tasks complete and just entering a new label~~
4. CLI and UI as peers on landing page
5. ~~Risk free in pricing section talks about ability to use CLI to export and so not trapped (not price)~~
6. ~~Consider dropping the above the fold subtext altogether.~~
7. ~~Change team price to $5.99 (Teamcamp and Google Workspace are 6) as $1 looks weird~~
> ##### Subtask
Comparison section is too much reading.

#### Task
Toy with shades of grey where have two colors of blue in the main app - again like Teamcamp - to see how does.




**Note Github projects is the same grey and white.**




**The third color for the job nav is jarring so either way it must go - can make it the same as left nav.**

#### Task
Drop the floating Suggestion thing on above the fold.

#### Task
Examine <https://github.com/marketplace/actions/todo-actions>

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8f82d609-4a2b-4a2c-92b6-dc37fa2d9723.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='915' />




List on <https://shipahe.ad/> - maybe can use one of these somehow.

#### Task
Change the demos to include labels for where the completed tasks jobs are - dev, stage, or prod.
> ##### Subtask
Remove usage of label for review from the demo scripts.

#### Task
Need to pay attention to date of commit versus date of current label so don't overwrite.




**Model change - store label_list as string, date pairs and only display the latest. Change API to only add labels not existing already and always add to the existing labels instead of overwriting them.**

#### Task
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

#### Task
Follow <https://docs.github.com/en/actions/how-tos/create-and-publish-actions/publish-in-github-marketplace>

#### Task
Just look at project management verified <https://github.com/marketplace?verification=verified_creator&category=project-management&type=actions>

#### Task
Script for the video:




1. Action that triggers on commit and moves forward jobs based on commit descriptions - **No point in doing this for tasks as no advantage.**
2. Action that triggers on release and creates labels based on commit descriptions.
3. Run the CLI as now if want to update TODOs and Uclusion text files in your repo - **otherwise too messy as would have to update files for you without you getting a chance to stop.**
4. **Also the export runs from command line - can just show the CSV file it produces if don't want to wait for it in real time.**





**That's already a long movie so have to skip the demo part and just show what was already setup working. Include the files that make it work to show simple.**

#### Task
Examine <https://github.com/marketplace/actions/attach-pull-request-to-asana-task> which is marked verified by Github - also useless similar to below




<https://github.com/marketplace/actions/add-comment-to-asana-task> - official Asana but is about pull request notifications to collaborators - fairly useless as you can do this in Github better

#### Task
Under collaboration tab on landing page the blocking screenshot is too large - include more of the tab on etc. to make reasonable size.

#### Task
Integrations should be open by default for a real market - just not for support or demo.
> ##### Subtask
 State should be dependent on market id. True for Views and Collaborators folders also.

#### Task
Fix margins at intermediate sizes.

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/aeb957b7-e349-40aa-8ea2-7255b9882949.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='544' />
> ##### Subtask
Mobile also needs margins.

#### Task
Problem: if it's the last task do you have to put job and task in commit? 




Problem: if you show copy task by clicking number and putting into commit isn't that awkward enough to mess up the video? **Could have just hit resolve at this point - then the only real advantage is the labels that show the release? - though that is cool.**

#### Task
Try out Zenhub.

#### Task
Drop the Organization tab diagram or figure out a way to make it nice or something.
> ##### Subtask
See if can do an animation to show the logical data model. Maybe even Powerpoint can handle it. 

#### Task
S**top using labels for showing progress report** (which is dumb anyway). Use comment as done with in progress task.
> ##### Subtask
There will also have to be activity logs / labels for each comment that display below them.

#### Task
UI important cause Github bugs already has all of this <https://timheuer.com/blog/use-github-actions-for-bulk-resolve-issues/>




So have to look very hard at why a maker shouldn't just use Github projects.




**Try using them yourself on developer stuff repo and see how goes.** <https://github.com/orgs/Uclusion/projects/2> **Also see if can use straight issues on a private repo.**




Github projects and built in like Zenhub are the competition for single user - see comparison section there <https://www.zenhub.com/> and maybe redo ours to be more like that.

#### Task
Either like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/704cb9f6-8e30-44c6-9aea-122ad3c536b1.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

or like this:

![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/5558150b-5bdc-4232-a915-bbb520b34a66.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)

Search for term Chromium window and make the above the fold screenshots use them.
> ##### Subtask
Use <https://shots.so/> with Chrome, 3:2, url production.uclusion.com, background the same as landing page, and crop screenshot from that of 1647:936 size.

#### Task
Explain only goes as far back as tasks complete age show in readme and docs.




**Link the docs into the readme in the Github actions. Make sure form of commit message obvious and that can click button to get.**

#### Task
Easy to have action on initial commit that resolves the task or job. Not easy to know which commits are in a release. According to AI "github actions know all commits in a release" - you have to know the previous release and then find all commits between that release and the one being promoted. In this case you search all since that release **assuming that is cheaper than just searching all for ticket codes. Cause finding the previous release for a particular environment requires some searching also.**




**Teamcamp got around this by using the release description only but that is lame.**




**There is all sorts of stuff like this in Github actions** <https://github.com/WyriHaximus/github-action-get-previous-tag> so let them worry about it though you can of course give an example from what Uclusion does.




Then just 

# List commits between the previous release and the current release tag

git log --pretty=format:"%h - %s" $PREVIOUS_RELEASE_TAG..${{ github.event.release.tag_name }}




and search that for ticket codes.

#### Task
Make the link one button and the short code display a different button and have the latter put in a full commit description with job name and short code. **Remove or escape any " marks.**

#### Task
Fix documention.


## Job
### Import / Export strategy and script.
Users for this feature:

1. Need export not to be locked in
2. ~~Want to work mostly in their Idea~~ - if you finish a task then commit and then you have to refresh with CLI and then the task is gone - that's a ridiculous flow and no upside really as can't put in progress etc.
3. ~~Like having AI suck in this meta info~~ - for what? and could use a button that removes or not removes pictures from Uclusion anyway
4. Want to check in this file and provide status or get feedback that way instead of inviting an observer to Uclusion - for team they would choose some team view. -<https://mui.com/material-ui/discover-more/roadmap/> - so they do in fact share their project board <https://github.com/orgs/mui/projects/23/views/12> does this feature give us parity with that?





See <https://github.github.com/gfm/> for the Github version of markdown.

#### Task
Votes are 




    > ##### $${\color{red} Reason \space For}$$




or Against with color based on certainty - red, orange, yellow, light green, green.
> ##### Subtask
Grab all votes so that can display those without reasons. If no reason just say For or Against colored and don't say reason.

#### Task
Github Markdown supports img tags with width specified - see test file.

#### Task
**Actually have view level which defaults to public and job which defaults to view setting for anything on status page (assigned or assistance) and false for anything not, bug which defaults to false, and discussion which defaults to false.**




View level only applies to what is strictly in that view - not what is displaying in a my work.

#### Task
Add to example comment with one thing from all of format bar and make sure translates.

#### Task
Use with david view on stage and link resulting checked in to uclusion_web_ui repo md file in blog and docs.

#### Task
Try out <https://pypi.org/project/html-to-markdown/> locally with examples grabbed from dev Dynamodb.

#### Task
Use <https://pypi.org/project/html-to-markdown/> or equivalent. Conversion seems the least of coding this feature.




html-to-markdown does all versions of Python and simple [API](https://github.com/Goldziher/html-to-markdown/blob/6f9d36bfea65bb124116a067b43ffb87aeaf6f5d/packages/python/html_to_markdown/api.py#L4) but seems doesn't do HTML fragments but that probably doesn't matter - does help keep image urls instead of trying to convert to text.
> ##### Subtask
Choose from one of the one's mentioned in that libraries introduction <https://www.reddit.com/r/Python/comments/1igtrtp/htmltomarkdown_12_modern_html_to_markdown/>  




<https://pypi.org/project/markdownify/> - doesn't support Python 3.9




<https://pypi.org/project/markitdown/> - super supported by Microsoft but <https://dev.to/leapcell/deep-dive-into-microsoft-markitdown-4if5> trying to convert images to text which we don't need

#### Task
How will the queries be done to gather the necessary jobs and comments?




Use the market_id_index jobs, market comments. and stages and calculate what is visible. Then for those visible need follow on stuff like job comments, inline_market_id, approvals, and maybe stuff inside comments that resolve like mentions and internal links.




So the market service endpoint handles everything it can.

#### Task
On CLI integration page correct the examples etc.




Plus viewId should be todoViewId as not used otherwise.

#### Task
CANNOT LET THEM EDIT THE UCLUSION MD FILE. 

1. Incompatible with marking in progress, resolving etc.
2. We don't even support MD in Uclusion and would have to convert both directions
3. Too high a chance of corrupting the file - plus have to learn some notation language like with TODOs





So it is one way export and even for that **must convert from Uclusion html to markdown in API endpoint that services the export.** Might be a html to markdown converter in Python already for simple html.




Any md file in Github displays as md <https://github.com/Uclusion/uclusion_web_ui/blob/master/uclusion.md>
> ##### Subtask
Do we keep current uclusion.txt file? No reason not to as already coded and does not interfere with export.




However very confusing on sync - even I had to look at code and operations - consider dropping. Since it's not like a TODO there is no real reason to support them editing this file - if it isn't better to go to Uclusion than edit the local file we are done anyway.




**Keeping it just for the purposes of creation and stay in repo is dumb. Anything really repo related goes into a TODO and even then you edit on the Uclusion side. Anything higher level than the code has no point in being edited in the repo as Uclusion wizards do a much better job.**

#### Task
Tell that story on the landing page new section - **in that story mention have the entire file there for use by AI.**




**To be useful by AI either do two files, one active and one archived, or just only keep active in the repo unless the full export flag is used.**

#### Task
If can't find built in md manipulation can do server side or use a command line script like <https://python-markdown.github.io/cli/>

 

**Actually just have installer -** <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html> which is downloaded from the same integration page and run with the same steps as AWS CLI shows. That's going to be simpler all around and the added benefit of being allowed packages.




**Actually just run as Github action and drop the CLI altogether.** Otherwise <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-prereqs.html> - have to be self contained and support Linux, Mac, and Windows - too much effort. The action runs on any push to the repo and does a sync. **The only problem is that then they need pull to get the changed files - not great.**




**Third alternative - keep existing CLI, don't have installer, and just do all heavy lifting to create the MD file server side. That means you upload the existing one and get back the new one. For the TODO part it just works exactly as now.**




Keep the full export as separate from merge - maybe only get the archived ones for instance.




ALSO THIS IS ALL VIEW SPECIFIC - you are downloading from your my work view. THE FULL EXPORT OF ALL VIEWS IS YET ANOTHER FLAG.
> ##### Subtask
If CLI based then order of operations problem. You check in with the latest job ticket code and then run the Uclusion CLI and then you have to commit again to get the MD file in.




**Maybe the Uclusion CLI checks in the MD file for you? MAYBE NO NEED - the file can be restored at any time by CLI - could just add it to your .ignore. If you want it checked in so visible on repo you can do that yourself.**

#### Task
Create an endpoint for the export / report.

#### Task
Separate endpoint that just paginates through all jobs and market level comments in a workspace.
> ##### Subtask
No meta information is exported except title of job. Even replies are flattened - job comments are just in retrieval order.

#### Task
Labels appear in green on the contents report at start (or if not there then with job).

#### Task
If there is a way to setup the Uclusion CLI as a post commit script in major Ideas then that can be done **INSTEAD** of setting up update-job.

#### Task
This endpoint powered by a third endpoint that retrieves all job and market level comment IDs in a workspace.

#### Task
Is exporting only one view necessary / desirable? Sure you want to control the views exported but why not a list of them? Since the ticket codes are unique to the whole workspace why limit the export to one view? Plus better integrations view if you check box what will be exported.




For TODOs you can choose what view to create them in and that gets stored in the uclusion.json settings. 

 

So viewIds and todoViewId in json. **These are strict so including your my work doesn't export from other views - you have to list them as only if the view the job is in is exported does it show in export.**

#### Task
Since the md file is not for edit why md? Self contained HTML could still be checked in but also has the advantage that one could put it on any server - not just one that translates MD as Github does.




Of course if for some reason the report did need to be edited it would be very difficult in HTML but that would not be a common case as no one wants to edit on a regular basis to make the status work.




On the other hand Jekyll takes HTML or Markdown and you need a static generator running anyway <https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll> - so maybe Markdown is the better choice?




Have to stick with Markdown as Github only accepts it.

#### Task
Add SDK to the documentation with small example that exports planning investibles and their comments and bugs. Example should work from CLI secret login.




**Can keep the download example in the SDK so can be maintained and linked as readable Javascript.**
> ##### Subtask
Convert publish in uclusion_sdk to Github actions and publish to NPM.

#### Task
**Now with this feature can update the update-job action to accept comment ticket codes also as they can get them from this file.**

#### Task
Update layers with html-to-markdown.

#### Task
In the md file have a table of contents by stage at the beginning with links to the stories below. In that table can mimic the job progress page in Uclusion by having number open, how long in stage, etc. just like it does.




See <https://blog.markdowntools.com/posts/markdown-internal-links>
> ##### Subtask
Decide on format in md file. No assignments obviously since that shouldn't matter. Yes show labels.




Three stages - No Estimate, Scheduled, and Done. Scheduled have the only date that shows which is estimated completion.




Table with 3 columns. Each column has the name of the job which is a link to lower in the markdown file. Directly the below the name of the scheduled is the estimated date. Directly below the name of the done is the label if any.

#### Task
Remove current uclusion.txt in place of this read only md file.

#### Task
Have replies immediately follow the parent and put a > in front of them.

#### Task
In documentation explain how to use views and is public so that only what you want to show displays.

#### Task
Port code in ImageBlot.js to Python and process images as it shows. That requires using get_market_token <https://github.com/Uclusion/uclusion_common/blob/dc0064ddf8b5467c76392769e9977ab701180b5b/ucommon/capabilities/capability_marshaller.py#L71> and either setting up exp to years or remove exp if can get away with that.

#### Issue
You kind of are data locked in and exporting doesn't help. Just no good way to map between systems. Unstructured comments in Github have nowhere to go unless put them all in description or introduce info for planning investible as have for options. **Even if do that still have problem if users aren't all there.**




Monday has [import from Jira](https://support.monday.com/hc/en-us/articles/360020585839-How-to-import-from-Jira-Server) and their new Jira data center app has two way sync. However its all Enterprise stuff.




Is there much difference between throwing all issues into Uclusion backlog and having them over in Github till working on them?

#### Task
Reason comments must be out of general pool and put as element of job, option, or suggestion. Suggestion should not have an option shipped with it.

#### Task
Then do we include recently competed as do on status page? If so makes harder to suck into AI or does it? Depends what AI does with it or if it observes complete stage.


## Job
### Should fix bugs.

#### Task
For you menu must show search results when has them and not anything when doesn't and search.




Sidebar menus must open when have search results.

#### Task
Count color not on bugs or backlog lists 

#### Task
Add and another does not clear if had previous draft task

1. Create a draft task so see pencil icon
2. Go back and edit it
3. Create and another has former draft

#### Task
After go to view from job action, go to the my work view if the user has one.

#### Task
Link from comment in subtask wizard, and presumably others, goes to the comment but does not turn yellow. There was a flag for turning off the yellow but absolutely currently no reason to use such a thing - see if can fix so yellows correctly.




Actually turning yellow broken for link from ticket code and inbox also - seems just broken.

#### Task
Remove going to individual not new notifications other than critical bugs and outbox from navigation button. 




Navigation will go to one of four places:

1. New notifications expanded
2. A critical bug notification
3. Swimlanes of all views that is member of
4. In progress tasks in assigned jobs

#### Task
When resolve minor but on return arrive in critical bugs section.




Also happening when move a bug to a job from a non critical section.

#### Task
Simplify views.
> ##### Subtask
Remove going to individual not new notifications other than critical bugs and outbox from navigation button. 




Navigation will go to one of four places:

1. New notifications expanded
2. A critical bug notification
3. Swimlanes of all views that is member of
4. In progress tasks in assigned jobs
> ##### Subtask
When choose add peers get this:

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/f8ed40e6-f4f2-465a-af22-e956e251d543.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='246' />

That's too confusing - second step in the wizard has to ask if the people you are adding are on the same team or observers. If same team just create new named view and if not then automatically create autonomous view.




**That means can't create the workspace till know as there must be at least one view.**




**================**




<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/e5bf8cf9-020c-49d7-81ae-e8f3c85af7a6.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='550' />




This above is too confusing. How about just two choices "Single person view" or "Team view". Sub-text explains that a workspace must have at least one view. If choose team view you name it yourself with sub-text that explains what a view is - the finish button there creates the workspace.
> ##### Subtask
Remove view link to documentation and make collapsible section like all the rest and have collapsed by default when there is only one view.




**J**ust drop the whole weird sidebar language and do as one thing.
> ##### Subtask
Remove explanation of views from intro to workspace screens.
> ##### Subtask
Make solo demo single view only.

#### Task
Check box on tasks overview is red instead of green.

#### Task
From context menu can send an unassigned job to tasks complete without assigning it or resolving tasks - even though am only person in workspace.

#### Task
On the overview of a job the number of resolved tasks should be a plain number instead of inside an orange chip.

#### Task
Verify on production that no scroll bar on switch workspace even with many workspaces.

#### Task
If drag job with open suggestion to Work Ready and choose Make Task then just spins forever and no action taken.




*Unable to repro any of this.*
> ##### Subtask
If have reply on that suggestion then after make the suggestion a task and put it in progress and put reply in progress, the reply disappears.

#### Task
Remove view link to documentation and make collapsible section like all the rest and have collapsed by default when there is only one view.




**J**ust drop the whole weird sidebar language and do as one thing.

#### Task
![](https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/80873630-89de-4414-8a96-9aad0098400c.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw)




Don't display the view name in ticket code. It already displays on right nav under View and on left nav if in that view.

#### Task
Put in debug log statements to figure out when search bar is re-rendering and flickering. Related to [Must fix bugs. - T-all-7](/dialog/dd56682c-9920-417b-be46-7a30d41bc905/5e334c85-8406-4287-9ad8-68af88687446#c3671e2b8-0876-4e90-921c-49c1144345ad) ?
> ##### Subtask
Redo presentation of offline and have timer on it. See Gmail example - not nearly as big a message. Can simulate offline in Chrome devtools.

#### Task
No up arrow when do search.

#### Task
Remove explanation of views from intro to workspace screens.

#### Task
Notes are somehow following the progress report logic and only showing the latest one - possibly even resolving older ones.

#### Task
Don't show poke icon on resolved comments.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/d06b3c63-0d12-4bb7-ac65-aa3577f134b8.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='416' />




Make In progress left most on both parent and child. Drop date on child - parent doesn't have both so why should it.

#### Task
Make solo demo single view only.

#### Task
Reply linking icon is in corner but for comment is in middle. Too confusing. Probably reply one should move to middle cause as it is looks like the avatar for the name which it isn't.
> ##### Subtask
For the jobs overview expansion the linker is to the right and nothing is on the left.

#### Task
All empty text in support workspace must be support specific.

#### Task
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/36d21323-4f19-49d3-94e0-a52b3473f1c2.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='849' />




Here have both the expand circle and the chevron to expand. So the collapsed comment should be blue and should link back to the comment instead of uncollapsing - except if hit chevron of course.

#### Task
Colors have to match the status screen - red for new and orange for not.

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8ac27cc5-e4af-40f1-ab1d-8745c7c31a73.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='743' />




If orange doesn't work then change it in both places but must match - no new colors for the same info.

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

#### Task
Have an upgrade script that removes all notifications associated with unused older demo versions.




**Or maybe just fully cleans them up as the script that does that cleans up a planning market (including notifications) should exist.**


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

