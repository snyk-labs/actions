## Synchronize Github issues with Snyk CLI test output
A [GitHub Action](https://github.com/features/actions) for synchronizing Github issues with issues detected in a `snyk test` for Snyk Open Source projects.

Important points to be aware of:
- Works specifically for Snyk Open Source project types, not for any others such as Snyk Container, IaC, Code, etc... 
  - You can find the projects that Snyk Open source detects via the SCM integration [here](https://docs.snyk.io/products/snyk-open-source/language-and-package-manager-support)
- Works only with default branch in Snyk (since issues are created at repo level)
- Does not consider license issues, only security vulnerabilities.

## Properties

The action has properties which are passed to the underlying automation. These are passed to the action using `with`.

| Property            | Required | Default | Description  |
| ------------------- | ---------| ------- | -------------------------------------------------------------------------------------------  |
| sarif_file  | No   | snyk.sarif  |  path to SARIF file generated from snyk CLI |
| command     | No | sync-issues  | command to run for this script. options are: <br/> - create-new-issues <br/> - close-fixed-issues <br/> - sync-issues |

to achieve the most reliable syncing of GH Issues with Snyk test output, two workflows are recommended.

## Workflows
The following workflows are *examples* that use both the snyk/actions as well as the snyk-labs/actions/sarif-to-gh-issues to demonstrate how to utilize this functionality 
after generating the SARIF file output from the snyk test, and then using that output in the next step.

**1 - On `push` event on the default branch**

```yaml
name: snyk-labs/action example - Snyk Issues to Github Issues
on: 
  push:
    branches:
      - main
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: snyk/actions/setup@master
      - uses: actions/setup-node@v1
      - name: snyk test
        run: snyk test --all-projects --severity-threshold=high --sarif-file-output=snyk.sarif
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - uses: snyk-labs/actions/sarif-to-gh-issues@main
        with:
          sarif_file: snyk.sarif
        env:
          GITHUB_TOKEN: ${{ github.token }}
          REMOTE_REPO_URL: ${{ github.repositoryUrl }}
```

**2 - Scheduled workflow (e.g. nightly)**

Because the `on push` workflow will only run when code is being merged to the monitored branch,
running periodically on the scheduler ensures that any new issues detected are reflected even if 
the pipeline is not active.  

```yaml
name: snyk-labs/action example - Snyk Issues to Github Issues
on:
  schedule:
    - cron: '0 4 * * *' # run at 4:00 AM UTC
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: snyk/actions/setup@master
      - uses: actions/setup-node@v1
      - name: snyk test
        run: snyk test --all-projects --severity-threshold=high --sarif-file-output=snyk.sarif
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - uses: snyk-labs/actions/sarif-to-gh-issues@main
        with:
          sarif_file: snyk.sarif
        env:
          GITHUB_TOKEN: ${{ github.token }}
          REMOTE_REPO_URL: ${{ github.repositoryUrl }}
```
