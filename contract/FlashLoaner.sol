pragma solidity =0.6.6;

import './UniswapV2Library.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IERC20.sol';

contract FlashLoaner {
  address immutable factory;
  uint constant deadline = 10 days;
  IUniswapV2Router02 immutable bakeryRouter;

  constructor(address _factory, address _bakeryRouter) public {
    factory = _factory;  
    bakeryRouter = IUniswapV2Router02(_bakeryRouter);
  }

  function uniswapV2Call(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external {
      address[] memory path = new address[](2);
      uint amountToken = _amount0 == 0 ? _amount1 : _amount0;
      
      address token0 = IUniswapV2Pair(msg.sender).token0();
      address token1 = IUniswapV2Pair(msg.sender).token1();

      require(msg.sender == UniswapV2Library.pairFor(factory, token0, token1), "Unauthorized"); 
      require(_amount0 == 0 || _amount1 == 0);

      path[0] = _amount0 == 0 ? token1 : token0;
      path[1] = _amount0 == 0 ? token0 : token1;

      IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);
      
      token.approve(address(bakeryRouter), amountToken);

      // no need for require() check, if amount required is not sent bakeryRouter will revert
      uint amountRequired = UniswapV2Library.getAmountsIn(factory, amountToken, path)[0];
      uint amountReceived = bakeryRouter.swapExactTokensForTokens(amountToken, amountRequired, path, msg.sender, deadline)[1];

      token.transfer(msg.sender, amountRequired); // return tokens to v2 pair
      token.transfer(_sender, amountReceived - amountRequired); // keep the rest
    
  }
}