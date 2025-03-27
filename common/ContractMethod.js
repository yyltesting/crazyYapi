const stakingAbi = require('./Abijson/staking.json');
const praitAbi = require('./Abijson/praitAbi.json');
const rewardAbi = require('./Abijson/rewardAbi.json');
const airdropAbi = require('./Abijson/airdrop.json');
const praiAbi = require('./Abijson/praiAbi.json');
const PaymentReceiverAbi = require('./Abijson/PaymentReceiverAbi.json');
const Web3 = require('web3');

const ContractMethod = {
  ethsign: async function(str){  
    if(typeof window === 'undefined'){
      return '服务端不支持eth签名'
    }else{
      const web = await new Web3(window.ethereum);
      return await web.eth.personal.sign(str, web.currentProvider.selectedAddress);
    }
  },
  //密钥签名
  web3signForKey: async function(neturl,key,str){
    // 连接到以太坊节点
    const web3 = new Web3(neturl);//'https://sepolia.arbiscan.io/privasea-testnet'

    // 钱包的私钥
    const privateKey = key;
    const signature = await web3.eth.accounts.sign(str, privateKey);
    console.log('signature',signature);
    return signature;
  },
  createAccounts: function(){
    const web3 = new Web3();  // 创建 Web3 实例
    // 生成一个新的钱包
    const wallet = web3.eth.accounts.create();
    console.log("地址:", wallet.address);
    console.log("私钥:", wallet.privateKey);
    return wallet;
  },
  //网页交易
  sendTransaction : async function (to, value, data = '') {
    if (typeof window === 'undefined') {
      return '服务端不支持eth交易';
    }
  
    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.getAccounts(); // 获取当前钱包地址
    if (accounts.length === 0) {
      return '未连接钱包';
    }
  
    const from = accounts[0];
  
    try {
      const tx = {
        from,
        to, // 交易接收地址
        value: value, // 交易金额
        data, // 额外数据（可选）
      };
  
      const receipt = await web3.eth.sendTransaction(tx);
      console.log('交易成功:', receipt);
      return receipt;
    } catch (error) {
      console.error('交易失败:', error);
      return error;
    }
  },
  //发送合约代币
  sendTransactionForkey:async function(neturl,amount,senderAddress,recipientAddress,tokenContractAddress,privateKey) {
    try {
        const web3 = new Web3(neturl);
        const contract = new web3.eth.Contract(praiAbi.abi, tokenContractAddress);
        
        // 计算发送的代币数量（转换为正确的小数位）
        const decimals = 18; // ⚠️ 代币小数位数，请根据实际代币修改
        const tokenAmount = web3.utils.toBN(amount * (10 ** decimals));

        // 计算 gas 费
        const gasPrice = await web3.eth.getGasPrice();
        const gasLimit = await contract.methods.transfer(recipientAddress, tokenAmount).estimateGas({ from: senderAddress });

        // 获取最新 nonce
        const nonce = await web3.eth.getTransactionCount(senderAddress, 'pending');

        // **构造交易**
        const txObject = {
            from: senderAddress,
            to: tokenContractAddress,
            gas: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(gasPrice),
            nonce: web3.utils.toHex(nonce),
            data: contract.methods.transfer(recipientAddress, tokenAmount).encodeABI()
        };

        // **使用私钥签名**
        const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);

        // **发送交易**
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('✅ 交易成功，交易哈希:', receipt.transactionHash);
        return receipt.transactionHash;
    } catch (error) {
        console.error("❌ 发送代币失败:", error);
        return null;
    }
  },
  //发送eth
  sendTransactionForETH: async function(neturl, amount, senderAddress, recipientAddress, privateKey) {
    try {
        const web3 = new Web3(neturl);

        // 计算发送的 ETH 数量（转换为正确的小数位）
        const amountInWei = web3.utils.toWei(amount.toString(), 'ether'); // 转换为 Wei

        // 计算 gas 费用
        const gasPrice = await web3.eth.getGasPrice();
        // 动态估算 gasLimit
        const gasLimit = await web3.eth.estimateGas({
          from: senderAddress,
          to: recipientAddress,
          value: amountInWei
        });

        // 获取最新 nonce
        const nonce = await web3.eth.getTransactionCount(senderAddress, 'pending');

        // **构造交易**
        const txObject = {
            from: senderAddress,
            to: recipientAddress,
            value: web3.utils.toHex(amountInWei), // 发送的 ETH 数量
            gas: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(gasPrice),
            nonce: web3.utils.toHex(nonce),
        };

        // **使用私钥签名交易**
        const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);

        // **发送交易**
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('✅ 交易成功，交易哈希:', receipt.transactionHash);
        return receipt.transactionHash;
    } catch (error) {
        console.error("❌ 发送 ETH 失败:", error);
        return null;
    }
  },

  getBalance:async function(neturl,accountAddress,tokenContractAddress) {
    try {
      const web3 = new Web3(neturl);
      const contract = new web3.eth.Contract(praiAbi.abi, tokenContractAddress);
      
          // 获取代币精度（小数位数）
      const decimals = await contract.methods.decimals().call();

          // 查询余额
      const balance = await contract.methods.balanceOf(accountAddress).call();
      const formattedBalance = balance / (10 ** decimals);

      console.log(`代币余额: ${formattedBalance}`);
      return formattedBalance;
    } catch (error) {
      console.error("❌ 发送代币失败:", error);
      return null;
    }
  },
  //获取钱包地址
  getWalletAddress : async function () {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                console.log("当前钱包地址:", accounts[0]);
                return accounts[0];
            } else {
                console.log("未连接 MetaMask");
                return null;
            }
        } catch (error) {
            console.error("获取钱包地址失败:", error);
            return null;
        }
    } else {
        console.log("MetaMask 未安装");
        return null;
    }
},
  getAccountBalance:async function (neturl,accountAddress,type) {
    try {
      const web3 = new Web3(neturl);
      const balanceWei = await web3.eth.getBalance(accountAddress);  // 获取余额（以wei为单位）
      const balanceEther = web3.utils.fromWei(balanceWei, type);  // 转换为ether
      console.log('账户余额:', balanceEther);
      return balanceEther;
    } catch (error) {
      console.error('获取账户余额错误:', error);
      return error;
    }
  },
  //创建spaceid
  createSpaceId : async function(commission,accountAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权
      const contract = new web3.eth.Contract(stakingAbi.abi,contractAddress);
      const gasEstimate = await contract.methods.createSpace(commission).estimateGas({ from: accountAddress });//commission 为提升率
      console.log('estimategas==', gasEstimate);

      const tx = await contract.methods.createSpace(commission).send({
        from: accountAddress,
        gas: gasEstimate,
      });

      console.log('createSpaceId:', tx);
      return tx.transactionHash;
    } else {
      console.error("createSpaceId error");
      return null;
    }
  },
  //创建spaceid
  createSpaceIdForkey : async function(neturl,commission, accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(stakingAbi.abi, contractAddress);
  
      // 估算 gas
      const gasEstimate = await contract.methods.createSpace(commission).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.createSpace(commission).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  //根据用户查找spaceid
  findSpaceByOwner  : async function(accountAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权
      const contract = new web3.eth.Contract(stakingAbi.abi,contractAddress);
      const tx = await contract.methods.findSpaceByOwner(accountAddress).call();

      console.log('findSpaceID:', tx);
      return tx;
    } else {
      console.error("findSpaceID error")
      return null
    }
  },
  //修改空间利率
  updateSpaceRateForkey : async function(neturl,space_id,commission, accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(stakingAbi.abi, contractAddress);
  
      // 估算 gas
      const gasEstimate = await contract.methods.updateSpaceRate(space_id,commission).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.updateSpaceRate(space_id,commission).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("updateSpaceRate error:", error);
      return null;
    }
  },
  findSpaceByOwnerForKey: async function(neturl,accountAddress, contractAddress) {
    try {
        const web3 = new Web3(neturl); // 使用合适的网络URL
        const contract = new web3.eth.Contract(stakingAbi.abi, contractAddress);

        // 查询信息
        const tx = await contract.methods.findSpaceByOwner(accountAddress).call();
        console.log('findSpaceID:', tx);
        return tx; // 返回查询结果
    } catch (error) {
        console.error("Error in findSpaceByOwner:", error);
        return null;
    }
  },
  //授权
  approve: async function(amount,accountAddress,feecontractAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权

      const contract = new web3.eth.Contract(praitAbi.abi,contractAddress);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      const gasEstimate = await contract.methods.approve(feecontractAddress,wei).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);

      const tx = await contract.methods.approve(feecontractAddress,wei).send({
        from: accountAddress,
        gas: gasEstimate,
      });

      console.log('Transaction approve confirmed:', tx);
      return tx.transactionHash;
    } else {
      console.error("MetaMask is not installed");
      return null;
    }
  },
  //授权
  approveForkey : async function(neturl,amount, accountAddress,feecontractAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(praitAbi.abi, contractAddress);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      // 估算 gas
      const gasEstimate = await contract.methods.approve(feecontractAddress,wei).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.approve(feecontractAddress,wei).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction approveForkey Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  //质押
  pledgeMoney: async function(amount,space_id,accountAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权

      const contract = new web3.eth.Contract(stakingAbi.abi,contractAddress);

      console.log('space_id==', space_id, 'amount==', amount);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      const gasEstimate = await contract.methods.stake(+space_id, wei).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);

      const tx = await contract.methods.stake(+space_id, wei).send({
        from: accountAddress,
        gas: gasEstimate,
      });

      console.log('Transaction stake confirmed:', tx);
      return tx.transactionHash
    } else {
      console.error("MetaMask is not installed")
      return null
    }
  },
  //质押
  pledgeMoneyForkey : async function(neturl,amount, space_id,accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(stakingAbi.abi, contractAddress);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      // 估算 gas
      const gasEstimate = await contract.methods.stake(+space_id,wei).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.stake(+space_id,wei).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction stake Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  //解质押
  unpledgeMoney: async function(amount,space_id,accountAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权

      const contract = new web3.eth.Contract(stakingAbi.abi,contractAddress);

      console.log('space_id==', space_id, 'amount==', amount);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      const gasEstimate = await contract.methods.unstake(+space_id, wei).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);

      const tx = await contract.methods.unstake(+space_id, wei).send({
        from: accountAddress,
        gas: gasEstimate,
      });

      console.log('Transaction unstake confirmed:', tx)
      return tx.transactionHash
    } else {
      console.error("MetaMask is not installed")
      return null
    }
  },
  //解质押
  unpledgeMoneyForkey : async function(neturl,amount,space_id,accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(stakingAbi.abi, contractAddress);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      // 估算 gas
      const gasEstimate = await contract.methods.unstake(+space_id,wei).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.unstake(+space_id,wei).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction stake Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  withdrawForkey:async function(neturl,accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(stakingAbi.abi, contractAddress);
      // 估算 gas
      const gasEstimate = await contract.methods.withdraw().estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.withdraw().encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction withdraw Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  //领取奖励
  claimReward: async function(rewardSeason,amount,merkleProof,accountAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权

      const contract = new web3.eth.Contract(rewardAbi.abi,contractAddress);
      const proof = merkleProof.map((e) => `0x${e}`);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      const gasEstimate = await contract.methods.claimReward(rewardSeason,wei,proof).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);

      const tx = await contract.methods.claimReward(rewardSeason,wei,proof).send({
        from: accountAddress,
        gas: gasEstimate,
      });

      console.log('Transaction stake confirmed:', tx);
      return tx.transactionHash
    } else {
      console.error("MetaMask is not installed")
      return null
    }
  },
  //领取奖励
  claimRewardForkey : async function(neturl,rewardSeason,amount,merkleProof,accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(rewardAbi.abi, contractAddress);
      const proof = merkleProof.map((e) => `0x${e}`);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      // 估算 gas
      const gasEstimate = await contract.methods.claimReward(rewardSeason,wei,proof).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.claimReward(rewardSeason,wei,proof).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction stake Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  //领取空投
  claimairdropReward: async function(rewardSeason,amount,merkleProof,accountAddress,contractAddress) {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // 请求用户授权

      const contract = new web3.eth.Contract(airdropAbi.abi,contractAddress);
      const proof = merkleProof.map((e) => `0x${e}`);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      const gasEstimate = await contract.methods.claimReward(rewardSeason,wei,proof).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);

      const tx = await contract.methods.claimReward(rewardSeason,wei,proof).send({
        from: accountAddress,
        gas: gasEstimate,
      });

      console.log('Transaction stake confirmed:', tx);
      return tx.transactionHash
    } else {
      console.error("MetaMask is not installed")
      return null
    }
  },
  //领取空投
  claimairdropRewardForkey : async function(neturl,rewardSeason,amount,merkleProof,accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(airdropAbi.abi, contractAddress);
      const proof = merkleProof.map((e) => `0x${e}`);
      const wei = Web3.utils.toWei(amount.toString(), 'ether');
      // 估算 gas
      const gasEstimate = await contract.methods.claimReward(rewardSeason,wei,proof).estimateGas({ from: accountAddress });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        data: contract.methods.claimReward(rewardSeason,wei,proof).encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction stake Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  //bsc支付
  bscPayForkey : async function(neturl,accountAddress, contractAddress, privateKey) {
    try {
      const web3 = new Web3(neturl); 
  
      const contract = new web3.eth.Contract(PaymentReceiverAbi.abi, contractAddress);
      // 计算 0.05 BNB 的 wei 数量
      const wei = await contract.methods.minPaymentAmount().call();
      const value = web3.utils.toHex(web3.utils.toBN(wei));
      // 估算 gas
      const gasEstimate = await contract.methods.pay().estimateGas({ from: accountAddress,value: value  });
      console.log('estimategas==', gasEstimate);
  
      // 获取最新的 nonce
      const nonce = await web3.eth.getTransactionCount(accountAddress, 'pending');
  
      // 交易对象
      const txObject = {
        from: accountAddress,
        to: contractAddress,
        gas: gasEstimate,
        nonce: nonce,
        value: value,
        data: contract.methods.pay().encodeABI(), // 编码合约调用
      };
  
      // 签名交易
      const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
  
      // 发送交易
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log('Transaction stake Hash:', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error("createSpaceId error:", error);
      return null;
    }
  },
  // 元数据
  contractMetadata: {
    ethsign: ['str'],
    web3signForKey: ['neturl', 'key', 'str'],
    createAccounts: [],
    sendTransaction: ['to', 'value', 'data'],
    sendTransactionForkey: ['neturl', 'amount', 'senderAddress', 'recipientAddress', 'tokenContractAddress', 'privateKey'],
    sendTransactionForETH: ['neturl', 'amount', 'senderAddress', 'recipientAddress', 'privateKey'],
    getBalance: ['neturl', 'accountAddress', 'tokenContractAddress'],
    getWalletAddress: [],
    getAccountBalance: ['neturl', 'accountAddress', 'type'],
    createSpaceId: ['commission', 'accountAddress', 'contractAddress'],
    createSpaceIdForkey: ['neturl', 'commission', 'accountAddress', 'contractAddress', 'privateKey'],
    findSpaceByOwner: ['accountAddress', 'contractAddress'],
    findSpaceByOwnerForKey: ['neturl', 'accountAddress', 'contractAddress'],
    updateSpaceRateForkey: ['neturl', 'space_id', 'commission', 'accountAddress', 'contractAddress', 'privateKey'],
    approve: ['amount', 'accountAddress', 'feecontractAddress', 'contractAddress'],
    approveForkey: ['neturl', 'amount', 'accountAddress', 'feecontractAddress', 'contractAddress', 'privateKey'],
    pledgeMoney: ['amount', 'space_id', 'accountAddress', 'contractAddress'],
    pledgeMoneyForkey: ['neturl', 'amount', 'space_id', 'accountAddress', 'contractAddress', 'privateKey'],
    unpledgeMoney: ['amount', 'space_id', 'accountAddress', 'contractAddress'],
    unpledgeMoneyForkey: ['neturl', 'amount', 'space_id', 'accountAddress', 'contractAddress', 'privateKey'],
    withdrawForkey:['neturl','accountAddress', 'contractAddress', 'privateKey'],
    claimReward: ['rewardSeason', 'amount', 'merkleProof', 'accountAddress', 'contractAddress'],
    claimRewardForkey: ['neturl', 'rewardSeason', 'amount', 'merkleProof', 'accountAddress', 'contractAddress', 'privateKey'],
    claimairdropReward: ['rewardSeason', 'amount', 'merkleProof', 'accountAddress', 'contractAddress'],
    claimairdropRewardForkey: ['neturl', 'rewardSeason', 'amount', 'merkleProof', 'accountAddress', 'contractAddress', 'privateKey'],
    bscPayForkey:['neturl','accountAddress', 'contractAddress', 'privateKey']
  }
};
module.exports = {
  method:ContractMethod
}