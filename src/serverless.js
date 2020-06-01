const { Component } = require('@serverless/core')
const Tcb = require('tencent-cloud-sdk').tcb
const stringRandom = require('string-random')

class ServerlessComponent extends Component {
  getCredentials() {
    const { tmpSecrets } = this.credentials.tencent

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new Error(
        'Cannot get secretId/Key, your account could be sub-account or does not have access, please check if SLS_QcsRole role exists in your account, and visit https://console.cloud.tencent.com/cam to bind this role to your account.'
      )
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token
    }
  }

  async deploy(inputs) {
    console.log(`Deploying Tencent MongoDB ...`)

    const credentials = this.getCredentials()

    // 默认值
    const region = inputs.region || 'ap-guangzhou'
    const alias = inputs.name || stringRandom(5).toLowerCase()
    const envId = alias + '-' + stringRandom(6).toLowerCase()

    // 创建TCB对象
    const tcb = new Tcb(credentials)

    if (this.state.EnvId) {
      return this.state
    }

    const createEnvResult = await tcb.request({
      Action: 'CreateEnv',
      Version: '2018-06-08',
      Region: region,
      EnvId: envId,
      Alias: alias,
      Source: 'qcloud'
    })

    if (JSON.stringify(createEnvResult).includes('Error')) {
      throw new Error(JSON.stringify(createEnvResult))
    }

    // 绑定免费版本
    const createPostpayPackageResult = await tcb.request({
      Action: 'CreatePostpayPackage',
      Version: '2018-06-08',
      Region: region,
      EnvId: envId,
      FreeQuota: 'basic',
      Source: 'qcloud'
    })

    if (JSON.stringify(createEnvResult).includes('Error')) {
      throw new Error(JSON.stringify(createPostpayPackageResult))
    }

    const output = {
      Region: region,
      Name: alias,
      EnvId: envId,
      FreeQuota: 'basic'
    }

    this.state = output

    await this.save()

    console.log(`Deployed Tencent MongoDB.`)

    return output
  }

  async remove() {
    console.log(`Removing Tencent MongoDB ...`)
    const credentials = this.getCredentials()

    // 创建TCB对象
    const tcb = new Tcb(credentials)

    await tcb.request({
      Action: 'DestroyEnv',
      Version: '2018-06-08',
      Region: this.state.Region,
      EnvId: this.state.EnvId,
      IsForce: false
    })

    console.log(`Removed Tencent MongoDB ...`)
  }
}

module.exports = ServerlessComponent
