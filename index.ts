import { config } from 'dotenv'
import { ethers } from 'ethers'

// uni/sushiswap/pancake/bakery ABIs
import UniswapV2Pair from './abis/IUniswapV2Pair.json'
import UniswapV2Factory from './abis/IUniswapV2Factory.json'

config()

const { 
  PRIVATE_KEY: privateKey, 
  FLASH_LOANER: flashLoanerAddress,
  RPC_LINK: rpcLink
} = process.env;

const provider = new ethers.providers.JsonRpcProvider(rpcLink)

const wallet = new ethers.Wallet(privateKey, provider);

const ETH_TRADE = 10;
const DAI_TRADE = 3500

const startBot = async () => {
  const bakerySwapFactory = new ethers.Contract(
    '',
    UniswapV2Factory.abi, wallet
  );
  const pancakeSwapFactory = new ethers.Contract(
    '',
    UniswapV2Factory.abi, wallet
  );
  const daiAddress = '' //tokens can be changed to other desired ones
  const wethAddress = ''

  let bakeryEthDai, pancakeEthDai;

  const loadPairs = async () => {
    bakeryEthDai = new ethers.Contract(
      await bakerySwapFactory.getPair(wethAddress, daiAddress),
      UniswapV2Pair.abi, wallet
    );
    pancakeEthDai = new ethers.Contract(
      await pancakeSwapFactory.getPair(wethAddress, daiAddress),
      UniswapV2Pair.abi, wallet
    );
  }

  await loadPairs();

  provider.on('block', async (blockNumber) => {
    try {

    } catch (err) {
      console.log(err);
    }
  })
}