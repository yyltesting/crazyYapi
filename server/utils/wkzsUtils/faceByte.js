const factory = require("./openfhe_pke_es6.js");
const Web3 = require("web3");
const md5 = require("md5");
async function accountMint(url, userName, password, type) {
  try {
    password = md5(password);
    const web3 = new Web3(); // 创建 Web3 实例
    // 生成一个新的钱包
    var wallet = web3.eth.accounts.create();
    var address = wallet.address;
    console.log("地址:", wallet.address);
    console.log("私钥:", wallet.privateKey);
    var mintData;
    var pohData;
    var authResponse;
    var module = await factory();
    var uid = 0;
    let sertype = module.SerType.BINARY;
    // const URL = "http://localhost:8086/api/v1"
    const URL = url; //'https://face-dev.privasea.ai/api/v1';
    const vector = `[-2.11639272e-04  1.52460048e-02  1.28173856e-02  3.68441129e-03
 -3.33243795e-02  9.86276940e-02 -4.82683890e-02  1.49580225e-01
 -1.43450156e-01  5.02983704e-02 -1.69939324e-02 -1.16514275e-03
  1.57507614e-03  1.26723037e-03 -8.47355346e-04  8.22125077e-02
 -1.02577787e-02 -6.64949650e-03  1.20411897e-02  9.49588232e-03
 -6.18692003e-02  3.51194143e-02  1.58892609e-02  1.12253316e-02
 -3.41581665e-02 -3.82834440e-03 -1.77782644e-02 -3.50590423e-02
  3.85816656e-02  7.37982020e-02 -1.91804278e-03  2.65969157e-01
  1.33612037e-01 -6.35646866e-04 -9.15236697e-02  9.46303830e-02
 -1.14437200e-01 -7.60331843e-03  4.02134610e-03 -8.21687654e-02
  9.44487192e-03  6.37263153e-03  3.90934525e-03 -1.51749514e-03
  1.33896887e-03 -8.19679932e-04  1.32327061e-02  1.59628943e-01
 -4.02351888e-03 -2.10869145e-02 -3.40502113e-02 -7.53838662e-03
 -1.76395793e-02 -2.07090122e-03 -3.26233059e-02 -3.60575679e-04
 -3.04846000e-02  1.39707502e-03 -5.49716242e-02  1.86938792e-02
 -1.73425637e-02 -4.32437286e-02  3.09727471e-02  2.20627412e-01
 -8.51438753e-03 -1.31823763e-01 -4.09829244e-03  4.58966754e-03
  1.75099764e-02 -4.73315857e-04 -2.82130800e-02  5.07348850e-02
 -2.28769720e-01  7.81608000e-03  1.87883899e-01  7.09963916e-03
 -4.46443027e-03 -3.61370202e-03  7.44993007e-03 -2.17561692e-01
 -9.79094487e-03 -5.71682155e-02  6.82011712e-04  1.51544631e-01
 -4.84591424e-02 -1.48168707e-03 -6.57188054e-03 -1.38126627e-01
 -3.88192385e-02  2.12589302e-03 -2.38413319e-01 -2.28526583e-03
  7.28612533e-03 -3.37916501e-02  1.64964989e-01 -1.08234780e-02
  9.03159380e-02  5.06555513e-02 -6.10880740e-03 -1.30040338e-02
  3.03518469e-03 -5.15471259e-03 -2.69955001e-03 -1.99170760e-03
  1.87129008e-05  5.52866654e-03  4.81339991e-02  3.61991604e-03
 -6.23338856e-03  1.74357388e-02 -1.39623314e-01  2.81593576e-03
 -2.73883599e-03  2.70296931e-01  5.81962895e-03 -1.53784931e-01
  1.17525207e-02 -2.80147754e-02  1.32299423e-01  9.36470479e-02
  2.13257596e-01 -3.11549865e-02  1.02607496e-02  2.23391500e-04
  1.01447210e-03  7.44843041e-04  3.30348499e-03 -3.24396556e-03
 -7.16838008e-03  9.99596342e-03  7.85768125e-03  1.19244568e-02
 -1.51683216e-03 -3.28298993e-02 -8.85094181e-02 -7.16894539e-03
 -1.41881227e-01  8.66817534e-02  6.84581976e-03  3.02086142e-03
  9.26061254e-03  3.87082138e-04  3.95931350e-03 -2.05516797e-02
 -5.10812923e-02  6.81883544e-02 -3.15350145e-02 -2.80314661e-03
  1.08410791e-02 -3.73149128e-03 -1.77340787e-02  5.50098345e-03
  5.90365715e-02 -5.21231024e-03 -1.50571659e-03 -2.22107582e-03
 -2.34373496e-03  2.14105677e-02 -1.95364892e-01  9.44733329e-05
 -2.04211753e-02  1.52165315e-03 -1.07866842e-02 -1.27423229e-03
  8.77876487e-03  8.24270211e-03  6.42762706e-03 -4.10088943e-03
 -2.22754927e-04  3.43602174e-03  2.30682850e-01  1.23288482e-02
 -5.57833258e-03  6.47094175e-02 -8.39147903e-03  4.59101191e-03
  5.74299581e-02 -4.89096381e-02 -4.23069391e-03 -1.70843196e-05
  6.51488900e-02  1.39839500e-01  2.62751733e-03 -4.49526124e-03
  1.13684006e-01  5.68975769e-02  3.61485444e-02  6.80587292e-02
  1.06506892e-01 -3.61098796e-02 -4.13128845e-02  4.57541639e-04]`;
    try {
      // module.gen_and_save_sk();
      // Step 1: initial cc begin
      // const multDepth = 1;
      const multDepth = 2;
      const scalingModSize = 50;
      const ringDim = 1 << 14;
      // const batchSize = 8;
      const batchSize = ringDim / 2;
      const securityLevel = module.SecurityLevel.HEStd_128_classic;
      let params = new module.CCParamsCryptoContextCKKSRNS();

      params.SetMultiplicativeDepth(multDepth);
      params.SetSecurityLevel(securityLevel);
      params.SetScalingModSize(scalingModSize);
      params.SetBatchSize(batchSize);
      params.SetRingDim(ringDim);
      let cc = new module.GenCryptoContextCKKS(params);
      cc.Enable(module.PKESchemeFeature.PKE);
      cc.Enable(module.PKESchemeFeature.KEYSWITCH);
      cc.Enable(module.PKESchemeFeature.LEVELEDSHE);
      cc.Enable(module.PKESchemeFeature.ADVANCEDSHE);
      // initial cc end

      console.log(
        `CKKS scheme is using ring dimension ${cc.GetRingDimension()}\n`,
      );

      // 调用facebyte注册用户接口，再进行mint操作
      // Step 2: Key Generation
      const keys = cc.KeyGen();
      cc.EvalMultKeyGen(keys.secretKey);
      const keyTag = keys.secretKey.GetKeyTag();
      const response = await fetch(`${URL}/make_data/register_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          name: userName,
          password,
          key_id: 4,
          key_tag: keyTag,
        }),
      });
      const data = await response.json();
    //   console.log("registerData", data);
      uid = data.data.user_id;
      // Serialize the public key
    //   const publicKeyBuffer = module.SerializePublicKeyToBuffer(
    //     keys.publicKey,
    //     sertype,
    //   );
      // console.log('The public key has been serialized')

      // Serialize the private key
    //   const privateKeyBuffer = module.SerializePrivateKeyToBuffer(
    //     keys.secretKey,
    //     sertype,
    //   );

      const x1 = new module.VectorDouble(vector);
      const ptxt1 = cc.MakeCKKSPackedPlaintext(x1);
      const ct1 = cc.Encrypt(keys.publicKey, ptxt1);
      const ct1Buffer = module.SerializeCiphertextToBuffer(ct1, sertype);
      const formData = new FormData();
      formData.append("user_id", uid.toString());
      formData.append("embedding_vector", ct1Buffer);
      if (type == 2||type == 3) {
        const mintResponse = await fetch(`${URL}/make_data/user_mint`, {
          method: "POST",
          body: formData,
        });
        mintData = await mintResponse.json();
        // console.log("mintData", mintData);
        // // 等待 30 秒
        // await wait(10000);
        // 进行poh推送
        const pohResponse = await fetch(`${URL}/make_data/user_poh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: uid.toString(),
            user_address: address,
            poh_address: web3.eth.accounts.create().address,
        }),
        });
        pohData = await pohResponse.json();
        // console.log("pohData", pohData);
      }
      if (type == 3) {
        //登录获取token
        const authP = await fetch(`${URL}/user/login`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            name: userName,
            password: password,
            }),
        });
        authResponse = await authP.json();
        // console.log("authResponse", authResponse);
      }
      return {
        userName: userName,
        password: password,
        address: address,
        privateKey: wallet.privateKey,
        userId: uid.toString(),
        mintData: mintData,
        pohData: pohData,
        authResponse: authResponse
      };
    } catch (error) {
      const msg =
        typeof error === "number" ? module.getExceptionMessage(error) : error;
      return new Error(msg);
    }
  } catch (e) {
    console.log(e);
    return e;
  }
}
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
exports.accountMint = accountMint;
