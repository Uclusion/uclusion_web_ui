| No Estimate | Estimated | | Done | |
|--------------|---------------|--------------|--------------|--------------|
| [Better archive.](#f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f)| | | [Fix documentation for CLI - code todos, report markdown, and export.](#310a063e-441f-4412-9d89-0b07f8fc4627)| Deployed to production |
| [Button on the question that generates AI prompt onto the clipboard.](#436e8e41-b8c4-4c73-8818-4d563a81ca44)| | | [Python 3.9 end of life - problem is that layers and Lambda runtime must match...](#d7c2f7ff-b9b2-4241-8fc7-e724d6a544ec)| Deployed to production |
| | | | [CLI TODO fixes](#927f8039-c23a-427e-86e6-2f40100adc33)| Deployed to production |
| | | | [Website feedback.](#f577ab3a-9234-4f4d-af83-ed7aa1b25fce)|  |
| | | | [Import / Export strategy and script.](#8c6374e6-2b2c-4b08-abdd-b6bec66c4f69)| Deployed to production |
| | | | [See if React now supports a better way to keep a websocket open - otherwise...](#0119ab37-b6ed-432e-a05b-5a91e8e02393)| Deployed to production |
## Job <a name="f7a8e7eb-1fbf-4c5a-84cb-0a9a99acc66f"></a>
### Better archive.



1. Move archive to left nav and make it per workspace
2. Add a group drop down
3. Split out objects in tabs - Tasks Complete, Not Doing, Bugs, Discussion

#### Task <a name="bf1d3f46-f7ab-4213-8b02-81fb4af34e5b"></a> 
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8120554f-18cb-4c1f-900a-966cb2d9bd8e.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='384' />

Some freaky text stuck in corner - only on stage. Also double scroll bars doing nothing.

#### Task <a name="05c06cda-1c40-470a-8ca1-46d414a03d21"></a> 
Add to solo demo archived stuff in all categories so can test.

#### Task <a name="7d5d5a86-51c4-426d-a0cb-e8ffe45f5250"></a> 
Show tasks complete as paginated rows as with backlog.

#### Task <a name="dddc34c9-9309-4cd4-b112-8fd30e4e9106"></a> 
Also need counts from search on other views for anything not showing in the current view (when autonomous).

#### Task <a name="2fcd674f-7c8d-46cf-85e8-6f10a428863c"></a> 
Change sub text on archive to say archive instead of group archive.

## Job <a name="436e8e41-b8c4-4c73-8818-4d563a81ca44"></a>
### Button on the question that generates AI prompt onto the clipboard.
Probably skipping pictures and file attachments.

#### Task <a name="17c54d09-22e8-4b03-a8bf-f59463c1ab1b"></a> 
This button should produce markdown as <https://github.com/microsoft/markitdown> claims it is native to LLMs. Furthermore need the same markdown with token included image URLs that getting for public status report.

#### Task <a name="c37e86d4-1efc-4dea-ae23-1fd0171f3175"></a> 
Button on the question that generates AI prompt onto the clipboard. Probably skipping pictures and file attachments.

## Job <a name="310a063e-441f-4412-9d89-0b07f8fc4627"></a>
### Fix documentation for CLI - code todos, report markdown, and export.
#### Resolved Task <a name="0e75a3a0-c66b-442f-b858-f8edc756f4c4"></a> 
In documentation explain how to use views and is public so that only what you want to show displays.

## Job <a name="d7c2f7ff-b9b2-4241-8fc7-e724d6a544ec"></a>
### Python 3.9 end of life - problem is that layers and Lambda runtime must match...
...so seems all or nothing.




html-to-markdown requires 3.10.

## Job <a name="927f8039-c23a-427e-86e6-2f40100adc33"></a>
### CLI TODO fixes

#### Resolved Task <a name="924bc822-4905-4010-891a-0f8b549ea77c"></a> 
Have drop down for view selection on IntegrationPreferences.js. Just copy the one done for job side panel.

#### Resolved Task <a name="c500e9fb-9bb2-4494-acb6-4a7802ddddeb"></a> 
📁 Processing directory: './src'




-> ❌ Error reading file uclusionCLI.py: argument of type 'NoneType' is not iterable




-> ❌ Error reading file IntegrationPreferences.js: argument of type 'NoneType' is not iterable










get_resolved_ticket_codes is stupid. Collect up all ticket codes that are active in the code files and then send all at once to find out their current state.




Forget unresolving on Uclusion side and re-opening on code side - not supported - **and say so in documentation.** Make sure to handle even if created one is deleted.




Plus the current API is not even working:

    9-4579-9346-13e84d5ec4d9        <class 'KeyError'>

    Traceback (most recent call last):

      File "/opt/python/lib/python3.10/site-packages/ucommon/handlers/abstract_request_handler.py", line 40, in handle_request

        response = post_validation_function(event, data, context, validation_context)

      File "/var/task/handlers/list_market.py", line 26, in post_validation_function

        return list_ticket_codes(event, data, context, validation_context)

      File "/var/task/handlers/list_market_operations/list_ticket_codes.py", line 14, in list_ticket_codes

        ticket_codes.append(partial_comment['ticket_code'])

    KeyError: 'ticket_code'

#### Resolved Task <a name="97cda397-c1d8-4c6d-86e6-c074ba07438a"></a> 
On CLI integration page correct the examples etc.

#### Resolved Task <a name="b8f4db01-db8f-4514-8ee2-bc63dfd7921f"></a> 
Documentation does not mention marking done or removing on code side to resolve on Uclusion side.




Either explain doesn't work or make work. Probably don't support as wouldn't know what going on with Uclusion side.

> ##### Subtask <a name="f7dbb92c-e987-40f3-93df-3f59e8fdfffd"></a> 
If don't support then




    A script syncs between Uclusion bugs and jobs and code TODOs.




should be changed to one direction.

#### Resolved Task <a name="c2942d6c-e41f-4e46-bd8a-54756cb7e542"></a> 
viewId should be todoViewId as not used otherwise.

## Job <a name="f577ab3a-9234-4f4d-af83-ed7aa1b25fce"></a>
### Website feedback.
From various sources.

#### Resolved Task <a name="782226dd-97a6-4dcd-9dd7-72dbcb6b91b7"></a> 
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/26c15d5b-1c91-4f1d-9c77-12b975ceaaae.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='516' /> 

Update the action.yml to have an check in square icon and a color.

#### Resolved Task <a name="2ff102c0-8ae7-4fc0-a09d-5983ee734724"></a> 
YouTube (probably) video showing hooking up and using the CLI after landing on demo.

#### Resolved Task <a name="20e6df71-e029-4236-a8f3-2d599bfbf099"></a> 
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

> ##### Subtask <a name="21c4d986-5984-4107-8413-88c02a8af0cd"></a> 
Put this picture and explanation as first slide under organization tab and drop crappy third slide.

#### Resolved Question <a name="af1c0020-7d85-40c3-8bc1-5a2932114d33"></a> 
## How to sell/explain Github actions feature?




Video won't work as code in Idea, switch to Uclusion to copy job info, paste in commit back in Idea is not sexy.

### Option
### Same three use cases but present like https://www.brkaway.co/ does with their...
Same three use cases but present like <https://www.brkaway.co/> does with their cards of info and pictures.

### Option
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
<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/8f82d609-4a2b-4a2c-92b6-dc37fa2d9723.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='915' />




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

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/aeb957b7-e349-40aa-8ea2-7255b9882949.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='544' />

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

<img src='https://stage.imagecdn.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/65f894a5-33f2-470b-a2ee-cf548acf61b7.png?authorization=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoibWFya2V0IiwiaWQiOiJkZDU2NjgyYy05OTIwLTQxN2ItYmU0Ni03YTMwZDQxYmM5MDUifQ.6eorgEPjCeaeDMJJ_FuHFK62keGbS2c87bH7hamwTUw' alt='' title='' width='1176' />




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

## Job <a name="8c6374e6-2b2c-4b08-abdd-b6bec66c4f69"></a>
### Import / Export strategy and script.
Users for this feature:

1. Need export not to be locked in
2. ~~Want to work mostly in their Idea~~ - if you finish a task then commit and then you have to refresh with CLI and then the task is gone - that's a ridiculous flow and no upside really as can't put in progress etc.
3. ~~Like having AI suck in this meta info~~ - for what? and could use a button that removes or not removes pictures from Uclusion anyway
4. Want to check in this file and provide status or get feedback that way instead of inviting an observer to Uclusion - for team they would choose some team view. -<https://mui.com/material-ui/discover-more/roadmap/> - so they do in fact share their project board <https://github.com/orgs/mui/projects/23/views/12> does this feature give us parity with that?





See <https://github.github.com/gfm/> for the Github version of markdown.

#### Resolved Task <a name="d20d3237-684f-44c6-bd41-b9469c7dee2d"></a> 
Votes are 




    > ##### $${\color{red} Reason \space For}$$




or Against with color based on certainty - red, orange, yellow, light green, green.

> ##### Subtask <a name="e1bdab6f-b103-477c-a3fd-28065b303feb"></a> 
Grab all votes so that can display those without reasons. If no reason just say For or Against colored and don't say reason.

#### Resolved Task <a name="bb5819cd-1edc-47a2-a419-85d10f80feb9"></a> 
Github Markdown supports img tags with width specified - see test file.

#### Resolved Task <a name="8a69404f-ca30-4c27-a202-23ce8e3b23dc"></a> 
**Actually have view level which defaults to public and job which defaults to view setting for anything on status page (assigned or assistance) and false for anything not, bug which defaults to false, and discussion which defaults to false.**




View level only applies to what is strictly in that view - not what is displaying in a my work.

#### Resolved Task <a name="b734c616-8e5d-4aab-89e7-2ddc570c5aa0"></a> 
Add to example comment with one thing from all of format bar and make sure translates.

#### Resolved Task <a name="1909aced-5d89-4f29-831f-b01630209613"></a> 
Use with david view on stage and link resulting checked in to uclusion_web_ui repo md file in blog and docs.

#### Resolved Task <a name="89fa9a13-5168-4523-8cba-842dd71eb738"></a> 
If report screen out resolved tasks but if export include them.

#### Resolved Task <a name="0070e397-8501-4eae-9dab-1041c94c27b8"></a> 
Try out <https://pypi.org/project/html-to-markdown/> locally with examples grabbed from dev Dynamodb.

#### Resolved Task <a name="d3c24854-7403-4aa5-b4e8-c08b4f8c8ab9"></a> 
Have to be able to add a label from the UI cause could have multiple repos or just forget to check in with ticket code.




The label input shows up only in done and is always to create a new label from scratch - no edit. So call it "New label" and it always shows even when there is a label. 




Which means show label also on side panel as always should have - plenty of room.

#### Resolved Task <a name="cad2faeb-a7c5-4d93-80a4-7536045b3cdf"></a> 
Use <https://pypi.org/project/html-to-markdown/> or equivalent. Conversion seems the least of coding this feature.




html-to-markdown does all versions of Python and simple [API](https://github.com/Goldziher/html-to-markdown/blob/6f9d36bfea65bb124116a067b43ffb87aeaf6f5d/packages/python/html_to_markdown/api.py#L4) but seems doesn't do HTML fragments but that probably doesn't matter - does help keep image urls instead of trying to convert to text.

> ##### Subtask <a name="ea74a5de-dc21-4382-9dfe-5204de5e79a3"></a> 
Choose from one of the one's mentioned in that libraries introduction <https://www.reddit.com/r/Python/comments/1igtrtp/htmltomarkdown_12_modern_html_to_markdown/>  




<https://pypi.org/project/markdownify/> - doesn't support Python 3.9




<https://pypi.org/project/markitdown/> - super supported by Microsoft but <https://dev.to/leapcell/deep-dive-into-microsoft-markitdown-4if5> trying to convert images to text which we don't need

#### Resolved Task <a name="e28e46f0-d63c-4e14-8019-f4e801b0f75a"></a> 
How will the queries be done to gather the necessary jobs and comments?




Use the market_id_index jobs, market comments. and stages and calculate what is visible. Then for those visible need follow on stuff like job comments, inline_market_id, approvals, and maybe stuff inside comments that resolve like mentions and internal links.




So the market service endpoint handles everything it can.

#### Resolved Task <a name="38debdfa-ed71-4998-87fd-a6087cc0ae71"></a> 
Bring back resolved top level comments and just put them in their own section so clear they are resolved - so ship them in their own 'resolved' dictionary item.

#### Resolved Task <a name="25cfd345-9f40-4cb5-88c2-462d0069e8b3"></a> 
CANNOT LET THEM EDIT THE UCLUSION MD FILE. 

1. Incompatible with marking in progress, resolving etc.
2. We don't even support MD in Uclusion and would have to convert both directions
3. Too high a chance of corrupting the file - plus have to learn some notation language like with TODOs





So it is one way export and even for that **must convert from Uclusion html to markdown in API endpoint that services the export.** Might be a html to markdown converter in Python already for simple html.




Any md file in Github displays as md <https://github.com/Uclusion/uclusion_web_ui/blob/master/uclusion.md>

> ##### Subtask <a name="54b56b49-466d-4d82-8dfd-19190428917f"></a> 
Do we keep current uclusion.txt file? No reason not to as already coded and does not interfere with export.




However very confusing on sync - even I had to look at code and operations - consider dropping. Since it's not like a TODO there is no real reason to support them editing this file - if it isn't better to go to Uclusion than edit the local file we are done anyway.




**Keeping it just for the purposes of creation and stay in repo is dumb. Anything really repo related goes into a TODO and even then you edit on the Uclusion side. Anything higher level than the code has no point in being edited in the repo as Uclusion wizards do a much better job.**

#### Resolved Task <a name="5f9f069d-c610-4834-90a7-a27033c90178"></a> 
Tell that story on the landing page new section - **in that story mention have the entire file there for use by AI.**




**To be useful by AI either do two files, one active and one archived, or just only keep active in the repo unless the full export flag is used.**

#### Resolved Task <a name="1a8ccc84-2029-496c-941c-361f7a8767c6"></a> 
If can't find built in md manipulation can do server side or use a command line script like <https://python-markdown.github.io/cli/>

 

**Actually just have installer -** <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html> which is downloaded from the same integration page and run with the same steps as AWS CLI shows. That's going to be simpler all around and the added benefit of being allowed packages.




**Actually just run as Github action and drop the CLI altogether.** Otherwise <https://docs.aws.amazon.com/cli/latest/userguide/getting-started-prereqs.html> - have to be self contained and support Linux, Mac, and Windows - too much effort. The action runs on any push to the repo and does a sync. **The only problem is that then they need pull to get the changed files - not great.**




**Third alternative - keep existing CLI, don't have installer, and just do all heavy lifting to create the MD file server side. That means you upload the existing one and get back the new one. For the TODO part it just works exactly as now.**




Keep the full export as separate from merge - maybe only get the archived ones for instance.




ALSO THIS IS ALL VIEW SPECIFIC - you are downloading from your my work view. THE FULL EXPORT OF ALL VIEWS IS YET ANOTHER FLAG.

> ##### Subtask <a name="2e9684b6-ef9b-424b-981e-60b49b84818c"></a> 
If CLI based then order of operations problem. You check in with the latest job ticket code and then run the Uclusion CLI and then you have to commit again to get the MD file in.




**Maybe the Uclusion CLI checks in the MD file for you? MAYBE NO NEED - the file can be restored at any time by CLI - could just add it to your .ignore. If you want it checked in so visible on repo you can do that yourself.**

#### Resolved Task <a name="d0c52d76-efd9-4a59-838c-5ca1a9b6a3d8"></a> 
Create an endpoint for the export / report.

#### Resolved Task <a name="f93d51a1-88f2-47ac-84ad-54462b8f4291"></a> 
Separate endpoint that just paginates through all jobs and market level comments in a workspace.

> ##### Subtask <a name="ed31ea41-637b-4339-88a4-b73e4c86da7d"></a> 
No meta information is exported except title of job. Even replies are flattened - job comments are just in retrieval order.

#### Resolved Task <a name="ac19b570-dd8f-4035-ac07-cbfed5754fe1"></a> 
Labels appear in green on the contents report at start (or if not there then with job).

#### Resolved Task <a name="6bd43645-c4fa-4db0-85fb-e7798b80e6ab"></a> 
If there is a way to setup the Uclusion CLI as a post commit script in major Ideas then that can be done **INSTEAD** of setting up update-job.

#### Resolved Task <a name="bbae6020-fbe3-4d8c-a50e-7c68d864b934"></a> 
This endpoint powered by a third endpoint that retrieves all job and market level comment IDs in a workspace.

#### Resolved Task <a name="d95e3518-ec85-4f5c-9208-33b5a9c0e8a8"></a> 
Is exporting only one view necessary / desirable? Sure you want to control the views exported but why not a list of them? Since the ticket codes are unique to the whole workspace why limit the export to one view? Plus better integrations view if you check box what will be exported.




For TODOs you can choose what view to create them in and that gets stored in the uclusion.json settings. 

 

So viewIds and todoViewId in json. **These are strict so including your my work doesn't export from other views - you have to list them as only if the view the job is in is exported does it show in export.**

#### Resolved Task <a name="bc1d174c-4e99-43c9-861d-516c57cf5487"></a> 
Test locally.

#### Resolved Task <a name="0ce3107c-898a-47c6-9d3c-ac235e14e65d"></a> 
Since the md file is not for edit why md? Self contained HTML could still be checked in but also has the advantage that one could put it on any server - not just one that translates MD as Github does.




Of course if for some reason the report did need to be edited it would be very difficult in HTML but that would not be a common case as no one wants to edit on a regular basis to make the status work.




On the other hand Jekyll takes HTML or Markdown and you need a static generator running anyway <https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll> - so maybe Markdown is the better choice?




Have to stick with Markdown as Github only accepts it.

#### Resolved Task <a name="caaf80d5-fe24-408d-8c5a-a947b243289a"></a> 
Fix internal links to go to appropriate anchors.

> ##### Subtask <a name="c248d945-f330-48dc-9c82-e7f60a5d14b7"></a> 
Handle link to comment inside of option - neither ids are being added nor is link format covered.

#### Resolved Task <a name="ab289029-c55c-4d12-acaf-e5269135ec7a"></a> 
Add SDK to the documentation with small example that exports planning investibles and their comments and bugs. Example should work from CLI secret login.




**Can keep the download example in the SDK so can be maintained and linked as readable Javascript.**

> ##### Subtask <a name="1f89129f-7fb6-4c8b-9625-a4884b20c313"></a> 
Convert publish in uclusion_sdk to Github actions and publish to NPM.

#### Resolved Task <a name="1382a1f6-56f9-4b3f-95ef-75019a14513f"></a> 
**Now with this feature can update the update-job action to accept comment ticket codes also as they can get them from this file.**

#### Resolved Task <a name="8d713fac-1885-4726-b52e-98d55d7275a2"></a> 
Update layers with html-to-markdown.

#### Resolved Task <a name="3455dcea-7651-49f0-a9ef-7b882704783f"></a> 
In the md file have a table of contents by stage at the beginning with links to the stories below. In that table can mimic the job progress page in Uclusion by having number open, how long in stage, etc. just like it does.




See <https://blog.markdowntools.com/posts/markdown-internal-links>

> ##### Subtask <a name="b73e5cf6-ded1-44a1-a917-9f126a81f40b"></a> 
Decide on format in md file. No assignments obviously since that shouldn't matter. Yes show labels.




Three stages - No Estimate, Scheduled, and Done. Scheduled have the only date that shows which is estimated completion.




Table with 3 columns. Each column has the name of the job which is a link to lower in the markdown file. Directly the below the name of the scheduled is the estimated date. Directly below the name of the done is the label if any.

#### Resolved Task <a name="e8a0de70-3807-401f-82d0-938e9318374c"></a> 
Use anchors like 




    ### <a name="tith"></a> Button on the question that generates AI prompt onto the clipboard.




Instead of dashed which is not working.

#### Resolved Task <a name="32bf4316-e2c3-44ee-b2d5-5b4bb9babed1"></a> 
Remove current uclusion.txt in place of this read only md file.

#### Resolved Task <a name="3c675e5f-c3dc-44da-8c44-4ba945c13be1"></a> 
If link goes to something not available then either suck in or remove the link.




If suck in could be to something not visible. Could also be to something inside a job that is not visible.




Could just add it to a new section - "Linked". **However removing the link should be fine.**




Could do post process for broken links - check all internal links, can keep a list of anchors during main processing, and if anchor not present then remove braces from around verbiage, make underlined instead, and remove parentheses part which has the link.




Actually just post process **for all links** - if broken remove and if internal and not broken then fix.

#### Resolved Task <a name="ba80f6a4-323f-4418-9a4b-2dffd96b07d4"></a> 
Have replies immediately follow the parent and put a > in front of them.

#### Resolved Task <a name="37de59a3-14b7-44a0-a1e9-176f5ce4a915"></a> 
Port code in ImageBlot.js to Python and process images as it shows. That requires using get_market_token <https://github.com/Uclusion/uclusion_common/blob/dc0064ddf8b5467c76392769e9977ab701180b5b/ucommon/capabilities/capability_marshaller.py#L71> and either setting up exp to years or remove exp if can get away with that.

#### Resolved Task <a name="0177842f-1de3-4374-b880-c67e0e1d8fcf"></a> 
Support changing is_public from UI.

> ##### Subtask <a name="112cf23e-c834-4232-b637-45a7eb31c813"></a> 
For jobs, bugs, and discussion.

#### Resolved Task <a name="743adf30-31b9-462e-a1c6-f2e02f157554"></a> 
For groups.

#### Resolved Issue <a name="c1696a38-70ba-414a-a078-ffd6542b462b"></a> 
You kind of are data locked in and exporting doesn't help. Just no good way to map between systems. Unstructured comments in Github have nowhere to go unless put them all in description or introduce info for planning investible as have for options. **Even if do that still have problem if users aren't all there.**




Monday has [import from Jira](https://support.monday.com/hc/en-us/articles/360020585839-How-to-import-from-Jira-Server) and their new Jira data center app has two way sync. However its all Enterprise stuff.




Is there much difference between throwing all issues into Uclusion backlog and having them over in Github till working on them?

#### Resolved Task <a name="7b6548c2-98d6-41e0-a16d-ef3654680dd3"></a> 
Reason comments must be out of general pool and put as element of job, option, or suggestion. Suggestion should not have an option shipped with it.

#### Resolved Task <a name="ec55cc34-817c-44ca-9018-48dadbc47556"></a> 
All comments including replies will need anchors.

#### Resolved Task <a name="c2d2eaa2-20a3-4b6d-8741-895802f30104"></a> 
Fix so notes can be made public also. 

#### Resolved Task <a name="7d843e2f-8de0-4436-a389-452885ee64dc"></a> 
Then do we include recently competed as do on status page? If so makes harder to suck into AI or does it? Depends what AI does with it or if it observes complete stage.

## Job <a name="0119ab37-b6ed-432e-a05b-5a91e8e02393"></a>
### See if React now supports a better way to keep a websocket open - otherwise...
...these changes outside the UI could bite.

#### Resolved Task <a name="5f80d3ad-371b-4c44-8eaa-06c26f244e7c"></a> 
See if React now supports a better way to keep a websocket open - otherwise these changes outside the UI could bite.

#### Resolved Task <a name="86d83928-85e5-4a33-8f66-5a147ba16b0e"></a> 
Some version of <https://github.com/robtaussig/react-use-websocket/issues/217> to handle reconnect after long time.




Also possible same idea with offline listener or both.

> ##### Subtask <a name="c1df5bff-c6ab-478d-966d-2b3b3ba5f407"></a> 
See if this is still necessary by seeing if reconnects in morning after attempts may have been exceeded.

#### Resolved Task <a name="89946901-5b08-4c0a-ad12-30f19f423598"></a> 
Not working at all - have to test without clicking in as that refreshes.

