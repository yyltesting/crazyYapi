// 连接redis
const redis = require('ioredis');

// const options = {
//     cluster: [
//         {    
//             host: '127.0.0.1',
//             port: 6379
//         }
//     ],
//     password: 'xap4eh0OLa3eequ4Geiteing4Ozootha',
//     retryDelayOnFailover: 3000
// }
    // enableReadyCheck: true,
    // slotsRefreshTimeout: 10000,
var ConnectionList = [];

function Connecttion(envid,data) {
    var isc = 0;
    var Cluster = data.Cluster;
    var poollist = [];
    if(Cluster){
        for(let j =1;j<=parseInt(Cluster);j++){
            poollist.push({
                host: data['host'+j], 
                port: parseInt(data['port'+j])
            })
        }
    }
    for(let i =0;i<ConnectionList.length;i++){
        //更新连接
        if(Object.keys(ConnectionList[i])==envid){
            isc = 1;
            let pool;
            if(data.Cluster){
                pool = new redis.Cluster(poollist,{
                    redisOptions: {
                        // 如果集群需要密码，也需要在这里指定
                        password: data.password
                    }
                })
            }else{
                pool =new redis(
                    {
                        host: data.host, 
                        port: parseInt(data.port), 
                        user: data.user,
                        password: data.password
                    }
        
                );
            }
            ConnectionList[i] = {[envid]:pool} ;
            return new Promise((resolve) => {
                pool.on('ready', () => {
                    resolve('成功连接到 Redis');
                    // 执行 Redis 操作
                    // ...
                });
    
                pool.on('error', (error) => {
                    resolve('无法连接到 Redis:', error);
                });
            })
        }
    }
    if(isc==0){
        //新增连接
        let pool;
        if(data.Cluster){
            pool = new redis.Cluster(poollist,{
                redisOptions: {
                    // 如果集群需要密码，也需要在这里指定
                    password: data.password
                }
            })

        }else{
            pool =new redis(
                {
                    host: data.host, 
                    port: parseInt(data.port), 
                    user: data.user,
                    password: data.password
                }
    
            );
        }
        let key = envid;
        let conf = {[key]:pool};
        ConnectionList.push(conf);
        return new Promise((resolve) => {
            // console.log('aaaa',pool);
            pool.on('ready', () => {
                resolve('成功连接到 Redis');
                // 执行 Redis 操作
                // ...
            });

            pool.on('error', (error) => {
                resolve('无法连接到 Redis:', error);
            });

            // try{
            //     console.log('str',envid,data)
            //     resolve('查询值')
            // }catch(err){
            //     resolve('错误值',err)
            // }
        })
    }
}


function Connect(envid,str,type,value) {
    let connection;
    let isc = 0;
    //判断是否连接
    for(let i =0;i<ConnectionList.length;i++){
      //已连接
      if(Object.keys(ConnectionList[i])==envid){
        isc = 1;
        connection =  ConnectionList[i][envid];
        return new Promise(async (resolve, reject) => {
            try{
                let keytype = await connection.type(str);
                if(type == 'del'){
                    connection.del(str, (err, result) => {
                        // console.log('get result:%j, err:%j', result, err);
                        reject(result)
                    });
                }
                if(keytype=='string'){
                    if(type=='get'){
                        connection.get(str, (err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    if(type=='edit'){
                        connection.set(str, value,(err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    
                }else if(keytype=='hash'){
                    if(type=='get'){
                        connection.hgetall(str, (err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    
                }else if(keytype=='list'){
                    if(type=='get'){
                        connection.lrange(str, (err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    
                }else if(keytype=='set'){
                    if(type=='get'){
                        connection.smembers(str, (err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    
                }else if(keytype=='zset'){
                    if(type=='get'){
                        connection.zscan(str,0, (err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    
                }else{
                    if(type=='get'){
                        connection.get(str, (err, result) => {
                            // console.log('get result:%j, err:%j', result, err);
                            reject(result)
                        });
                    }
                    
                }
            }catch(error){
                resolve(error)
            }
      
          // try{
          //   console.log('str',str)
          //   reject('查询值')
          // }catch(err){
          //   resolve('错误值',err)
          // }
      
        }
        )
      }
    }
    if(isc==0){
      return new Promise((resolve, reject) => {
        reject('当前环境redis未连接')
      })
    }
  }
  
  
  
  exports.Connect = Connect;
  exports.Connecttion = Connecttion;