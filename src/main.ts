import { getInput, info, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'

async function run(): Promise<void> {
  try {
    const users: string[] = getInput('users').split(',')
    for (const user of users) {
      info(`user: ${user}`)
    }

    const repositories: string[] = getInput('repositories').split(',')
    for (const repository of repositories) {
      info(`repository: ${repository}`)
    }

    const role: string = getInput('role')
    info(`role: ${role}`)

    const token = getInput('token')
    const issueNumber = context.payload.issue && context.payload.issue.number
    const octokit = getOctokit(token)

    const promises: Promise<any>[] = []

    for (const repository of repositories) {
      for (const user of users) {
        promises.push(
          octokit.rest.repos.addCollaborator({
            owner: context.payload.organization.login,
            repo: repository,
            username: user,
            permission: role === 'write' ? 'push' : 'pull',
          }),
        )
      }
    }

    const result = await Promise.all(promises)
    info(JSON.stringify(result))

    let message = ''
    for (const response of result) {
      message += `Added ${response.username} to ${response.repo} with ${response.permission} permissions\n`
    }

    octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: issueNumber as number,
      body: message,
    })
  } catch (error: any) {
    setFailed(error.message)
  }
}

run()

//write a function to get actions billing information from the github api
