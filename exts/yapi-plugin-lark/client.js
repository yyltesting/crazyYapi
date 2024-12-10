import larkRobotView from './views/form';

module.exports = function () {
    this.bindHook('sub_setting_nav', (router) => {
        router.lark = {
            name: '飞书机器人',
            component: larkRobotView
        }
    })
}
