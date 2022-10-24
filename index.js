const Core = require('@actions/core')
const Api = require('./src/api')

/**
 * Set secrets in Github repo
 * This actions is participating in #ActionsHackathon 2020
 *
 * @param {Api} api - Api instance
 * @param {string} secret_name - Secret key name
 * @param {string} secret_value - Secret raw value
 * @see https://developer.github.com/v3/actions/secrets/#create-or-update-an-organization-secret
 * @see https://dev.to/devteam/announcing-the-github-actions-hackathon-on-dev-3ljn
 * @see https://dev.to/habibmanzur/placeholder-title-5e62
 */
const boostrap = async (api, secret_name, secret_value) => {

  try {

    const environmentName = Core.getInput('environment')
    let response
    if (environmentName) {
      console.error(`environmentName: ${environmentName}`)
      response = await api.getPublicKey(environmentName)
    } else {
      response = await api.getPublicKey()
    }

    console.error(require('util').inspect(response, {depth:null}))
    const key_id = response.key_id
    const key = response.key
    const data = await api.createSecret(key_id, key, secret_name, secret_value)
    console.error(require('util').inspect(data, {depth:null}))

    console.error(1)
    if (api.isOrg()) {
      console.error(2)
      data.visibility = Core.getInput('visibility')

      if (data.visibility === 'selected') {
        data.selected_repository_ids = Core.getInput('selected_repository_ids')
      }
    }

    if (environmentName) {
      console.error(3)
      console.error(`environmentName: ${environmentName}`)
      response = await api.setEnvironmentSecret(data, environmentName, secret_name)
    } else {
      response = await api.setSecret(data, secret_name)
    }

    console.error(response.status, response.data)

    if (response.status >= 400) {
      Core.setFailed(response.data)
    } else {
      Core.setOutput('status', response.status)
      Core.setOutput('data', response.data)
    }

  } catch (e) {
    Core.setFailed(e.message)
    console.error(e)
  }
}


try {
  // `who-to-greet` input defined in action metadata file
  const name = Core.getInput('name')
  const value = Core.getInput('value')
  const repository = Core.getInput('repository')
  const token = Core.getInput('token')
  const org = Core.getInput('org')

  const api = new Api(token, repository, !!org)

  boostrap(api, name, value)

} catch (error) {
  Core.setFailed(error.message)
}
