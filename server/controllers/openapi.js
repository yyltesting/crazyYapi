const baseController = require('./base.js');
const caselibModel = require('../models/caselib.js');
const caseModel = require('../models/interfaceCase.js')
const yapi = require('../yapi.js');
const OpenAI = require('openai');

class openaiController extends baseController {
    constructor() {
        super();
        this.caseLibModel = yapi.getInst(caselibModel);
        this.caseModel = yapi.getInst(caseModel);
        // 在构造函数中创建 OpenAI 实例，仅创建一次
        this.openai = new OpenAI({
            apiKey:yapi.WEBCONFIG.openAi.apiKey,
            baseURL:yapi.WEBCONFIG.openAi.baseURL,
            moel:yapi.WEBCONFIG.openAi.model
        });
    }
    /**
     * openai聊天
     * @interface /chat
     * @method POST
     * @category openai
     * @foldnumber 10
     * @param {String} message
     * @returns {Object}
     * @example 
     */
    async chat(ctx) {
        let message = ctx.request.body.message;
        try{
            let result = await this.openai.chat.completions.create({
                model: this.model,
                store: true,
                messages: [
                    {"role": "user", "content": message},
                ],
            });
            return (ctx.body = result.choices[0].message.content)
        }catch(e){
            console.log(e);
            return ctx.body = yapi.commons.resReturn(null, 402, e.message);
        }

    }
    /**
     * openai根据prompt生成用例
     * @interface /creatcaselib
     * @method POST
     * @category openai
     * @foldnumber 10
     * @param {String} message
     * @returns {Object}
     * @example 
     */
    async creatCaselib(ctx) {
        let message = ctx.request.body.demandDesc;
        let prompt = ctx.request.body.promptDesc;
        let demandid = ctx.request.body.demandid;
        if(demandid==0){
            return ctx.body = yapi.commons.resReturn(null, 402, '请选择具体生成的需求id');
        }
        try{
            let result = await this.openai.chat.completions.create({
                model: this.openai.model,
                store: true,
                temperature:0.5,//生成结果随机性
                top_p:0.8,//随机性概率，前80%
                response_format: { type: "json_object" },
                messages: [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": message}
                ],
            });
            let rawContent = result.choices[0].message.content.trim();
            // 转换为JSON对象
            let casedata = JSON.parse(rawContent).test_cases;
            if(casedata&&casedata.length>0){
                for(let i=0;i<casedata.length;i++){
                    let item = casedata[i];
                    let oldcase =await this.caseLibModel.info(demandid,item.title,item.model,item.submodel);
                    if(oldcase){
                      continue;
                    }
                    if(!item.submodel){
                        item.submodel = '';
                    }
                    let data = {
                      demandid: demandid,
                      title: item.title,
                      model: item.model,
                      submodel: item.submodel,
                      preconditions: item.preconditions,
                      step: item.step,
                      expect: item.expect,
                      remarks: item.remarks,
                      priority: item.priority,
                      uid: this.getUid(),
                      status: item.status,
                      add_time: yapi.commons.time()
                    };
                
                    await this.caseLibModel.save(data);
                }
            }
            // 返回处理后的数据
            return (ctx.body = yapi.commons.resReturn(casedata, 0, null));
        }catch(e){
            return ctx.body = yapi.commons.resReturn(null, 402, e.message);
        }

    }

    /**
     * openai根据prompt生成用例
     * @interface /creatcase
     * @method POST
     * @category openai
     * @foldnumber 10
     * @param {String} message
     * @returns {Object}
     * @example 
     */
    async creatCase(ctx) {
        let params = ctx.request.body;

        if (!params.project_id) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
          }
    
        if (!params.interface_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空'));
        }

        let auth = await this.checkAuth(params.project_id, 'project', 'edit');
        if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }

        if (!params.col_id||params.col_id.length == 0) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口集id不能为空'));
        }

        if (!params.casename) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '用例名称不能为空'));
        }

        if(params.col_id&&params.col_id.length>0){
            if(params.col_id.length>1){
                return (ctx.body = yapi.commons.resReturn(null, 400, '只允许在一个集合内生成'));
            }
            params.col_id = params.col_id[0]
        }
        let prompt = `你现在是一个专业的测试人员，可以按照接口参数模板例如json_schema给我生成相关的接口参数用例，
        并且我的参数可以使用mock，使用的是mockjs1.x版本，其使用mock入参时需要{{@float}}这样表示，
        下面我会给你接口参数模板后请输出测试用例,测试用例以json的方式给我。用例的要求：
        1. 根据入参条件生成多个用例，主要从等价类、边界值、判定表等用例设计方法进行设计,包含正确入参错误入参等
        2. 生成的主key名为test_cases，每个用例的名称key为case且为中文,参数的key为parameters
        3. 输出前请检查格式要求和内容要求是否满足。`;
        let message;
        switch (params.req_body_type)
        {
            case "json":message=params.req_body_other;
            break;
            // case "form":message=JSON.stringify(params.req_body_form);
            // break
            default:
                message="";
        }
        if(!message){
            return (ctx.body = yapi.commons.resReturn(null, 400, '暂不支持该参数类型的生成'));
        }
        try{
            let result = await this.openai.chat.completions.create({
                model: this.openai.model,
                store: true,
                temperature:0.5,//生成结果随机性
                top_p:0.8,//随机性概率，前80%
                response_format: { type: "json_object" },
                messages: [
                    {"role": "system", "content": prompt},
                    // {"role": "user", "content": message},//mock函数文档
                    {"role": "user", "content": message}//参数schmea
                ],
            });
            let rawContent = result.choices[0].message.content.trim();
            // 转换为JSON对象
            let casedata = JSON.parse(rawContent).test_cases;
            if(casedata&&casedata.length>0){
                for(let i=0;i<casedata.length;i++){
                    let item = JSON.parse(JSON.stringify(casedata[i]));
                    let lastindex = await this.caseModel.findByIdforIndex(params.project_id,params.col_id);
                    if(lastindex==null||lastindex=='undefind'||!lastindex){
                      lastindex = {};
                      lastindex['index'] = 0;
                    }
                    params.casename = item.case;
                    params.req_body_other = JSON.stringify(item.parameters);
                    params.uid = this.getUid();
                    params.index = lastindex.index+1;
                    params.add_time = yapi.commons.time();
                    params.up_time = yapi.commons.time();
                    await this.caseModel.save(params);
                }
            }
            return (ctx.body = yapi.commons.resReturn(casedata, 0, null));
        }catch(e){
            return ctx.body = yapi.commons.resReturn(null, 402, e.message);
        }

    }
}
module.exports = openaiController;