# 配置文档

## 完整配置

```yml
org: orgDemo # (可选) 用于记录组织信息，默认值为您的腾讯云账户 appid，字符串
app: appDemo # (可选) 该应用名称，字符串
stage: dev # (可选) 用于区分环境信息，默认值为 dev，字符串
component: mongodb # (必填) 组件名称，此处为 mongodb
name: mongodbDemo # (必填) 实例名称

inputs:
  name: mongo-test # 创建云开发环境名称
```

## 配置说明

主要参数说明

| 参数 | 必填 | 类型   | 默认值 | 描述                 |
| ---- | ---- | ------ | ------ | -------------------- |
| name | 必填 | string |        | 创建的云开发环境名称 |
