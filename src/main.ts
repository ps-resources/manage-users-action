import {error, getInput, info, setFailed} from '@actions/core'
import {getOctokit} from '@actions/github'

async function validate(token: string, users: string[], repositories: string[]): Promise<void> {
  const octokit = getOctokit(token)

  let invalid = false
  let errorMessage = ''
  for (const user of users) {
    const userExists = await octokit.rest.users.getByUsername({username: user})
    if (userExists.status !== 200) {
      invalid = true
      errorMessage += `User ${user} does not exist.\n`
    }
  }

  for (const repository of repositories) {
    const repositoryExists = await octokit.rest.repos.get({
      owner: repository.split('/')[0],
      repo: repository.split('/')[1]
    })
    if (repositoryExists.status !== 200) {
      invalid = true
      errorMessage += `Repository ${repository} does not exist.\n`
    }
  }

  if (invalid) {
    error(errorMessage)
    setFailed(errorMessage)
  }
}

async function run(): Promise<void> {
  info(`Starting action...`)

  const token = getInput('token', {required: true})

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

    await validate(token, users, repositories)

    const octokit = getOctokit(token)

    for (const repository of repositories) {
      for (const user of users) {
        if (action === 'add') {
          info(`Adding ${user} to ${repository} with role ${role}`)
          await octokit.rest.repos.addCollaborator({
            owner: repository.split('/')[0],
            repo: repository.split('/')[1],
            username: user,
            permission: role === 'write' ? 'push' : 'pull'
          })
        } else if (action === 'remove') {
          try {
            await octokit.rest.repos.checkCollaborator({
              owner: repository.split('/')[0],
              repo: repository.split('/')[1],
              username: user
            })

            info(`Removing ${user} from ${repository}`)
            await octokit.rest.repos.removeCollaborator({
              owner: repository.split('/')[0],
              repo: repository.split('/')[1],
              username: user
            })
          } catch (e) {
            info(`User ${user} is not a collaborator on ${repository}`)

            const invitations = await octokit.rest.repos.listInvitations({
              owner: repository.split('/')[0],
              repo: repository.split('/')[1]
            })

            const invitation = invitations.data.find(invite => invite.invitee?.login === user)
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
  } catch (e: unknown) {
    if (e instanceof Error) {
      error(`Error adding users to repositories: ${e.message}`)
      setFailed(e.message)
    }
  }
  info(`Finished action.`)
}

run()
