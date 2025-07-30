const baseController = require('./base.js');
const caselibModel = require('../models/caselib.js');
const caseModel = require('../models/interfaceCase.js');
const globalModel = require('../models/global.js');
const yapi = require('../yapi.js');
const OpenAI = require('openai');

var openai = null;
var lastInitTime = 0;
var initializationInProgress = false;
var INIT_INTERVAL = 3600000; // 1小时
class openaiController extends baseController {
    constructor() {
        super();
        this.caseLibModel = yapi.getInst(caselibModel);
        this.caseModel = yapi.getInst(caseModel);
        this.globalModel = yapi.getInst(globalModel);
    }
    async getAiInstance() {
        const now = Date.now();
        // console.log('this.openai:', openai,lastInitTime,initializationInProgress);
        //获取最新的配置
        let globalconfigdata = await this.globalModel.getconfig();
        let globalconfig = JSON.parse(globalconfigdata.config);
        // 如果已经初始化并且配置未变，直接返回实例
        if (
            openai &&
            now - lastInitTime < INIT_INTERVAL &&
            openai._options.apiKey === globalconfig.openAi.apiKey &&
            openai._options.model === globalconfig.openAi.model &&
            openai._options.baseURL === globalconfig.openAi.baseURL
        ) {
            return openai;
        }

        // 防止并发初始化
        if (initializationInProgress) {
            console.log('等待其他请求初始化完成');
            // 等待初始化完成
            while (initializationInProgress) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return openai;
        }

        // 开始新的初始化
        initializationInProgress = true;
        await this.initAi();
        initializationInProgress = false;
        return openai;
    }

    async initAi() {
        try {
            let globalconfigdata = await this.globalModel.getconfig();
            let globalconfig = JSON.parse(globalconfigdata.config);
            
            openai = new OpenAI({
                apiKey: globalconfig.openAi.apiKey,
                baseURL: globalconfig.openAi.baseURL,
                model: globalconfig.openAi.model
            });
            
            lastInitTime = Date.now();
            console.log('OpenAI client initialized successfully');
            return openai;
        } catch (error) {
            console.error('Failed to initialize OpenAI client:', error);
            throw error;
        }
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
            const ai = await this.getAiInstance();
            let result = await ai.chat.completions.create({
                model: ai._options.model,
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
        
        if(demandid == 0){
            return ctx.body = yapi.commons.resReturn(null, 402, '请选择具体生成的需求id');
        }
        
        try {
            const ai = await this.getAiInstance();

            // 初始化变量
            let allContent = "";
            let isComplete = false;
            let continuationCount = 0;
            const MAX_ATTEMPTS = 5; // 最大尝试次数
            
            console.log('开始生成测试用例...');
            
            // 第一次生成
            let result = await ai.chat.completions.create({
                model: ai._options.model,
                store: true,
                temperature: 0.3,
                top_p: 1,
                max_tokens: 4000,
                response_format: { type: "json_object" },
                messages: [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": message}
                ],
            });
            
            let rawContent = result.choices[0].message.content.trim();
            allContent = rawContent;
            
            // 检查是否为有效的 JSON
            let parsedContent = yapi.commons.safeParse(allContent);
            // console.log("parsedContent",parsedContent);
            // 如果不是有效 JSON 或者明显不完整，进行后续生成
            while ((!parsedContent.success || !allContent.includes('"test_cases"')) && continuationCount < MAX_ATTEMPTS) {
                continuationCount++;
                console.log(`内容不完整，进行第 ${continuationCount} 次续写...`);
                
                // 构建续写提示
                const continuationPrompt = `之前你正在生成测试用例，但内容似乎不完整。请继续生成完整的JSON格式测试用例。
确保包含test_cases数组，并且所有JSON括号闭合正确。`;
                
                try {
                    // 进行续写请求
                    let continuationResult = await ai.chat.completions.create({
                        model: ai._options.model,
                        store: true,
                        temperature: 0.2, // 降低随机性以保持一致性
                        top_p: 1,
                        max_tokens: 4000,
                        response_format: { type: "json_object" },
                        messages: [
                            {"role": "system", "content": enhancedPrompt},
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": allContent},
                            {"role": "user", "content": continuationPrompt}
                        ],
                    });
                    
                    let continuationContent = continuationResult.choices[0].message.content.trim();
                    
                    // 尝试处理可能的部分内容问题
                    if (continuationContent.startsWith('```json')) {
                        continuationContent = continuationContent.substring(7);
                    }
                    if (continuationContent.endsWith('```')) {
                        continuationContent = continuationContent.substring(0, continuationContent.length - 3);
                    }
                    
                    // 合并内容
                    // 如果前一个响应不完整（可能缺少结尾括号），尝试智能合并
                    if (allContent.endsWith(',') || allContent.endsWith('{') || allContent.endsWith('[')) {
                        allContent += continuationContent;
                    } else if (continuationContent.startsWith(',') || continuationContent.startsWith('}') || continuationContent.startsWith(']')) {
                        allContent += continuationContent;
                    } else {
                        // 尝试查找 JSON 边界
                        const lastBraceIndex = Math.max(allContent.lastIndexOf('}'), allContent.lastIndexOf(']'));
                        const firstBraceIndex = Math.min(
                            continuationContent.indexOf('{') !== -1 ? continuationContent.indexOf('{') : Infinity,
                            continuationContent.indexOf('[') !== -1 ? continuationContent.indexOf('[') : Infinity
                        );
                        
                        if (lastBraceIndex !== -1 && firstBraceIndex !== Infinity) {
                            allContent = allContent.substring(0, lastBraceIndex) + continuationContent.substring(firstBraceIndex);
                        } else {
                            // 无法智能合并，直接拼接
                            allContent += " " + continuationContent;
                        }
                    }
                    
                    // 再次检查是否为有效 JSON
                    parsedContent = yapi.commons.safeParse(allContent);
                    
                    // 检查是否包含所需的关键数据，如果包含且解析正确则结束循环
                    if (parsedContent.success && allContent.includes('"test_cases"')) {
                        isComplete = true;
                        break;
                    }
                    
                    // 如果已经合并了多段仍无法得到有效 JSON，尝试重新生成一个完整 JSON
                    if (continuationCount >= 3 && !parsedContent.success) {
                        console.log('多次续写仍未得到有效 JSON，尝试重新生成完整结构...');
                        
                        const fixPrompt = `之前生成的内容似乎有问题。请重新生成一个完整的、格式正确的 JSON 响应，包含 test_cases 数组。
请确保响应格式如下：
{
  "test_cases": [
    {
      "title": "测试用例标题",
      "model": "模块",
      "submodel": "子模块",
      "preconditions": "前置条件",
      "step": "测试步骤",
      "expect": "预期结果",
      "remarks": "备注",
      "priority": "优先级",
      "status": "状态"
    },
    // 更多测试用例...
  ]
}`;
                        
                        let fixResult = await ai.chat.completions.create({
                            model: ai._options.model,
                            store: true,
                            temperature: 0.1,
                            top_p: 1,
                            max_tokens: 4000,
                            response_format: { type: "json_object" },
                            messages: [
                                {"role": "system", "content": prompt},
                                {"role": "user", "content": message},
                                {"role": "user", "content": fixPrompt}
                            ],
                        });
                        
                        allContent = fixResult.choices[0].message.content.trim();
                        parsedContent = yapi.commons.safeParse(allContent);
                        
                        if (parsedContent.success) {
                            isComplete = true;
                            break;
                        }
                    }
                } catch (continuationError) {
                    console.error('续写生成过程出错:', continuationError);
                    // 继续尝试下一次生成
                }
            }
            
            console.log(`测试用例生成完成，共进行了 ${continuationCount} 次续写`);
            
            // 如果生成完成但仍不是有效 JSON，返回错误
            if (!parsedContent.success) {
                return ctx.body = yapi.commons.resReturn(null, 402, '生成内容格式有误，请重试或分批生成');
            }
            
            // 解析测试用例内容
            let testCasesData;
            try {
                const jsonData = JSON.parse(allContent);
                testCasesData = jsonData.test_cases || [];
                
                if (!Array.isArray(testCasesData) || testCasesData.length === 0) {
                    return ctx.body = yapi.commons.resReturn(null, 402, '生成的测试用例内容为空或格式不正确');
                }
            } catch (jsonError) {
                return ctx.body = yapi.commons.resReturn(null, 402, '解析生成的内容失败: ' + jsonError.message);
            }
            
            // 保存测试用例到数据库
            let savedCount = 0;
            for (let i = 0; i < testCasesData.length; i++) {
                let item = testCasesData[i];
                
                // 检查是否已存在相同用例
                let oldcase = await this.caseLibModel.info(demandid, item.title, item.model, item.submodel);
                if (oldcase) {
                    continue;
                }
                
                // 处理可能的空值
                if (!item.submodel) {
                    item.submodel = '';
                }
                
                // 确保所有必需字段都存在
                const data = {
                    demandid: demandid,
                    title: item.title || '未命名用例',
                    model: item.model || '未分类',
                    submodel: item.submodel || '',
                    preconditions: item.preconditions || '',
                    step: item.step || '',
                    expect: item.expect || '',
                    remarks: item.remarks || '',
                    priority: item.priority || 'P2',
                    uid: this.getUid(),
                    status: item.status || 'todo',
                    add_time: yapi.commons.time()
                };
                
                await this.caseLibModel.save(data);
                savedCount++;
            }
            
            console.log(`成功保存 ${savedCount} 个测试用例`);
            isComplete = true;
            // 返回处理后的数据
            return (ctx.body = yapi.commons.resReturn({
                test_cases: testCasesData,
                total_generated: testCasesData.length,
                total_saved: savedCount,
                continuation_count: continuationCount
            }, 0, isComplete ? '用例生成成功' : '用例已生成，但可能不完整'));
        } catch (e) {
            console.error('生成测试用例过程中发生错误:', e);
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
        3. 生成的用例名称尽量详细一点
        4. 输出前请检查格式要求和内容要求是否满足。`;
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
            const ai = await this.getAiInstance();
            let result = await ai.chat.completions.create({
                model: ai._options.model,
                store: true,
                temperature:0.3,//生成结果随机性
                top_p:1,//随机性概率，前80%
                max_tokens:4000,
                response_format: { type: "json_object" },
                messages: [
                    {"role": "system", "content": prompt},
                    // {"role": "user", "content": message},//mock函数文档
                    {"role": "user", "content": message}//参数schmea
                ],
            });
            let rawContent = result.choices[0].message.content.trim();
            let rawContentdata = yapi.commons.safeParse(rawContent);
            if(!rawContentdata.success){
                return ctx.body = yapi.commons.resReturn(null, 402, '请分批生成');
            }
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