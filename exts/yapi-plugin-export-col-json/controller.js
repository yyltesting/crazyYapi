const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
const interfaceCatModel = require('models/interfaceCat.js');
const yapi = require('yapi.js');


class exportColjSONController extends baseController {
    constructor(ctx) {
        super(ctx);
        this.catModel = yapi.getInst(interfaceCatModel);
        this.interModel = yapi.getInst(interfaceModel);
        this.projectModel = yapi.getInst(projectModel);
    }

    async exportColData(ctx) {
        let pid = ctx.request.query.pid;
        let colid = ctx.request.query.colid;
        console.log(ctx.request.query);
        let result;
        if (!pid) {
            ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
        }

        try {
            let project = await this.projectModel.getBaseInfo(pid);
            if (project.project_type === 'private') {
                if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
                return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
                }
            }
            let islist = ctx.params.islist && ctx.params.islist === '1' ? true : false;
            if(colid==0){
                //全部
                result = await yapi.commons.getColforexport(pid,islist);
            }else{
                result = await yapi.commons.getColforexport(pid,islist,null,colid);
            }
            // let result = await yapi.commons.getColforexport(pid,islist,null,colid);
            let tp = JSON.stringify(result, null, 2);
            ctx.set('Content-Disposition', `attachment; filename=colData.json`);
            return (ctx.body = tp);
        } catch (e) {
            ctx.body = yapi.commons.resReturn(null, 402, e.message);
        }

    }
}

module.exports = exportColjSONController;