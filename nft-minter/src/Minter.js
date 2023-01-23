import { useEffect, useState } from "react";
import {
  connectWallet,
  getCurrentWalletConnected,
  mintNFT,
} from "./util/interact.js";
const axios = require('axios');
const key = process.env.REACT_APP_PINATA_KEY;
const secret = process.env.REACT_APP_PINATA_SECRET;

const Minter = (props) => {
  const [walletAddress, setWallet] = useState("");
  const [address,setAddress] = useState(null);
  const [status, setStatus] = useState("");
  const [fileImg,setFileImg]=useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setURL] = useState("");
  const [tokenURI,setTokenURI] = useState("");

  useEffect(async () => {
    const { address, status } = await getCurrentWalletConnected();

    setWallet(address);
    setStatus(status);

    addWalletListener();
  }, []);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 Write a message in the text-field above.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          <a target="_blank" href={`https://metamask.io/download.html`}>
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.
          </a>
        </p>
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const sendFiletoIPFS = async ()=>{
    console.log("File Changed!");
    console.log(fileImg);
    if (fileImg) {
      try {

          const formData = new FormData();
          formData.append("file", fileImg);

          const resFile = await axios({
              method: "post",
              url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
              data: formData,
              headers: {
                  'pinata_api_key': key,
                  'pinata_secret_api_key': secret,
                  "Content-Type": "multipart/form-data"
              },
          });

          const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
       console.log(ImgHash); 
       setURL(ImgHash);
//Take a look at your Pinata Pinned section, you will see a new file added to you list.   



      } catch (error) {
          console.log("Error sending File to IPFS: ")
          console.log(error)
      }
  }
}
  const getImageHash=async (e)=>{
    setFileImg(e.target.files[0]);
    console.log(fileImg);
  }
  const onMintPressed = async () => {
    const { success, status, _tokenURI } = await mintNFT(url, name, description,address);
    setStatus(status);
    setTokenURI(_tokenURI);
    if (success) {
      setName("");
      setDescription("");
      //setURL("");
      setAddress(null);
    }
  };

  return (
    <div className="Minter">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      
      <br></br>
      <h1 id="title">🧙‍♂️ NFT Minter</h1>
      <p>
        Simply add your asset's Image, name, description, and wallet Address, then press "Mint."
      </p>
      <form>
        <h2>🖼 Select Image first: </h2>
        <input type="file" onChange={getImageHash} required />
        <br></br>
        <br></br>
        <button id="ImageHash" onClick={sendFiletoIPFS} >
        Get IPFS Hash
        </button>
       
        <label>
          {url}
        </label>
        <h2>🤔 Name: </h2>
        <input
          type="text"
          placeholder="e.g. My first NFT!"
          onChange={(event) => setName(event.target.value)}
        />
        <h2>✍️ Description: </h2>
        <input
          type="text"
          placeholder="e.g. Even cooler than cryptokitties ;)"
          onChange={(event) => setDescription(event.target.value)}
        />
        <h2>🏠 Wallet Address: </h2>
        <input
          type="text"
          placeholder=" e.g. 0x000..."
          onChange={(event) => setAddress(event.target.value)}
          required
        />
      </form>
      <div>
      <button id="mintButton" onClick={onMintPressed}>
        Mint NFT
      </button>
      <p id="status" style={{ color: "black" }}>
        {status}
      </p>
      <p id="tokenURI" style={{ color: "green"}}>
          "Token URI: " {tokenURI}
      </p>
      </div>
    </div>
  );
};

export default Minter;
