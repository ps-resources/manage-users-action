# Manage Users Action

![Check Dist/](https://github.com/gateixeira-demos/manage-users-action/workflows/check-dist/badge.svg)
![CodeQL](https://github.com/gateixeira-demos/manage-users-action/workflows/codeql-analysis/badge.svg)
![Publish](https://github.com/gateixeira-demos/manage-users-action/workflows/Publish/badge.svg)

This GitHub actions adds and removes multiple users from multiple repositories repositories.

If a user is already part of the repository, running it again with a different `permission` will change the permission of the user.

A user will be removed from the repository regardless whether the user accepted the invitation. A pending invitation will be cancelled.

## Inputs

| NAME           | DESCRIPTION                                                                                    | TYPE     | REQUIRED | DEFAULT |
| -------------- | ---------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| `token`        | A GitHub token with access to the target repositories                                          | `string` | `true`   | `N/A`   |
| `users`        | Comma-separated GitHub slug of users to provide access to.                                     | `string` | `true`   | `N/A`   |
| `repositories` | Comma-separated GitHub slug of repositories to provide access to (format <owner>/<repo_name>). | `string` | `true`   | `N/A`   |
| `action`       | The action to perform. Add or Remove.                                                          | `string` | `true`   | `N/A`   |
| `role`         | Role of the user in the repository. Only required if action is add.                            | `string` | `false`  | `N/A`   |
