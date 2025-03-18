### <font color=RED size=24 face="黑体">  crazy-yapi</font>分支补充功能说明：

### 分支部署说明

#### 环境要求
* nodejs（v18以上，推荐18.20.5）
* mongodb（2.6+）  https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/
* git
* webpack webpack-dev-server webpack-cli -g全局（开发需要）
* ydoc （开发需要）
* chrome  开启跨域 设置教程见：http://crazy-yapi.camdy.cn/doc/documents/chromeCORS.html

####  crazy-yapi 未部署过yapi，初次部署

    mkdir crazy-yapi
    cd crazy-yapi
    git clone --depth=1  https://gitlab.ws15.cn/yinyl/crazy-api.git vendors
    cp vendors/config_example.json ./config.json //复制完成后请修改相关配置（先在mongodb中创建好数据库和账户，根据实际值修改config.json）
    cd vendors
    npm install --production --registry https://registry.npmmirror.com（开发的话需全部install）
    npm run install-server //安装程序会初始化数据库索引和管理员账号，管理员账号名可在 config.json 配置
    node server/app.js
    请耐心等候

####  crazy-yapi 使用原有yapi数据库部署

    mkdir crazy-yapi
    cd crazy-yapi
    git clone --depth=1  https://gitlab.ws15.cn/yinyl/crazy-api.git vendors
    cp vendors/config_example.json ./config.json //复制完成后请修改相关配置（先在mongodb中创建好数据库和账户，根据实际值修改config.json和原有yapi值一样）
    cd vendors
    npm install --production --registry https://registry.npmmirror.com
    node server/app.js 启动服务

####  crazy-yapi 已部署后的更新操作

    git pull
    npm install --production --registry https://registry.npmmirror.com （若有包更新根据pack.json判断）
    node server/app.js
    请耐心等候

####  二次开发注意事项
    若服务部署在外网因为vm沙箱不安全，建议使用VM2升级至3.9.16或使用server/utils/sandbox.js替换sandbox(可能引起一些错误)

## 特性功能演示：

### 接口多级目录：
![avatar](readmeRes/接口分类.gif)

### 用例多级目录：
![avatar](readmeRes/用例集合.gif)

### 用例导入示例参数
![avatar](readmeRes/用例导入示例参数.gif)

### 单用例前置后置js处理器（支持context storage）
![avatar](readmeRes/用例前置后置js处理器.gif)

### 包含子用例集
![avatar](readmeRes/包含子用例集.gif)

### test断言功能增强
![avatar](readmeRes/test断言功能增强.gif)

### 失败中断测试：
![avatar](readmeRes/失败中断测试.gif)

### 循环测试：
![avatar](readmeRes/循环测试.gif)

### 禁用用例：
![avatar](readmeRes/用例禁用.gif)

### 数据库断言，也可通过utils.axios请求mysql接口查询：
![avatar](readmeRes/数据库断言.gif)

### sql查询：
![avatar](readmeRes/数据库查询.gif)

### 二进制上传文件：
![avatar](readmeRes/二进制上传文件.gif)

### 接口自动鉴权：
![avatar](readmeRes/接口自动鉴权.png)

### 返回文件预览：
![avatar](readmeRes/返回值处理文件预览.gif)

### 测试集合请求配置：
![avatar](readmeRes/测试集合请求配置.gif)

### 接口运行时长监听：
![avatar](readmeRes/接口运行时长监听.gif)

### 用例库关联接口用例，确保覆盖度，可exl导入：
![avatar](readmeRes/用例库关联接口用例.gif)

### Swagger自定义导入：
![avatar](readmeRes/swagger自定义导入.png)

### 找回密码：
![avatar](readmeRes/找回密码.gif)

### 测试集合负责人：
![avatar](readmeRes/集合负责人.gif)

### web3连接metamask钱包签名：
![avatar](readmeRes/集成web3连接钱包签名.gif)

### websocket连接测试：
![avatar](readmeRes/Websocket连接与测试.gif)

### 用例参数批量同步：
![avatar](readmeRes/用例参数批量同步.gif)

### 统计：
![avatar](readmeRes/统计.gif)

### pb文件导入同步接口：
![avatar](readmeRes/Pb文件导入.png)

### 自动化测试计划：
![avatar](readmeRes/自动化测试计划.png)

### 自动化测试单用例循环：
![avatar](readmeRes/单用例循环.gif)

### chai javascript断言：
![avatar](readmeRes/chai断言.png)

### 请求超时判断：
![avatar](readmeRes/请求超时设置.gif)

### 谷歌登录：
![avatar](readmeRes/谷歌登录.gif)

### storage循环测试判断：
![avatar](readmeRes/storage循环测试判断.gif)

### firebase谷歌登录：
![avatar](readmeRes/firebase谷歌登录.gif)

### 集成飞书机器人通知：
![avatar](readmeRes/飞书机器人配置.png)

### 集成stripe支付：
![avatar](readmeRes/stripe%E6%94%AF%E4%BB%98.gif)

### 服务器日志快捷查看：
![avatar](readmeRes/服务器日志查看.gif)

### 集合数据导出与导入：
![avatar](readmeRes/集合数据导出与导入.png)

### AI生成测试用例库与单接口测试用例：
![avatar](readmeRes/AI生成用例库.png)
![avatar](readmeRes/AI生成接口用例.png)

### crazy-yapi  作者
* yyl  791482765@qq.com


<font color=RED size=24 face="黑体"> ---------------------以下内容为官方主分支说明文档------------------------------</font>

## YApi  可视化接口管理平台
<p><a target="_blank" href="http://yapi.demo.qunar.com">yapi.demo.qunar.com</a></p>

### 平台介绍
![avatar](yapi-base-flow.jpg)

YApi 是<strong>高效</strong>、<strong>易用</strong>、<strong>功能强大</strong>的 api 管理平台，旨在为开发、产品、测试人员提供更优雅的接口管理服务。可以帮助开发者轻松创建、发布、维护 API，YApi 还为用户提供了优秀的交互体验，开发人员只需利用平台提供的接口数据写入工具以及简单的点击操作就可以实现接口的管理。


### 特性
*  基于 Json5 和 Mockjs 定义接口返回数据的结构和文档，效率提升多倍
*  扁平化权限设计，即保证了大型企业级项目的管理，又保证了易用性
*  类似 postman 的接口调试
*  自动化测试, 支持对 Response 断言
*  MockServer 除支持普通的随机 mock 外，还增加了 Mock 期望功能，根据设置的请求过滤规则，返回期望数据
*  支持 postman, har, swagger 数据导入
*  免费开源，内网部署，信息再也不怕泄露了

### 内网部署
#### 环境要求
* nodejs（7.6+)
* mongodb（2.6+）
* git
#### 安装
使用我们提供的 yapi-cli 工具，部署 YApi 平台是非常容易的。执行 yapi server 启动可视化部署程序，输入相应的配置和点击开始部署，就能完成整个网站的部署。部署完成之后，可按照提示信息，执行 node/{网站路径/server/app.js} 启动服务器。在浏览器打开指定url, 点击登录输入您刚才设置的管理员邮箱，默认密码为 ymfe.org 登录系统（默认密码可在个人中心修改）。

    npm install -g yapi-cli --registry https://registry.npm.taobao.org
    yapi server 

#### 升级
升级项目版本是非常容易的，并且不会影响已有的项目数据，只会同步 vendors 目录下的源码文件。

    cd  {项目目录}
    yapi ls //查看版本号列表
    yapi update //更新到最新版本
    yapi update -v {Version} //更新到指定版本
    
### 教程
* [使用 YApi 管理 API 文档，测试， mock](https://juejin.im/post/5acc879f6fb9a028c42e8822)
* [自动更新 Swagger 接口数据到 YApi 平台](https://juejin.im/post/5af500e251882567096140dd)
* [自动化测试](https://juejin.im/post/5a388892f265da430e4f4681)

### YApi 插件
* [yapi sso 登录插件](https://github.com/YMFE/yapi-plugin-qsso)
* [yapi cas 登录插件](https://github.com/wsfe/yapi-plugin-cas) By wsfe
* [yapi gitlab集成插件](https://github.com/cyj0122/yapi-plugin-gitlab)
* [oauth2.0登录](https://github.com/xwxsee2014/yapi-plugin-oauth2)
* [rap平台数据导入](https://github.com/wxxcarl/yapi-plugin-import-rap)
* [dingding](https://github.com/zgs225/yapi-plugin-dding) 钉钉机器人推送插件
* [export-docx-data](https://github.com/inceptiongt/Yapi-plugin-export-docx-data) 数据导出docx文档

### 代码生成
* [yapi-to-typescript：根据 YApi 的接口定义生成 TypeScript 的请求函数](https://github.com/fjc0k/yapi-to-typescript)
* [yapi-gen-js-code: 根据 YApi 的接口定义生成 javascript 的请求函数](https://github.com/hellosean1025/yapi-gen-js-code)

### YApi docker部署（非官方）
* [使用 alpine 版 docker 镜像快速部署 yapi](https://www.jianshu.com/p/a97d2efb23c5)
* [docker-yapi](https://github.com/Ryan-Miao/docker-yapi)

### YApi 一些工具
* [mysql服务http工具,可配合做自动化测试](https://github.com/hellosean1025/http-mysql-server)
* [idea 一键上传接口到yapi插件](https://github.com/FurionCS/YapiIdeaUploadPlugin)



### License
Apache License 2.0

