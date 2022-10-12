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

    let message = ''
    for (const repository of repositories) {
      for (const user of users) {
        if (action === 'add') {
          const response = await octokit.rest.repos.addCollaborator({
            owner: repository.split('/')[0],
            repo: repository.split('/')[1],
            username: user,
            permission: role === 'write' ? 'push' : 'pull'
          })
          
          if (response.status === 201)
            message += `Added @${user} to [${repository}](https://github.com/${repository}) with \`${role}\` access`
          else
            message += `Failed to add @${user} to [${repository}](https://github.com/${repository}) with \`${role}\` access.`
        } else if (action === 'remove') {
          try {
            const isCollaborator = await octokit.rest.repos.checkCollaborator({
              owner: repository.split('/')[0],
              repo: repository.split('/')[1],
              username: user
            })
          
            if (isCollaborator.status === 204) {
              const response = await octokit.rest.repos.removeCollaborator({
                owner: repository.split('/')[0],
                repo: repository.split('/')[1],
                username: user
              })

              if (response.status === 204)
                message += `Removed @${user} from [${repository}](https://github.com/${repository})`
              else
                message += `Failed to remove @${user} from [${repository}](https://github.com/${repository})`
            } else {
              message += `@${user} is not a collaborator on [${repository}](https://github.com/${repository})`
            }
          } catch (error) {
            const invitations = await octokit.rest.repos.listInvitations({
              owner: repository.split('/')[0],
              repo: repository.split('/')[1]
            })

            const invitation = invitations.data.find(invitation => invitation.invitee?.login === user)
            if (invitation) {
              const response = await octokit.rest.repos.deleteInvitation({
                owner: repository.split('/')[0],
                repo: repository.split('/')[1],
                invitation_id: invitation.id
              })
              message += `Cancelled invitation of @${user} from [${repository}](https://github.com/${repository})`
            } else {
              message += `No invitation of @${user} from [${repository}](https://github.com/${repository})`
            }
          }
        } else { 
          throw new Error('Action must be add or remove')
        }
      }
    }

    octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: issueNumber as number,
      body: message
    })

    const label = action === 'add' ? 'added' : 'removed'
    octokit.rest.issues.addLabels({
      ...context.repo,
      issue_number: issueNumber as number,
      labels: [label]
    })

    octokit.rest.issues.update({
      ...context.repo,
      issue_number: issueNumber as number,
      state: 'closed'
    })
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