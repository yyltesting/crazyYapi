const { Client } = require('@elastic/elasticsearch');

var Esclient = [];
function createClient(envid,data) {
    try{
        var isc = 0;
        for(let i =0;i<Esclient.length;i++){
        //更新连接
        if(Object.keys(Esclient[i])==envid){
            isc = 1;
            let connection = new Client({
                node: data.url,
            });
            Esclient[i] = {[envid]:connection} ;
        }
        }
        if(isc==0){
            //新增连接
            let connection =  new Client({
                node: data.url,
            });
            let key = envid;
            let conf = {[key]:connection};
            Esclient.push(conf);
        }
        return '连接成功'
    }catch(err){
        return '连接失败',err
    }
}

function search(envid,index,data,type) {
    let connection;
    let isc = 0;
    //判断是否连接
    for(let i =0;i<Esclient.length;i++){
      //已连接
      if(Object.keys(Esclient[i])==envid){
        isc = 1;
        connection =  Esclient[i][envid];
        return new Promise((resolve, reject) => {
            if(type == 'del'){
                connection.delete({index:index,id:data}, (error, result)=> {
                    if(error){
                        resolve('删除报错', error)
                    }
                    try {
                        reject(result.statusCode)
                    }catch(err){
                        resolve('删除报错', err)
                    }
                })
            }else{
                connection.search({index:index,body:data}, (error, result)=> {
                    if(error){
                        resolve('查询报错', error)
                    }
                    try {
                        reject(result.body.hits.hits)
                    }catch(err){
                        resolve('查询报错', err)
                    }
                })
            }
        }
    )}
    }
    if(isc==0){
      return new Promise((resolve, reject) => {
        reject('当前es未连接')
      })
    }
  
  }

exports.createClient = createClient;
exports.search = search;