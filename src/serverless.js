const {Component} = require('@serverless/core')
const Tcb = require('tencent-cloud-sdk').tcb
const stringRandom = require('string-random')

class Express extends Component {

  async deploy(inputs) {
    console.log(`Deploying Tencent MongoDB ...`)

    // 获取腾讯云密钥信息
    if (!this.credentials.tencent.tmpSecrets) {
      throw new Error(
        'Cannot get secretId/Key, your account could be sub-account or does not have access, please check if SLS_QcsRole role exists in your account, and visit https://console.cloud.tencent.com/cam to bind this role to your account.'
      )
    }
    const credentials = {
      SecretId: this.credentials.tencent.tmpSecrets.TmpSecretId,
      SecretKey: this.credentials.tencent.tmpSecrets.TmpSecretKey,
      Token: this.credentials.tencent.tmpSecrets.Token
    }


    // 默认值
    const region = inputs.region || 'ap-guangzhou'
    const alias = inputs.name || stringRandom(5).toLowerCase()
    const envId = alias + '-' + stringRandom(6).toLowerCase()

    // 创建TCB对象
    const tcb = new Tcb(credentials)

    if (this.state.EnvId) {
      return this.state
    }

    // 创建ENV
    console.log({
      Action: 'CreateEnv',
      Version: '2018-06-08',
      Region: region,
      EnvId: envId,
      Alias: alias,
      Source: 'qcloud'
    })
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

    console.log(`Deployed Tencent MongoDB ...`)

    return output

  }

  async remove(inputs = {}) {
    console.log(`Removing Tencent MongoDB ...`)

    // 获取腾讯云密钥信息
    if (!this.credentials.tencent.tmpSecrets) {
      throw new Error(
        'Cannot get secretId/Key, your account could be sub-account or does not have access, please check if SLS_QcsRole role exists in your account, and visit https://console.cloud.tencent.com/cam to bind this role to your account.'
      )
    }
    const credentials = {
      SecretId: this.credentials.tencent.tmpSecrets.TmpSecretId,
      SecretKey: this.credentials.tencent.tmpSecrets.TmpSecretKey,
      Token: this.credentials.tencent.tmpSecrets.Token
    }


    // 创建TCB对象
    const tcb = new Tcb(credentials)

    const removeResult = await tcb.request({
      Action: 'DestroyEnv',
      Version: '2018-06-08',
      Region: this.state.Region,
      EnvId: this.state.EnvId,
      IsForce: false
    })

    console.log(`Removed Tencent MongoDB ...`)
  }
}

module.exports = Express
