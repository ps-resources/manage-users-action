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

    const token = getInput('token', { required: true })
    const issueNumber = context.payload.issue && context.payload.issue.number
    const octokit = getOctokit(token)

    const promises: Promise<any>[] = []

    for (const repository of repositories) {
      for (const user of users) {
        promises.push(
          octokit.rest.repos.addCollaborator({
            owner: repository.split('/')[0],
            repo: repository.split('/')[1],
            username: user,
            permission: role === 'write' ? 'push' : 'pull',
          }),
        )
      }
    }

    const result = await Promise.all(promises)

    let message = ''
     
    for (const response of result) {
      message += response.data ? `Added ${response.data.invitee.login} to ${response.data.repository.full_name} with ${response.data.permissions} permissions\n` : ''
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
