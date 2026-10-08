# Uclusion UI

[Uclusion](https://www.uclusion.com) reserves all commercial rights to this code but it is available as a learning resource for anyone coding in React, building PWA, using Amplify, using Material UI, etc.

## Workflow release hashes and token counts

After editing workflow assets, refresh their hashes in `WORKFLOW_ASSET_SHA256`
in `public/scripts/uclusionInstall.py` and regenerate the changed artifact
counts in `public/scripts/token-manifest.json` with `countArtifactTokens.py`.
Refresh the manifest's installer hash too.

On the local development workstation, `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`
are stored in `~/.config/uclusion-dev/keys.env`. Load them before counting:

```sh
set -a
. "$HOME/.config/uclusion-dev/keys.env"
set +a
```

See `countArtifactTokens.py` for the stage export and counter arguments.
Validate with `python3 checkWorkflowAssetPins.py public/scripts`, then run
`python3 checkWorkflowAssetPins.py` against the rebuilt `build/scripts` assets
before deployment.

## List of articles about this code

[Notes on S3 backed File Downloads](https://dev.to/uclusionhq/notes-on-s3-backed-file-downloads-42i3)  
[Gotchas with Service Workers and SPAs](https://dev.to/uclusionhq/gotchas-with-service-workers-and-spas-44e6)  
[Stopping memory leaks in AWS Amplify Hub](https://dev.to/uclusionhq/stopping-memory-leaks-in-aws-amplify-hub-3f9c)  
[Powering Client Side Search with React Contexts](https://dev.to/uclusionhq/powering-client-side-search-with-react-contexts-2o9j)  
[Navigation in React](https://dev.to/uclusionhq/navigation-in-react-5bh3)  
[Wizards aren’t just for Hogwarts](https://dev.to/uclusionhq/wizards-aren-t-just-for-hogwarts-14kd)  
[Authenticated S3 Downloads Without Passing Through Your Lambdas](https://dev.to/uclusionhq/authenticated-s3-downloads-without-passing-through-your-lambdas-3i3k)   
[Uploading user files to S3 without passing through your Lambdas](https://dev.to/uclusionhq/using-a-message-bus-and-react-context-instead-of-redux-with-promise-based-apis-26ic)  
[Using a message bus and React context instead of Redux with promise based APIs](https://dev.to/uclusionhq/using-a-message-bus-and-react-context-instead-of-redux-with-promise-based-apis-26ic)  
[Amplify and Github Login](https://dev.to/uclusionhq/circleci-aws-cognito-amplify-and-github-login-3poc)  
[Multiple tabs in your app](https://dev.to/uclusionhq/multiple-tabs-in-your-app-133b)  
