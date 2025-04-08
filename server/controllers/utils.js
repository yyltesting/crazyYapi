const yapi = require('../yapi.js');
const baseController = require('./base.js');

// 连接mysql
const query = require('../utils/database.js');
// 连接redis
const redisquery = require('../utils/redis.js');
// 连接es
const esquery = require('../utils/elasticsearch.js');
//facebyte
const accountMint = require('../utils/wkzsUtils/faceByte.js');
const getStorage = require('../../common/postmanLib').getStorage;

const fs = require('fs');
const path = require('path');

class utilsColController extends baseController {
  /**
   * 获取一个mysql数据库查询值
   * @interface /utils/mysql
   * @method POST
   * @category utils
   * @foldnumber 10
   * @param {String} query
   * @returns {Object}
   * @example
   */
  async Mysqlquery(ctx) {
    let sql = ctx.request.body.query;
    let envid = ctx.request.body.envid;
    try{
      await query.Connect(envid,sql).then((reject)=>{
        console.log('查询结果:',reject);
        ctx.body = yapi.commons.resReturn(reject,200,'成功');
      }
    )
    }catch(err){
      ctx.body = yapi.commons.resReturn(err,200,'成功');
    }
  }
    /**
   * 获取一个redis查询值
   * @interface /utils/redis
   * @method POST
   * @category utils
   * @foldnumber 10
   * @param {String} redisquery
   * @returns {Object}
   * @example
   */
    async Redisquery(ctx) {
        let key = ctx.request.body.query;
        let envid = ctx.request.body.envid;
        let type = ctx.request.body.type;
        let value = ctx.request.body.value;
        try{
        await redisquery.Connect(envid,key,type,value).then((reject)=>{
          console.log('执行结果:',reject);
          ctx.body = yapi.commons.resReturn(reject,200,'成功');
        }
        )
      }catch(err){
        ctx.body = yapi.commons.resReturn(err,200,'成功');
      }
    }
    /**
   * 获取一个es数据库查询值
   * @interface /utils/es
   * @method POST
   * @category utils
   * @foldnumber 10
   * @param {String} index
   * @returns {Object}
   * @example
   */
    async Esquery(ctx) {
      let data = ctx.request.body.body;
      let envid = ctx.request.body.envid;
      let index = ctx.request.body.index;
      let type = ctx.request.body.type;
      try{
        await esquery.search(envid,index,data,type).then((reject)=>{
          console.log('查询结果:',reject);
          ctx.body = yapi.commons.resReturn(reject,200,'成功');
        }
      )
      }catch(err){
        ctx.body = yapi.commons.resReturn(err,200,'成功');
      }
    }
    /**
   * 编辑测试集合数据驱动
   * @interface /utils/setstorage
   * @method POST
   * @category utils
   * @foldnumber 10
   * @param {String} taskId 
   * @param {Number} num
   * @returns {Object}
   * @example 
    */
    async setstorage(ctx){
      try{
        let params = ctx.request.body;
        let taskId = params.taskId;
        let value = params.value;
        let key = params.key;
        const currentStorage = await getStorage(taskId);
        await currentStorage.setItem(key, value);
        ctx.body = yapi.commons.resReturn(null,200,0);
      }catch(e){
        ctx.body = yapi.commons.resReturn(null, 400, e.message);
      }
    }
    /**
   * 生成多层级文件
   * @interface /utils/createMultiLevelDirs
   * @method POST
   * @category utils
   * @foldnumber 10
   * @param {String} baseDir 
   * @param {Number} layers
   * @param {Number} dirsPerLayer
   * @param {Number} fileLength
   * @returns {Object}
   * @example 
    */
    async createMultiLevelDirs(ctx){
      try{
        let params = ctx.request.body;
        let baseDir = params.baseDir;
        let layers = params.layers;
        let dirsPerLayer = params.dirsPerLayer;
        let fileLength = params.fileLength;
          // 清理基础目录
        this.clearDirectory(baseDir);
        this.createDirectories(baseDir, layers, dirsPerLayer,fileLength);
        ctx.body = yapi.commons.resReturn(null,200,0);
      }catch(e){
        ctx.body = yapi.commons.resReturn(null, 400, e.message);
      }
    }

  // 递归创建目录并生成 .dat 文件
  createDirectories = (baseDir, depth, numDirs,fileLength) => {
    if (depth === 0) return;

    for (let i = 0; i < numDirs; i++) {
      const dirName = path.join(baseDir, `dir_${depth}_${i}`);
      
      // 创建目录
      fs.mkdirSync(dirName, { recursive: true });
      
      // 生成 1KB 的 .dat 文件
      const fileName = path.join(dirName, `file_${depth}_${i}.dat`);
      fs.writeFileSync(fileName, Buffer.alloc(fileLength, '0'));

      // 递归创建下一层目录
      this.createDirectories(dirName, depth - 1, numDirs,fileLength);
    }
  };
  // 清空基础目录
  clearDirectory = (dirPath) => {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });  // 删除目录及其内容
    }
    fs.mkdirSync(dirPath);  // 重新创建空的根目录
  };
  /**
   * facebyte登录注册
   * @interface /utils/facebyte/accountMint
   * @method POST
   * @category utils
   * @foldnumber 10
   * @param {String} url
   * @param {String} username
   * @param {String} password
   * @param {String} type // 1:注册 2:mint+poh推送 3:登录
   * @returns {Object}
   * @example
   */
  async accountMint(ctx) {
    let params = ctx.request.body;
    try{
      let result = await accountMint.accountMint(params.url,params.username,params.password,params.type);
      ctx.body = yapi.commons.resReturn(result,200,'成功');
    }catch(err){
      ctx.body = yapi.commons.resReturn(err,200,'成功');
    }
  }
}
module.exports = utilsColController;