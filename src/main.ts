import {getInput, info, setFailed} from '@actions/core'
import {context, getOctokit} from '@actions/github'

async function run(): Promise<void> {
  const token = getInput('token', {required: true})
  const octokit = getOctokit(token)
  const issueNumber = context.payload.issue && context.payload.issue.number

  try {
    const users: string[] = getInput('users').replace(/\s/g, '').split(',')
    for (const user of users) {
      info(`user: ${user}`)
    }

    const repositories: string[] = getInput('repositories').replace(/\s/g, '').split(',')
    for (const repository of repositories) {
      info(`repository: ${repository}`)
    }

    const role: string = getInput('role')
    info(`role: ${role}`)

    const action: string = getInput('action')
    info(`action: ${action}`)

    for (const repository of repositories) {
      for (const user of users) {
        if (action === 'add') {
          info(`Adding ${user} to ${repository} with role ${role}`)
          const response = await octokit.rest.repos.addCollaborator({
            owner: repository.split('/')[0],
            repo: repository.split('/')[1],
            username: user,
            permission: role === 'write' ? 'push' : 'pull'
          })
        } else if (action === 'remove') {
            const isCollaborator = await octokit.rest.repos.checkCollaborator({
              owner: repository.split('/')[0],
              repo: repository.split('/')[1],
              username: user
            })
          
            if (isCollaborator.status === 204) {
              info(`Removing ${user} from ${repository}`)
              await octokit.rest.repos.removeCollaborator({
                owner: repository.split('/')[0],
                repo: repository.split('/')[1],
                username: user
              })
            } else {
              const invitations = await octokit.rest.repos.listInvitations({
                owner: repository.split('/')[0],
                repo: repository.split('/')[1]
              })

              const invitation = invitations.data.find(invitation => invitation.invitee?.login === user)
              if (invitation) {
                info(`Cancelling invitation for ${user} to ${repository}`)
                await octokit.rest.repos.deleteInvitation({
                  owner: repository.split('/')[0],
                  repo: repository.split('/')[1],
                  invitation_id: invitation.id
                })
              }
            }
        } else { 
          throw new Error('Action must be add or remove')
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      const issue = await octokit.rest.issues.get({
        ...context.repo,
        issue_number: issueNumber as number
      })
      
      octokit.rest.issues.createComment({
        ...context.repo,
        issue_number: issueNumber as number,
        body: `@${issue.data.assignee?.login}: there was an error: ${error.message}`
      })

      octokit.rest.issues.addLabels({
        ...context.repo,
        issue_number: issueNumber as number,
        labels: ['error']
      })
      
      setFailed(error.message)
    }
  }
}

run()