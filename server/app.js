process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

const yapi = require('./yapi.js');
const commons = require('./utils/commons');
yapi.commons = commons;
const dbModule = require('./utils/db.js');
yapi.connect = dbModule.connect();
const mockServer = require('./middleware/mockServer.js');
const plugins = require('./plugin.js');
const websockify = require('koa-websocket');
const websocket = require('./websocket.js');
const storageCreator = require('./utils/storage')

const Koa = require('koa');
const koaStatic = require('koa-static');
// const bodyParser = require('koa-bodyparser');
const koaBody = require('koa-body');
const router = require('./router.js');

// const tunnel = require('tunnel-ssh');
// const fsl = require('fs');

// // mysqlssh线上不需要
// const mysqlconfig = {
//   keepAlive: true,

//   // host1
//   host: '148.70.169.61',
//   port: 22,
//   username: 'testeryyl',
//   privateKey: fsl.readFileSync('C:\\Users\\yyl\\.ssh\\id_rsa'),

//   // 内网主机/目标主机 host2 
//   dstHost: '172.16.255.24', //
//   dstPort: 4000,

//   // 本地host port
//   localHost: '127.0.0.1',
//   localPort: 3306
// };
// tunnel(mysqlconfig, function (err) {
//   if(err){
//       console.log(err);
//       return;
//   }else{
//     console.log('SSH tunnel connected');
//   }
// });

// // redis线上不需要
// const redisconfig = {
//   keepAlive: true,
//   // host1
//   host: '148.70.169.61',
//   port: 22,
//   username: 'testeryyl',
//   privateKey: fsl.readFileSync('C:\\Users\\yyl\\.ssh\\id_rsa'),

//   // 内网主机/目标主机 host2 
//   dstHost: '172.16.255.58', // '172.16.255.93' wss正式：10.0.0.31 19000  
//   dstPort: 6379,

//   // 本地host port
//   localHost: '127.0.0.1',
//   localPort: 6379
// };
// tunnel(redisconfig, function (err) {
//   if(err){
//       console.log(err);
//       return;
//   }else{
//       console.log('SSH tunnel connected');
//   }
// });
// // redis线上不需要
// const redisconfig2 = {
//   keepAlive: true,
//   // host1
//   host: '148.70.169.61',
//   port: 22,
//   username: 'testeryyl',
//   privateKey: fsl.readFileSync('C:\\Users\\yyl\\.ssh\\id_rsa'),

//   // 内网主机/目标主机 host2 
//   dstHost: '172.16.255.93', // '172.16.255.93' wss正式：10.0.0.31 19000  
//   dstPort: 6379,

//   // 本地host port
//   localHost: '127.0.0.1',
//   localPort: 6378
// };
// tunnel(redisconfig2, function (err) {
//   if(err){
//       console.log(err);
//       return;
//   }else{
//       console.log('SSH tunnel connected');
//   }
// });
global.storageCreator = storageCreator;
let indexFile = process.argv[2] === 'dev' ? 'dev.html' : 'index.html';

const app = websockify(new Koa());
app.proxy = true;
yapi.app = app;

// app.use(bodyParser({multipart: true}));
app.use(koaBody({ multipart: true, jsonLimit: '50mb', formLimit: '50mb', textLimit: '50mb' }));
app.use(mockServer);
app.use(router.routes());
app.use(router.allowedMethods());

websocket(app);

app.use(async (ctx, next) => {
  if (/^\/(?!api)[a-zA-Z0-9\/\-_]*$/.test(ctx.path)) {
    ctx.path = '/';
    await next();
  } else {
    await next();
  }
});

app.use(async (ctx, next) => {
  if (ctx.path.indexOf('/prd') === 0) {
    ctx.set('Cache-Control', 'max-age=8640000000');
    if (yapi.commons.fileExist(yapi.path.join(yapi.WEBROOT, 'static', ctx.path + '.gz'))) {
      ctx.set('Content-Encoding', 'gzip');
      ctx.path = ctx.path + '.gz';
    }
  }
  await next();
});

app.use(koaStatic(yapi.path.join(yapi.WEBROOT, 'static'), { index: indexFile, gzip: true }));

app.listen(yapi.WEBCONFIG.port,'0.0.0.0');
commons.log(
  `服务已启动，请打开下面链接访问: \nhttp://0.0.0.0${
    yapi.WEBCONFIG.port == '80' ? '' : ':' + yapi.WEBCONFIG.port
  }/`
);
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
  // 错误处理逻辑...
});