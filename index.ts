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
      console.log(blockNumber)

      const bakeryReserves = await bakeryEthDai.getReserves();
      const pancakeReserves = await pancakeEthDai.getReserves();

      const reserve0Bakery = Number(ethers.utils.formatUnits(bakeryReserves[0], 18))
      const reserve1Bakery = Number(ethers.utils.formatUnits(bakeryReserves[1], 18))

      const reserve0Pancake = Number(ethers.utils.formatUnits(pancakeReserves[0], 18))
      const reserve1Pancake = Number(ethers.utils.formatUnits(pancakeReserves[1], 18))

      
    } catch (err) {
      console.log(err);
    }
  })
}