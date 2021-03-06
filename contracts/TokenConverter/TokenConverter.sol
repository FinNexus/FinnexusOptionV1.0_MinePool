pragma solidity =0.5.16;
import "./TokenConverterData.sol";
import "../modules/SafeMath.sol";
import "../ERC20/IERC20.sol";


/**
 * @title FPTCoin is finnexus collateral Pool token, implement ERC20 interface.
 * @dev ERC20 token. Its inside value is collatral pool net worth.
 *
 */
contract TokenConverter is TokenConverterData {
    using SafeMath for uint256;
    modifier inited (){
    	  require(cfnxAddress!=address(0));
    	  require(fnxAddress!=address(0));
    	  _;
    } 

    function initialize() onlyOwner public {
        
    }
    
    function update() onlyOwner public{
    }
    
    /**
     * @dev constructor function. set FNX minePool contract address. 
     */ 
    function setParameter(address _cfnxAddress,address _fnxAddress,uint256 _timeSpan,uint256 _dispatchTimes,uint256 _txNum) onlyOwner public{
        if (_cfnxAddress != address(0))
            cfnxAddress = _cfnxAddress;
            
        if (_fnxAddress != address(0))
            fnxAddress = _fnxAddress;
            
        if (_timeSpan != 0) 
            timeSpan = _timeSpan;
            
        if (_dispatchTimes != 0) 
            dispatchTimes = _dispatchTimes;
        
        if (_txNum != 0) 
            txNum = _txNum;   
        
    }
    
    /**
     * @dev getting back the left mine token
     * @param reciever the reciever for getting back mine token
     */
    function getbackLeftFnx(address reciever)  public onlyOwner {
        uint256 bal =  IERC20(fnxAddress).balanceOf(address(this));
        IERC20(fnxAddress).transfer(reciever,bal);
    }  

    /**
     * @dev Retrieve user's locked balance. 
     * @param account user's account.
     */ 
    function lockedBalanceOf(address account) public view returns (uint256) {
        return lockedBalances[account];
    }


    /**
     * @dev user input cnfx to get fnx
     * @param amount fnx amount
     */ 
    function inputCfnxForInstallmentPay(uint256 amount) external inited {
        require(amount>0,"amount should be bigger than 0");
        
        IERC20(cfnxAddress).transferFrom(msg.sender,address(this),amount);
        uint256 idx = lockedIndexs[msg.sender].totalIdx;
        uint256 divAmount = amount.div(dispatchTimes);

        lockedAllRewards[msg.sender][idx] = lockedReward(now,amount);
        
        //index 0 to save the left token num
        lockedAllRewards[msg.sender][idx].alloc[0] = amount.sub(divAmount);
        uint256 i=2;
        //idx = 1, the reward give user immediately
        for(;i<dispatchTimes;i++){
            lockedAllRewards[msg.sender][idx].alloc[i] = divAmount;
        }
        lockedAllRewards[msg.sender][idx].alloc[i] = amount.sub(divAmount.mul(dispatchTimes-1));
        
        
        lockedBalances[msg.sender] = lockedBalances[msg.sender].add(amount.sub(divAmount));
        
        //should can not be overflow
        lockedIndexs[msg.sender].totalIdx =  lockedIndexs[msg.sender].totalIdx + 1;
        
        IERC20(fnxAddress).transfer(msg.sender,divAmount);

        emit InputCfnx(msg.sender,amount,divAmount);
    }
    
      /**
     * @dev user user claim expired reward
     */ 
    function claimFnxExpiredReward() external inited {
        require(fnxAddress!=address(0),"fnx token should be set");
        
        uint256 txcnt = 0;
        uint256 i = lockedIndexs[msg.sender].beginIdx;
        uint256 endIdx = lockedIndexs[msg.sender].totalIdx;
        uint256 totalRet = 0;
        
        for(;i<endIdx && txcnt<txNum;i++) {
           //only count the rewards over at least one timeSpan
           if (now >= lockedAllRewards[msg.sender][i].startTime + timeSpan) {
               
               if (lockedAllRewards[msg.sender][i].alloc[0] > 0) {
                    if (now >= lockedAllRewards[msg.sender][i].startTime + lockPeriod) {
                        totalRet = totalRet.add(lockedAllRewards[msg.sender][i].alloc[0]);
                        lockedAllRewards[msg.sender][i].alloc[0] = 0;
                        
                        //updated last expired idx
                        lockedIndexs[msg.sender].beginIdx = i;
                    } else {
                      
                        uint256 timeIdx = (now - lockedAllRewards[msg.sender][i].startTime).div(timeSpan) + 1;
                        uint256 j = 2;
                        uint256 subtotal = 0;
                        for(;j<timeIdx+1;j++) {
                            subtotal = subtotal.add(lockedAllRewards[msg.sender][i].alloc[j]);
                            lockedAllRewards[msg.sender][i].alloc[j] = 0;
                        }
                        
                        //updated left locked balance,possible?
                        if(subtotal<=lockedAllRewards[msg.sender][i].alloc[0]){
                            lockedAllRewards[msg.sender][i].alloc[0] = lockedAllRewards[msg.sender][i].alloc[0].sub(subtotal);
                        } else {
                            subtotal = lockedAllRewards[msg.sender][i].alloc[0];
                            lockedAllRewards[msg.sender][i].alloc[0] = 0;
                        }
                        
                        totalRet = totalRet.add(subtotal);
                    }
                    
                    txcnt = txcnt + 1;
               }
                
           } else {
               //the item after this one is pushed behind this,not needed to caculate
               break;
           }
        }
        
        lockedBalances[msg.sender] = lockedBalances[msg.sender].sub(totalRet);
        //transfer back to user
        IERC20(fnxAddress).transfer(msg.sender,totalRet);
        
        emit ClaimFnx(msg.sender,totalRet,txcnt);
    }
    
      /**
     * @dev get user claimable balance
     * @param _user the user address
     */ 
    function getClaimAbleBalance(address _user) public view returns (uint256) {
        require(fnxAddress!=address(0),"fnx token should be set");
        
        uint256 txcnt = 0;
        uint256 i = lockedIndexs[_user].beginIdx;
        uint256 endIdx = lockedIndexs[_user].totalIdx;
        uint256 totalRet = 0;
        
        for(;i<endIdx && txcnt<txNum;i++) {
           //only count the rewards over at least one timeSpan
           if (now >= lockedAllRewards[_user][i].startTime + timeSpan) {
               
               if (lockedAllRewards[_user][i].alloc[0] > 0) {
                    if (now >= lockedAllRewards[_user][i].startTime + lockPeriod) {
                        totalRet = totalRet.add(lockedAllRewards[_user][i].alloc[0]);
                    } else {
                        uint256 timeIdx = (now - lockedAllRewards[_user][i].startTime).div(timeSpan) + 1;
                        uint256 j = 2;
                        uint256 subtotal = 0;
                        for(;j<timeIdx+1;j++) {
                            subtotal = subtotal.add(lockedAllRewards[_user][i].alloc[j]);
                        }
                        
                        //updated left locked balance,possible?
                        if(subtotal>lockedAllRewards[_user][i].alloc[0]){
                            subtotal = lockedAllRewards[_user][i].alloc[0];
                        }
                        
                        totalRet = totalRet.add(subtotal);
                    }
                    
                    txcnt = txcnt + 1;
               }
                
           } else {
               //the item after this one is pushed behind this,not needed to caculate
               break;
           }
        }
        
        return totalRet;
    }
    
  
    
}
