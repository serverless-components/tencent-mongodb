const { Component } = require('@serverless/core')
const Tcb = require('tencent-cloud-sdk').tcb
const stringRandom = require('string-random')
const { TypeError } = require('tencent-component-toolkit/src/utils/error')

class ServerlessComponent extends Component {
  getCredentials() {
    const { tmpSecrets } = this.credentials.tencent

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new TypeError(
        'CREDENTIAL',
        'Cannot get secretId/Key, your account could be sub-account and does not have the access to use SLS_QcsRole, please make sure the role exists first, then visit https://cloud.tencent.com/document/product/1154/43006, follow the instructions to bind the role to your account.'
      )
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token
    }
  }

  async getFreeEnv(tcbClient, region) {
    let freeEnv = null
    const res1 = await tcbClient.request({
      Action: 'DescribeEnvs',
      Version: '2018-06-08',
      Region: region
    })
    if (res1.Response && res1.Response.Error) {
      throw new TypeError(
        'API_MONGODB_DescribeEnvs',
        JSON.stringify(res1),
        null,
        res1.Response.RequestId
      )
    }
    const {
      Response: { EnvList }
    } = res1

    if (EnvList.length > 0) {
      const res2 = await tcbClient.request({
        Action: 'DescribeBillingInfo',
        Version: '2018-06-08',
        Region: 'ap-guangzhou'
      })

      if (res2.Response && res2.Response.Error) {
        throw new TypeError(
          'API_MONGODB_DescribeBillingInfo',
          JSON.stringify(res2),
          null,
          res2.Response.RequestId
        )
      }
      const {
        Response: { EnvBillingInfoList }
      } = res2

      EnvList.forEach((item) => {
        EnvBillingInfoList.forEach((bItem) => {
          if (bItem.EnvId === item.EnvId && bItem.FreeQuota === 'basic') {
            freeEnv = item
            freeEnv.FreeQuota = 'basic'
          }
        })
      })
      if (freeEnv) {
        return freeEnv
      }
    }
    return freeEnv
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

    const output = {
      Region: region,
      Name: alias,
      EnvId: envId,
      FreeQuota: 'basic'
    }

    const freeEnv = await this.getFreeEnv(tcb, region)

    if (freeEnv) {
      output.Name = freeEnv.Alias
      output.EnvId = freeEnv.EnvId
      output.Msg =
        '检测到您已拥有tcb免费环境，将默认使用该环境完成部署，如果您需要使用更多环境，请通过云开发控制台（https://console.cloud.tencent.com/tcb/env/index）完成资源购买'

      this.state = output
      await this.save()

      console.log(`Already exist free Tencent MongoDB.`)
      return output
    }

    try {
      const createEnvResult = await tcb.request({
        Action: 'CreateEnv',
        Version: '2018-06-08',
        Region: region,
        EnvId: envId,
        Alias: alias,
        Source: 'qcloud'
      })
      if (createEnvResult.Response && createEnvResult.Response.Error) {
        throw new TypeError(
          'API_MONGODB_CreateEnv',
          JSON.stringify(createEnvResult),
          null,
          createEnvResult.Response.RequestId
        )
      }
    } catch (e) {
      throw new TypeError('API_MONGODB_CreateEnv', e.message, e.stack, e.reqId)
    }

    try {
      const createPostpayPackageResult = await tcb.request({
        Action: 'CreatePostpayPackage',
        Version: '2018-06-08',
        Region: region,
        EnvId: envId,
        FreeQuota: 'basic',
        Source: 'qcloud'
      })

      if (createPostpayPackageResult.Response && createPostpayPackageResult.Response.Error) {
        throw new TypeError(
          'API_MONGODB_CreatePostpayPackage',
          JSON.stringify(createPostpayPackageResult),
          null,
          createPostpayPackageResult.Response.RequestId
        )
      }
    } catch (e) {
      throw new TypeError('API_MONGODB_CreatePostpayPackage', e.message, e.stack, e.reqId)
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

    try {
      const res = await tcb.request({
        Action: 'DestroyEnv',
        Version: '2018-06-08',
        Region: this.state.Region,
        EnvId: this.state.EnvId,
        IsForce: false
      })
      if (res.Response && res.Response.Error) {
        console.log(`DestroyEnv: ${JSON.stringify(res.Response)}`)
      }
    } catch (e) {
      console.log(`DestroyEnv: ${e.message}`)
    }

    console.log(`Removed Tencent MongoDB ...`)
  }
}

module.exports = ServerlessComponent
