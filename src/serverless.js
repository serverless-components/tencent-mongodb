const { Component } = require('@serverless/core')
const Tcb = require('tencent-cloud-sdk').tcb
const stringRandom = require('string-random')
const { ApiError, TypeError } = require('tencent-component-toolkit/src/utils/error')

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

  async request(client, region, options) {
    try {
      const { Response } = await client.request({
        Version: '2018-06-08',
        Region: region,
        ...options
      })
      if (Response && Response.Error) {
        throw new ApiError({
          type: `API_MONGODB_${options.Action}`,
          message: `${Response.Error.Message} (${Response.RequestId})`,
          reqId: Response.RequestId,
          code: Response.Error.Code
        })
      }
      return Response
    } catch (e) {
      throw new ApiError({
        type: `API_MONGODB_${options.Action}`,
        message: e.message,
        stack: e.stack,
        reqId: e.reqId,
        code: e.code
      })
    }
  }

  async getFreeEnv(client, region) {
    let freeEnv = null
    const { EnvList } = await this.request(client, region, {
      Action: 'DescribeEnvs'
    })

    if (EnvList.length > 0) {
      const { EnvBillingInfoList } = await this.request(client, region, {
        Action: 'DescribeBillingInfo'
      })

      EnvList.forEach((item) => {
        EnvBillingInfoList.forEach((bItem) => {
          if (bItem.EnvId === item.EnvId && bItem.FreeQuota === 'basic') {
            freeEnv = item
            freeEnv.FreeQuota = 'basic'
          }
        })
      })
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
      output.Message =
        '检测到您已拥有tcb免费环境，将默认使用该环境完成部署，如果您需要使用更多环境，请通过云开发控制台（https://console.cloud.tencent.com/tcb/env/index）完成资源购买'

      this.state = output
      await this.save()

      console.log(`Already exist free Tencent MongoDB.`)
      return output
    }

    await this.request(tcb, region, {
      Action: 'CreateEnv',
      EnvId: envId,
      Alias: alias,
      Source: 'qcloud',
      Channel: 'serverless_framework'
    })

    await this.request(tcb, region, {
      Action: 'CreatePostpayPackage',
      EnvId: envId,
      FreeQuota: 'basic',
      Source: 'qcloud',
      Channel: 'serverless_framework'
    })

    this.state = output

    await this.save()

    console.log(`Deployed Tencent MongoDB.`)

    return output
  }

  async remove() {
    console.log(`Removing Tencent MongoDB`)
    const credentials = this.getCredentials()

    // 创建TCB对象
    const tcb = new Tcb(credentials)

    const { Region, EnvId } = this.state

    try {
      await this.request(tcb, Region, {
        Action: 'DestroyEnv',
        EnvId: EnvId,
        IsForce: false
      })
      console.log(`Removed Tencent MongoDB`)
    } catch (e) {
      console.log(`DestroyEnv: ${e.message} (reqId: ${e.reqId})`)
    }
  }
}

module.exports = ServerlessComponent
