import { pinJSONToIPFS } from "./pinata.js";
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";
import axios from "axios";
import ArtNotionFactory  from "../contract/ArtNotionFactory.json";
import ArtNotionMarketplace from "../contract/ArtNotionMarketPlace.json";
import ERC721ArtNotion from "../contract/ERC721ArtNotion.json";
require("dotenv").config();
const contractAddress = "0xFf0daA3b3f25eD2a51BD35881d805AA76aA7b830";
const factoryContractAddress = "0x49abC482A39e25179DfEa1416aa5febE7EC2AF70";
const marketPlaceContractAddress = "0x9F3D854486F76f345dc33c38fe22aC8769cbb7Bd";
let erc721Address;
let addressArray;
let web3;
let provider;
let factory;
let marketPlace;
let erc721;
let tokenURI; 
export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const obj = {
        status: "👆🏽 Write a message in the text-field above.",
        address: addressArray[0],
      };
      return obj;
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};

export const createAddressERC721 = async (name, symbol, recipient, fee, choice, nftPrice) =>{
    factory = new web3.eth.Contract(ArtNotionFactory,factoryContractAddress);
    console.log(factory);
    let tx1 = await factory.methods.createNFT(name,symbol,fee,recipient,choice).send({from: addressArray[0]});
    console.log(tx1);
    erc721Address = tx1.events.createdNFTAddress.returnValues["nftcontract"];
    console.log(erc721Address);
    erc721 = new web3.eth.Contract(ERC721ArtNotion,erc721Address);
    console.log(tokenURI);
    let tx2 = await erc721.methods.createToken(tokenURI).send({from: addressArray[0]});
    console.log(tx2); 
    let tokenId;
    tokenId = tx2.events.CreatedToken.returnValues["tokenId"];
    console.log(tokenId);
    marketPlace = new web3.eth.Contract(ArtNotionMarketplace,marketPlaceContractAddress);
    console.log(marketPlace);
    let tx4 = await erc721.methods.setApprovalForAll(marketPlaceContractAddress,true).send({from:addressArray[0]});
    console.log(tx4);
    console.log(nftPrice);
    let tx3 = await marketPlace.methods.createMarketItem(erc721Address,tokenId,nftPrice).send({from: addressArray[0], value:0});
    console.log(tx3);
    let {itemId,seller,owner,price,sold} = tx3.events.MarketItemCreated.returnValues;
    console.log(itemId+" "+seller+" "+owner+" "+price+" "+sold+" ");
    //get tokenId
}

export const buyMarketItem = async () => {
  let nftAddress = "0xF8e07e976b235B953c791c4601B8Cc0E1bEb7a92";
  let itemId = "1";
  marketPlace = new web3.eth.Contract(ArtNotionMarketplace,marketPlaceContractAddress);
  console.log(marketPlace);
  let totalPrice = await marketPlace.methods.getTotalFee(itemId,nftAddress).call();
  console.log(totalPrice);
  let tx6 = await marketPlace.methods.buyMarketItem(nftAddress,itemId).send({from: addressArray[0],value: totalPrice});
  console.log(tx6);
}

export const startDutchAuction = async()=>{
  let startingPrice = "1000000";
  let minimumPrice = "10000";
  let nftaddress = "0xb18bfD2d774c515b8fE4059Df3cDCBa9FD0810f0";
  let tokenId = "1";
  let discountRate = "1000";
  let creator ="0x61C2896887fA0f8345d851d63b47CeFF7aCf87DA";
  console.log(marketPlace);
  marketPlace = new web3.eth.Contract(ArtNotionMarketplace,marketPlaceContractAddress);
  let tx5 = await marketPlace.methods.startDutchAuction(startingPrice,minimumPrice,nftaddress,tokenId,discountRate,creator).send({from:addressArray[0]});
  console.log(tx5);
  let {_bidId} = tx5.events.dutchAuctionStarted.returnValues;

  axios({
    method: 'post',
    url: 'http://localhost:8080/assets/api/startAuction',
    data:{
      startingPrice,
      minimumPrice,
      discountRate,
      creator,
      _bidId
    },
    params:{
      walletaddress:addressArray[0],
      nftaddress,
      tokenId
    }
  }).then(function(response){
    console.log(response);
  })
}
 
export const getCurrentWalletConnected = async () => {

  const loadProvider = async () => {
    provider = await detectEthereumProvider();
   
    if (provider) {
      provider.request({method: "eth_requestAccounts"});
    } else {
      console.error("Please install MetaMask!");
    }
    if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider);
  } else {
      // set the provider you want from Web3.providers
      web3 = new Web3(provider);
  }
}

  loadProvider();
  if (window.ethereum) {
    try {
       addressArray = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (addressArray.length > 0) {
        return {
          address: addressArray[0],
          status: "👆🏽 Write a message in the text-field above.",
        };
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask using the top right button.",
        };
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      };
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            <a target="_blank" href={`https://metamask.io/download.html`}>
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.
            </a>
          </p>
        </span>
      ),
    };
  }
};

async function loadContract(contractABI,contractAddress) {
  return new web3.eth.Contract(contractABI, contractAddress);
}

export const mintNFT = async (url, name, description, address) => {
  // if (url.trim() == "" || name.trim() == "" || description.trim() == "" || address.trim() == "") {
  //   return {
  //     success: false,
  //     status: "❗Please make sure all fields are completed before minting.",
  //   };
  // }

  //make metadata
  const metadata = new Object();
  metadata.name = name;
  metadata.image = url;
  metadata.description = description;
  metadata.address = address;

  const pinataResponse = await pinJSONToIPFS(metadata);
  if (!pinataResponse.success) {
    return {
      success: false,
      status: "😢 Something went wrong while uploading your tokenURI.",
    };
  }
  tokenURI = pinataResponse.pinataUrl;
  
  // const transactionParameters = {
  //   to: contractAddress, // Required except during contract publications.
  //   from: window.ethereum.selectedAddress, // must match user's active address.
  //   data: window.contract.methods
  //     .mintNFT(window.ethereum.selectedAddress, tokenURI)
  //     .encodeABI(),
  // };

  try {
    // const txHash = await window.ethereum.request({
    //   method: "eth_sendTransaction",
    //   params: [transactionParameters],
    // });
    // return {
    //   success: true,
    //   _tokenURI: tokenURI,
    //   status:
    //     "✅ Check out your transaction on Gaurascan: https://testnet-explorer.gaurascan.com/tx/"+txHash+"/token-transfers",
    // };
  } catch (error) {
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message,
    };
  }
};
