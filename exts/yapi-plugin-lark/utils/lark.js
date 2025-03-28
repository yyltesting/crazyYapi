const axios = require('axios');

/**
 * 飞书机器人消息推送封装
 */
class larkRobotSender {
    constructor(url) {
        this.url = url;
    }

    async sendMarkdown(title, text ,atMobiles = [], isAtAll = false) {
        let payload = {
            msgtype: 'markdown',
            markdown: {
                title: title,
                text: text,
                at: {
                    atMobiles: atMobiles,
                    isAtAll: isAtAll
                }
            }
        };

        let result = await this.send(payload);
        return result;
    }

    async sendTestMessage() {
        const title = '测试 - YAPI飞书推送机器人';
        const text = '这是一条测试消息';
        return await this.sendMarkdown(title, text);
    }

    async send(data) {
        return await axios.post(this.url, data);
    }
}

module.exports = larkRobotSender
