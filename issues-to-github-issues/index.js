const core = require("@actions/core");
const github = require("@actions/github");
//import * as core from '@actions/core'
//import * as github from '@actions/github'
const fs = require("fs")
//import * as fs from 'fs';
const path = require("path")
//import * as path from 'path';
const debugLib = require("debug")
//import * as debugLib from 'debug';

const debug = debugLib('snyk:load-file');

export async function loadFile(name){
  const filename = path.resolve(process.cwd(), name);
  try {
    return await fs.readFileSync(filename, 'utf8');
  } catch (error) {
    debug(error.message);
    throw new Error(`File can not be found at location: ${filename}`);
  }
}

async function run() {
  try {
    const token = core.getInput("token");
    const octokit = new github.getOctokit(token);

    const sarifFile = core.getInput("sarif-file")
    const content = await loadFile(sarifFile);

    const sarifFileJson = JSON.parse(content);
    //console.log(sarifFileJson)

    //load rules from SARIF
    const rules = sarifFileJson.runs[0].tool.driver.rules
    const results = sarifFileJson.runs[0].results

    //console.log(results)
    
    for (const result of results) {
        let locationUri = result.locations[0].physicalLocation.artifactLocation.uri
        let ruleId = result.ruleId

        // for each single issue find the rule text to create the issue
        let filtered = rules.filter(a => a.id == ruleId);
        console.log(`found match rule for result: ${JSON.stringify(filtered)}`)


        let title = filtered.shortDescription.text
        let body = filtered.help.markdown
        //const assignees = core.getInput("assignees");
    
        let response = await octokit.issues.create({
          // owner: github.context.repo.owner,
          // repo: github.context.repo.repo,
          ...github.context.repo,
          title,
          body,
          //assignees: assignees ? assignees.split("\n") : undefined
        });
    
        core.setOutput("issue", JSON.stringify(response.data));
    }
  } catch (error) {
    core.setFailed(`Error found: ${error.message}`);
    throw error
  }
}

run();