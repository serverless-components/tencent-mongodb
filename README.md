# 腾讯云 Nosql DB Serverless Component

## 简介

**腾讯云 Nosql DB 组件** - 通过使用[**Tencent Serverless Framework**](https://github.com/serverless/components/tree/cloud) , 基于云上 Serverless 服务, 快速创建并部署一个云开发环境，从而使用云上 Nosql DB 产品，实现“0”配置，便捷开发，极速部署，助力全栈应用项目的开发/托管。

特性介绍：

- [x] **按需付费** - 按照请求的使用量进行收费，没有请求时无需付费
- [x] **"0"配置** - 只需要关心项目代码，之后部署即可，Serverless Framework 会搞定所有配置。
- [x] **极速部署** - 部署速度快，仅需几秒，部署你的整个应用。
- [x] **实时日志** - 通过实时日志的输出查看业务状态，便于直接在云端开发应用。
- [x] **云端调试** - 可在云端直接进行项目调试，从而避免本地环境的差异。
- [x] **便捷协作** - 通过云端控制台的状态信息和部署日志，方便进行多人协作开发。

## 快速开始

1. [**安装**](#1-安装)
2. [**配置**](#2-配置)
3. [**部署**](#3-部署)
4. [**开发调试**](#4-开发调试)
5. [**查看状态**](#5-查看部署状态)
6. [**移除**](#6-移除)

更多资源：

- [**账号配置**](#账号配置)
- [**更多组件**](#更多组件)

### 1. 安装

通过 npm 全局安装 [serverless cli](https://github.com/serverless/serverless)

```bash
$ npm install -g serverless
```

如果之前您已经安装过 Serverless Framework，可以通过下列命令升级到最新版：

```bash
$ npm update -g serverless
```

安装完毕后，通过运行`serverless -v`命令，查看 Serverless Framework 的版本信息，确保版本信息不低于以下版本：

```bash
$ serverless –v
Framework Core: 1.68.0
Plugin: 3.6.6
SDK: 2.3.0
Components: 2.30.1
```

### 2. 配置

> 注意：name 字段必须 `以小写字母开头，只支持数字、小写字母 和 -`

在项目根目录创建 `serverless.yml` 文件，在其中进行如下配置

```bash
$ touch serverless.yml
```

```yml
# serverless.yml
org: orgDemo
app: appDemo
stage: dev
component: mongodb
name: mongodbDemo

inputs:
  name: my-demo
```

### 3. 部署

在 serverless.yml 文件所在的项目根目录下，运行以下指令进行部署：

```bash
$ sls deploy

serverless ⚡ framework

mongodbDemo:
  Region:    ap-guangzhou
  Name:      my-demo
  EnvID:     my-demo-dyxfxv
  FreeQuota: basic

20s › mongodbDemo › Success
```

部署时需要进行身份验证，如您的账号未 [登陆](https://cloud.tencent.com/login) 或 [注册](https://cloud.tencent.com/register) 腾讯云，您可以直接通过 `微信` 扫描命令行中的二维码进行授权登陆和注册。

> 如果希望查看更多部署过程的信息，可以通过 `sls deploy --debug` 命令查看部署过程中的实时日志信息，`sls`是 `serverless` 命令的缩写。

### 注意！！！

1. 由于 sls 运行角色限制，需要用户登录 [访问管理角色页面](https://console.cloud.tencent.com/cam/role)，手动为 **SLS_QcsRole** 添加 **TCBFullAccess** 的策略，否则无法正常运行。
2. 目前 TCB 端仅支持每月最多创建销毁 `4` 次环境，请谨慎创建，若超过 `4` 次部署将会报错。

### 5. 查看部署状态

在`serverless.yml`文件所在的目录下，通过如下命令查看部署状态：

```
$ sls info
```

### 6. 移除

在`serverless.yml`文件所在的目录下，通过以下命令移除部署=项目，移除后该组件会对应删除云上部署时所创建的所有相关资源。

```bash
$ sls remove
```

和部署类似，支持通过 `sls remove --debug` 命令查看移除过程中的实时日志信息，`sls`是 `serverless` 命令的缩写。

### 账号配置

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```bash
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此 [注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取 `SecretId` 和`SecretKey`.

```text
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

> 注意：海外 ip 登录时，需要在`.env`文件中添加`SERVERLESS_PLATFORM_VENDOR=tencent` ，使 sls 默认使用 tencent 组件

### 更多组件

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。
