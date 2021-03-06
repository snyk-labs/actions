## Synchronize Github issues with Snyk SCM project issues
A [GitHub Action](https://github.com/features/actions) for synchronizing Github issues with issues detected in Snyk Open Source projects for a given 
repository.

Important points to be aware of:
- Works specifically for Snyk Open Source project types, not for any others such as Snyk Container, IaC, Code, etc... 
  - You can find the projects that Snyk Open source detects via the SCM integration [here](https://docs.snyk.io/products/snyk-open-source/language-and-package-manager-support)
- Works only with default branch in Snyk
- Does not consider license issues, only security vulnerabilities.

## Properties

The action has properties which are passed to the underlying automation. These are passed to the action using `with`.

| Property            | Required | Default | Description  |
| ------------------- | ---------| ------- | -------------------------------------------------------------------------------------------  |
| snyk_prefix  | No   |        | Prefix for Snyk organization slug to match github org <br/>example: prefix of "cse" and github org with name "snyk-playground" would look for a snyk org slug of "cse_snyk-playground" |
| use_fresh_issues  | No | false  | when running on push to monitored branch, set this to true to ensure latest snyk results are used | 
| command     | No | sync-issues  | command to run for this script. options are: <br/> - create-new-issues <br/> - close-fixed-issues <br/> - sync-issues |

to achieve the most reliable syncing of GH Issues with Snyk SCM Project issues, two workflows are recommended.

## Workflows
**1 - On `push` event on the snyk-monitored branch (should be the repo default branch)**

It's import to note the use of `use_fresh_issues` in this workflow, that will wait if needed for the webhook-triggered retest to occur at Snyk
so the action can process the latest issues from this branch that was just merged to the default branch (upon push, Snyk is notified to retest the project, and we want to wait for that to complete before processing the issues).

```yaml
name: Snyk SCM Issues to Github Issues
on: 
  push:
    branches:
      - main
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: snyk-labs/actions/scm-issues-to-gh-issues@main
        with:
          snyk_prefix: "cse"
          use_fresh_issues: "true"
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          GITHUB_TOKEN: ${{ github.token }}
          REMOTE_REPO_URL: ${{ github.repositoryUrl }}
```


**2 - Scheduled workflow (e.g. nightly)**

Because the `on push` workflow will only run when code is being merged to the monitored branch,
running periodically on the scheduler ensures that any new issues detected from snyk's continuous monitoring
are reflected even if the pipeline is not active.  

This also ensures any issues missed in the `on push` workflow are synced 
by this workflow.

Notice the absence of the `use_fresh_issues` parameter, which will use the default of `false`. 
We don't need to check that a test has just occurred, and can use whatever data is present in Snyk at the time.

```yaml
name: Snyk SCM Issues to Github Issues (nightly)
on:
  schedule:
    - cron: '0 4 * * *' # run at 4:00 AM UTC
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: snyk-labs/actions/scm-issues-to-gh-issues@main
        with:
          snyk_prefix: "cse"
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          GITHUB_TOKEN: ${{ github.token }}
          REMOTE_REPO_URL: ${{ github.repositoryUrl }}
```
