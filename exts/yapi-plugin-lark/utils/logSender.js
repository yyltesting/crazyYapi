const yapi = require("yapi.js");
const larkRobotModel = require("../larkRobotModel");
const ProjectModel = require("models/project");
const larkRobotSender = require("./lark");
const { HTMLParser, HTMLNodeToTextTranslater, HTMLNodeToMarkdownTranslater } = require("./html");
const Config = require("./config");


class SendLogVialarkSender {
  constructor(log) {
    this.log = log;
    this.larkModel = null;
  }
  async send() {
    if (!this.log || !this.log.content || this.log.content.length == 0) {
      // yapi.commons.log("yapi-plugin-lark: 没有推送内容，跳过通知。");
      return;
    }

    await this.retrieveModels();

    if (this.isNotNeedNotify()) {
      // yapi.commons.log("yapi-plugin-lark: 该项目未配置飞书推送，跳过通知。");
      return;
    }

    let node = HTMLParser.parse(this.log.content);
    this.addHostForNode(node);
    const projectName = await this.getProjectName(this.log.typeid);
    const title = `【${projectName}】`;
    var text = new HTMLNodeToMarkdownTranslater().translate(node);

    // var data;
    if(this.log.data){
      // console.log(this.log.data);
      // delete this.log.data.old;
      // let markdownContent = HTMLParser.parse(this.log.data);
      // data = new HTMLNodeToMarkdownTranslater().translate(markdownContent);
    }

    this.larkModel.hooks.forEach((item) => {
      if(item.open){
        let url = item.url;
        // let options = item.options;
        let send = false;
        if(item.options.includes('interface')){
          if(text.indexOf('下的接口')>=0||text.indexOf('添加了接口')>=0){
            // if(this.log.data){
            //   console.log('text',text);
            //   console.log('data',data);
            //   // let diffView = showDiffMsg(jsondiffpatch, formattersHtml, this.log.data);
            //   // text=text+`<p>详细改动日志: ${this.diffHTML(diffView)}</p>`
            //   // text=text+`<p>详细改动日志: ${diffView}</p>`
            //   text = text+data;
            // }
            send=true;
          }
        }
        if(item.options.includes('interfacecol')){
          if(text.indexOf('测试集')>=0){
            send=true;
          }
        }
        if(item.options.includes('caselib')){
          if(text.indexOf('用例')>=0){
            send=true;
          }
        }
        if(item.options.includes('wiki')){
          if(text.indexOf('wiki')>=0){
            send=true;
          }
        }
        if(send){
          const sender = new larkRobotSender(url);
          sender.sendMarkdown(title, text);
          yapi.commons.log(`yapi-plugin-lark: 已推送。title=${title}, text=${text}`);
        }
      }
    });
  }

  addHostForNode(node) {
    if (!node) {
      return;
    }
    if (node.type == "a") {
      let href = `${Config.instance.host}${node.getAttribute("href")}`;
      node.setAttribute("href", href);
    }
    node.children &&
      node.children.forEach((child) => {
        this.addHostForNode(child);
      });
  }

  async retrieveModels() {
    await this.retrievelarkModel();
  }

  async retrievelarkModel() {
    let Model = yapi.getInst(larkRobotModel);
    this.larkModel = await Model.getByProejctId(this.log.typeid);
  }

  isNotNeedNotify() {
    return !(this.larkModel && this.larkModel.hooks && this.larkModel.hooks.length > 0);
  }

  async getProjectName(projectId) {
    try {
      let model = yapi.getInst(ProjectModel);
      let proj = await model.get(projectId);
      return proj.name;
    } catch (e) {
      yapi.commons.log(`yapi-plugin-lark: 获取项目信息失败。 error = ${e.message || ''}`)
    }
  }
}

module.exports = {
  SendLogVialarkSender,
};
