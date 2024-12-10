// 连接mysql
const mysql = require('mysql');
  // var connection = mysql.createPool({
  //   //测试
  //   host: '127.0.0.1',
  //   port: 3306,
  //   //线上
  //   // host: '172.16.255.24',
  //   // port: 4000,
  
  //   // user: 'tester',
  //   // password: 'Ae4ebohf2uChixei8te9eataiyee1aiF',
  //   user: 'coppyadmin',
  //   password: 'baemi7Teighi4nideewoo3veePhah7Th',
  //   // database: 'wxz',
  //   waitForConnection: true,//当无连接池可用时，等待(true) 还是抛错(false)
  //   connectionLimit: 20,//连接限制
  //   queueLimit: 0,//最大连接等待数(0为不限制)
  //   multipleStatements: true//"是否运行执行多条sql语句，默认值为false"
  // });
var ConnectionList = [];

  function Connecttion(envid,data) {
    var isc = 0;
    for(let i =0;i<ConnectionList.length;i++){
      //更新连接
      if(Object.keys(ConnectionList[i])==envid){
        isc = 1;
        let connection = mysql.createPool({
          host: data.host,
          port: data.port,
          user: data.user,
          password: data.password,
          waitForConnection: true,//当无连接池可用时，等待(true) 还是抛错(false)
          connectionLimit: 20,//连接限制
          queueLimit: 0,//最大连接等待数(0为不限制)
          multipleStatements: true//"是否运行执行多条sql语句，默认值为false"
        });
        ConnectionList[i] = {[envid]:connection} ;
        return new Promise((resolve) => {
          connection.getConnection((error, connection) => {
              if (error) {
                resolve('连接数据库出错')
              }else{
                connection.release()
                resolve('连接数据库成功')
              }
          })
        })
      }
    }
    if(isc==0){
      //新增连接
      let connection = mysql.createPool({
        host: data.host,
        port: data.port,
        user: data.user,
        password: data.password,
        waitForConnection: true,//当无连接池可用时，等待(true) 还是抛错(false)
        connectionLimit: 20,//连接限制
        queueLimit: 0,//最大连接等待数(0为不限制)
        multipleStatements: true//"是否运行执行多条sql语句，默认值为false"
      });
      let key = envid;
      let conf = {[key]:connection};
      ConnectionList.push(conf);
      return new Promise((resolve) => {
        connection.getConnection((error, connection) => {
            if (error) {
              resolve('连接数据库出错')
            }else{
              connection.release()
              resolve('连接数据库成功')
            }
        })
      })
    }
  }

function Connect(envid,str) {
  let connection;
  let isc = 0;
  //判断是否连接
  for(let i =0;i<ConnectionList.length;i++){
    //已连接
    if(Object.keys(ConnectionList[i])==envid){
      isc = 1;
      connection =  ConnectionList[i][envid];
      return new Promise((resolve, reject) => {
        connection.getConnection((error, connection) => {
          if (error) {
            console.log('连接数据库出错')
          }
          connection.query(str, function (err, results) {
            try {
              // console.log('The results is: ', results);
              var dataString = JSON.stringify(results);
              var data = JSON.parse(dataString);
              // console.log('数据库查询结果data', data);
              // var query = JSON.stringify(data).replace(/[\r\n]/g,"");
              // console.log('数据库查询结果',query);
              reject(data);
              connection.release();
            } catch (err) {
              resolve('查询报错', err);
            }
          })
        })
    
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
      reject('当前环境数据库未连接')
    })
  }

}



exports.Connect = Connect;
exports.Connecttion = Connecttion;