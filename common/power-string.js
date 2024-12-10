/**
 * @author yyl
 */

const aUniqueVerticalStringNotFoundInData = '___UNIQUE_VERTICAL___';
const aUniqueCommaStringNotFoundInData = '___UNIQUE_COMMA___';
const segmentSeparateChar = '|';
const methodAndArgsSeparateChar = ':';
const argsSeparateChar = ',';

const md5 = require('md5');
const sha = require('sha.js');
const Base64 = require('js-base64').Base64;
const bs58 = require('bs58');

const Web3 = require('web3');
const CryptoJS = require('crypto-js');

const firebase = require('firebase');
// import * as firebase from 'firebase';

const stringHandles = {
  firebasesgin: async function(){
    try{
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
      const result = await firebase.auth().signInWithPopup(provider);
      // 登录成功，获取用户信息
      const user = result.user;
      console.log('User:', user);
      // 获取用户的 ID 令牌
      const idToken = await user.getIdToken();
      // 获取用户的 ID 令牌成功，可以在这里使用令牌进行其他操作
      console.log('ID Token:', idToken);
      let data={};
      data.email = user.email;
      data.token = idToken;
      return data;
    }catch(error){
      // 处理登录失败的逻辑
      console.error(error);
      return error;
    }
  },
  ethsign: async function(str){  
    if(typeof window === 'undefined'){
      return '服务端不支持eth签名'
    }else{
      const web = await new Web3(window.ethereum);
      return await web.eth.personal.sign(str, web.currentProvider.selectedAddress);
    }
  },
  //谷歌登录
  oauth2SignIn:function(str){
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {
      'client_id': str,
      'redirect_uri':window.location.origin+'/Oauth2',
      'response_type': 'token',
      'scope': 'https://www.googleapis.com/auth/drive.metadata.readonly',
      'include_granted_scopes': 'true',
      'state': 'yapi'
    };
    
    // Construct the OAuth 2.0 URL with parameters
    var url = oauth2Endpoint + '?' + new URLSearchParams(params);
    
    // Open a new window or tab for OAuth 2.0 authentication
    window.open(url, '_blank','width=500,height=600');
    
  },
  //谷歌退出
  revokeAccess:function(str){
    var revokeTokenEndpoint = 'https://oauth2.googleapis.com/revoke';
    
    var form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', revokeTokenEndpoint);
    
    var tokenField = document.createElement('input');
    tokenField.setAttribute('type', 'hidden');
    tokenField.setAttribute('name', 'token');
    tokenField.setAttribute('value', str);
    form.appendChild(tokenField);
    
    var newWindow = window.open('', '_blank');
    form.target = '_blank';
    newWindow.document.body.appendChild(form);
    form.submit();
    
  },
  //手机号
  phone:function(){
    var numArray = new Array("139","138","137","136","135","134","159","158","157","150","151","152","188","187","182","183","184","178","130","131","132","156","155","186","185","176","133","153","189","180","181","177");  //这是目前找到的除了数据卡外的手机卡前三位，类型是字符串数组
    var arraryLength = numArray.length;  //获取数组长度，这样如果手机号前三位取值单位发生变化，在下一步求i的地方就不用修改随机数取值范围了
    var i = parseInt( Math.random() * arraryLength); //注意乘以的是上面numArray数组的长度，这样就可以取出数组中的随机一个数。random的取值范围是大于等于0.0，小于1.0，相乘后得到的就是0到（数组长度-1）的值。
    var num = numArray[i];  //取出随机的手机号前三位并赋值给num，手机号前三位是字符串类型的
    for ( var j = 0; j < 8; j++){
      num = num + Math.floor(Math.random() * 10);   //num是字符串，后面的数字被当做字符串。所以变成两个字符串拼接了
    }
    return num;
  },
  //身份证
  idcard:function(){
    var coefficientArray = [ "7","9","10","5","8","4","2","1","6","3","7","9","10","5","8","4","2"];// 加权因子
    var lastNumberArray = [ "1","0","X","9","8","7","6","5","4","3","2"];// 校验码
    var address = "420101"; // 住址
    var birthday = "19810101"; // 生日
    var s = Math.floor(Math.random()*10).toString() + Math.floor(Math.random()*10).toString() + Math.floor(Math.random()*10).toString();
    var array = (address + birthday + s).split("");
    var total = 0;
    for(var i in array){
      total = total + parseInt(array[i])*parseInt(coefficientArray[i]);
    }
    var lastNumber = lastNumberArray[parseInt(total%11)];
    var id_no_String = address + birthday + s + lastNumber;
    return id_no_String;
  },
  //银行卡号
  bancard:function(Str) {
    if(Str){
      var prefix = "";
      switch (Str) {
          case "0102":
              prefix = "622202";
          break;
          case "0103":
              prefix = "622848";
          break;
          case "0105":
              prefix = "622700";
          break;
          case "0301":
              prefix = "622262";
          break;
          case "104":
              prefix = "621661";
          break;
          case "0303":
              prefix = "622666";
          break;
          case "305":
              prefix = "622622";
          break;
          case "0306":
              prefix = "622556";
          break;
          case "0308":
              prefix = "622588";
          break;
          case "0410":
              prefix = "622155";
          break;
          case "302":
              prefix = "622689";
          break;
          case "304":
              prefix = "622630";
          break;
          case "309":
              prefix = "622908";
          break;
          case "310":
              prefix = "621717";
          break;
          case "315":
              prefix = "622323";
          break;
          case "316":
              prefix = "622309";
          break;
          default:
      }
      for (var j = 0; j < 13; j++) {
        prefix = prefix + Math.floor(Math.random() * 10);
      }
      return prefix
    }else{
      var numArray = new Array("622202","622848","622700","622262","621661","622666","622622","622556","622588","622155","622689","622630","622908","621717","622323","622309");  //这是目前找到的除了数据卡外的银行卡前六位，类型是字符串数组
      var arraryLength = numArray.length;  //获取数组长度，这样如果银行卡号前六位取值单位发生变化，在下一步求i的地方就不用修改随机数取值范围了
      var i = parseInt( Math.random() * arraryLength); //注意乘以的是上面numArray数组的长度，这样就可以取出数组中的随机一个数。random的取值范围是大于等于0.0，小于1.0，相乘后得到的就是0到（数组长度-1）的值。
      var num = numArray[i];  //取出随机的手机号前六位并赋值给num，手机号前六位是字符串类型的
      for ( var l = 0; l< 13; l++){
        num = num + Math.floor(Math.random() * 10);   //num是字符串，后面的数字被当做字符串。所以变成两个字符串拼接了
      }
      return num;
    }
  },
  //时间戳
  timestamp: function(str){
    var startDate;
    if(str.split('-')[1]>0){
      startDate = Math.round(new Date(str).getTime()/1000);
      return startDate;
    }else{
      var curTime = Math.round(new Date().getTime()/1000);
      startDate = curTime + (str * 3600 * 24);
      return startDate;
    }
  },
  //时间戳ms
  timestampms: function(str){
    var startDate;
    if(str.split('-')[1]>0){
      startDate = Math.round(new Date(str).getTime());
      return startDate;
    }else{
      var curTime = Math.round(new Date().getTime());
      startDate = curTime + (str * 3600 * 24);
      return startDate;
    }
  },
  //整除
  tobedivisibleby: function(str,...args){
    let result;
    args.forEach(item => {
      result = Math.floor(str / item);
    });
    
    return result.toString();
  },
  //DES加密
  encodeDES:function(str,...args){
    let AuthTokenKey = args[0]; //DES密钥
    let AuthTokenIv = args[1]; //DES向量
    let dataStr = str;
    let encrypted = CryptoJS.DES.encrypt(dataStr, CryptoJS.enc.Latin1.parse(AuthTokenKey), {
      iv: CryptoJS.enc.Latin1.parse(AuthTokenIv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  },
  //AES加密
  encodeAES:function(str,...args){
    let AuthTokenKey = args[0]; //AES密钥
    let AuthTokenIv = args[1]; //AES向量
    let dataStr = str;
    let encrypted = CryptoJS.AES.encrypt(dataStr, CryptoJS.enc.Latin1.parse(AuthTokenKey), {
      iv: CryptoJS.enc.Latin1.parse(AuthTokenIv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  },
  //生成随机图片base64
  imgBase64:function(){
    var base64String;
    if(typeof window === 'undefined'){
      let dataRandom = CryptoJS.lib.WordArray.random(1024);
      base64String = CryptoJS.enc.Base64.stringify(dataRandom);
      return 'data:image/png;base64,'+base64String
    }else{
      // 创建一个canvas元素
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      // 设置canvas的宽度和高度
      canvas.width = 200;
      canvas.height = 200;

      // 生成随机的颜色
      var red = Math.floor(Math.random() * 256);
      var green = Math.floor(Math.random() * 256);
      var blue = Math.floor(Math.random() * 256);

      // 在canvas上绘制一个随机颜色的矩形
      ctx.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 将canvas转换为Base64字符串
      base64String = canvas.toDataURL();

      // 输出Base64字符串
      return base64String

    }
  },

  bs58Encode: function(str){
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    // const uint8Array = Buffer.from(str, 'utf8'); //更适合nodejs下使用
    return bs58.encode(uint8Array);
  },

  md5: function(str) {
    return md5(str);
  },

  sha: function(str, arg) {
    return sha(arg)
      .update(str)
      .digest('hex');
  },

  /**
   * type: sha1 sha224 sha256 sha384 sha512
   */
  sha1: function(str) {
    return sha('sha1')
      .update(str)
      .digest('hex');
  },

  sha224: function(str) {
    return sha('sha224')
      .update(str)
      .digest('hex');
  },

  sha256: function(str) {
    return sha('sha256')
      .update(str)
      .digest('hex');
  },

  sha384: function(str) {
    return sha('sha384')
      .update(str)
      .digest('hex');
  },

  sha512: function(str) {
    return sha('sha512')
      .update(str)
      .digest('hex');
  },

  base64: function(str) {
    return Base64.encode(str);
  },

  unbase64: function(str) {
    return Base64.decode(str);
  },

  substr: function(str, ...args) {
    return str.substr(...args);
  },

  concat: function(str, ...args) {
    args.forEach(item => {
      str += item;
    });
    return str;
  },

  lconcat: function(str, ...args) {
    args.forEach(item => {
      str = item + this._string;
    });
    return str;
  },

  lower: function(str) {
    return str.toLowerCase();
  },

  upper: function(str) {
    return str.toUpperCase();
  },

  length: function(str) {
    return str.length;
  },

  number: function(str) {
    return !isNaN(str) ? +str : str;
  }
};

let handleValue = function(str) {
  return str;
};

const _handleValue = function(str) {
  if (str[0] === str[str.length - 1] && (str[0] === '"' || str[0] === "'")) {
    str = str.substr(1, str.length - 2);
  }
  return handleValue(
    str
      .replace(new RegExp(aUniqueVerticalStringNotFoundInData, 'g'), segmentSeparateChar)
      .replace(new RegExp(aUniqueCommaStringNotFoundInData, 'g'), argsSeparateChar)
  );
};

class PowerString {
  constructor(str) {
    this._string = str;
  }

  toString() {
    return this._string;
  }
}

function addMethod(method, fn) {
  PowerString.prototype[method] = function(...args) {
    args.unshift(this._string + '');
    this._string = fn.apply(this, args);
    return this;
  };
}

function importMethods(handles) {
  for (let method in handles) {
    addMethod(method, handles[method]);
  }
}

importMethods(stringHandles);

function handleOriginStr(str, handleValueFn) {
  if (!str) return str;
  if (typeof handleValueFn === 'function') {
    handleValue = handleValueFn;
  }
  str = str
    .replace('\\' + segmentSeparateChar, aUniqueVerticalStringNotFoundInData)
    .replace('\\' + argsSeparateChar, aUniqueCommaStringNotFoundInData)
    .split(segmentSeparateChar)
    .map(handleSegment)
    .reduce(execute, null)
    .toString();
  return str;
}

function execute(str, curItem, index) {
  if (index === 0) {
    let decodeItem = curItem;
    try {
      decodeItem = decodeURIComponent(curItem)
    } catch (e) {
    }
    return new PowerString(decodeItem);
  }
  return str[curItem.method].apply(str, curItem.args);
}

function handleSegment(str, index) {
  str = str.trim();
  if (index === 0) {
    return _handleValue(str);
  }

  let method,
    args = [];
  if (str.indexOf(methodAndArgsSeparateChar) > 0) {
    str = str.split(methodAndArgsSeparateChar);
    method = str[0].trim();
    args = str[1].split(argsSeparateChar).map(item => _handleValue(item.trim()));
  } else {
    method = str;
  }
  if (typeof stringHandles[method] !== 'function') {
    throw new Error(`This method name(${method}) is not exist.`);
  }

  return {
    method,
    args
  };
}

module.exports = {
  utils: stringHandles,
  PowerString,
  /**
   * 类似于 angularJs的 filter 功能
   * @params string
   * @params fn 处理参数值函数，默认是一个返回原有参数值函数
   *
   * @expamle
   * filter('string | substr: 1, 10 | md5 | concat: hello ')
   */
  filter: handleOriginStr
};
