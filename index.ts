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

      const pricePancakeSwap = reserve0Pancake / reserve1Pancake
      const priceBakerySwap = reserve0Bakery / reserve1Bakery

      const shouldStartEth = pricePancakeSwap < priceBakerySwap
      const spread = Math.abs((priceBakerySwap / pricePancakeSwap - 1) * 100) - 0.6

      const shouldTrade = spread > (
        (shouldStartEth ? ETH_TRADE : DAI_TRADE)
        / Number(
          ethers.utils.formatEther(pancakeReserves[shouldStartEth ? 1 : 0])
        )
      )

      console.log(`PANCAKESWAP PRICE ${pricePancakeSwap}`);
      console.log(`BAKERYSWAP PRICE ${priceBakerySwap}`);
      console.log(`PROFITABLE? ${shouldTrade}`);
      console.log(`CURRENT SPREAD: ${(priceBakerySwap / pricePancakeSwap - 1) * 100}%`);
      console.log(`ABSOLUTE SPREAD: ${spread}`);

      if (!shouldTrade) return

      // should be pancakeETHDai
      const gasLimit = await bakeryEthDai.estimateGas.swap(
        !shouldStartEth ? DAI_TRADE : 0,
        shouldStartEth ? ETH_TRADE : 0,
        flashLoanerAddress,
        ethers.utils.toUtf8Bytes('1'),
      );

      const gasPrice = await wallet.getGasPrice()

      const gasCost = Number(ethers.utils.formatEther(gasPrice.mul(gasLimit)))

      const shouldSendTx = shouldStartEth
        ? (gasCost / ETH_TRADE) < spread
        : (gasCost / (DAI_TRADE / pricePancakeSwap)) < spread

      // don't trade if gasCost is higher than the spread
      if (!shouldSendTx) return;

      const options = {
        gasPrice,
        gasLimit,
      };
      const tx = await bakeryEthDai.swap(
        !shouldStartEth ? DAI_TRADE : 0,
        shouldStartEth ? ETH_TRADE : 0,
        flashLoanerAddress,
        ethers.utils.toUtf8Bytes('1'), options,
      )

      console.log('ARBITRAGE EXECUTED! PENDING TX TO BE MINED');
      console.log(tx);

      await tx.wait();

      console.log('SUCCESS! TX MINED');

    } catch (err) {
      console.log(err);
    }
  })
}

console.log('Bot started!');

startBot();