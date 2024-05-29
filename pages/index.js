import { useState, useEffect } from "react";
import { ethers } from "ethers";
import assessmentAbi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [assessmentContract, setAssessmentContract] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [guess, setGuess] = useState("");
  const [eligible, setEligible] = useState(false);

  const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const assessmentABI = assessmentAbi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts.length > 0) {
      console.log("Account connected: ", accounts[0]);
      setAccount(accounts[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // Once wallet is set, get a reference to the deployed contract
    getAssessmentContract();
  };

  const getAssessmentContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, assessmentABI, signer);

    setAssessmentContract(contract);
  };

  const getBalance = async () => {
    if (assessmentContract) {
      const balance = await assessmentContract.getBalance();
      setBalance(balance.toNumber());
    }
  };

  const makeGuess = async () => {
    if (assessmentContract) {
      const guessNumber = parseInt(guess);
      if (isNaN(guessNumber) || guessNumber < 1 || guessNumber > 10) {
        alert("Please enter a valid guess between 1 and 10");
        return;
      }
  
      try {
        const tx = await assessmentContract.makeGuess(guessNumber);
        const txReceipt = await tx.wait();
  
        // Find the event logs
        const generatedNumberEvent = txReceipt.logs.find(log => log.event === "GeneratedNumber");
  
        if (generatedNumberEvent) {
          // Access the generated number from the event data
          const generatedNumber = generatedNumberEvent.args[0].toNumber();
          console.log("Generated Number:", generatedNumber);
        } else {
          console.warn("GeneratedNumber event not found in transaction logs.");
        }
  
        // Wait for the transaction to be mined
        await tx.wait();
        const number1 = await assessmentContract.number();
        console.log(number1.toNumber());
        // Check eligibility
        const eligible = await assessmentContract.eligible();
        setEligible(eligible);
        alert("Guess made successfully!");
      } catch (error) {
        console.error("Error making guess: ", error);
        alert("An error occurred. Please try again.");
      }
    }
  };
  

  const claimPrize = async () => {
    if (assessmentContract && eligible) {
      try {
        const tx = await assessmentContract.claimPrize();
        await tx.wait();
        getBalance();
        alert("Prize claimed successfully!");
      } catch (error) {
        console.error("Error claiming prize: ", error);
        alert("An error occurred. Please try again.");
      }
    } else {
      alert("You are not eligible to claim the prize.");
    }
  };

  const initUser = () => {
    // Check if user has MetaMask
    if (!ethWallet) {
      return <p>Please install MetaMask in order to use this app.</p>;
    }

    // Check if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Connect your MetaMask wallet</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>
        <input
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter your guess (1-10)"
        />
        <button onClick={makeGuess}>Make Guess</button>
        <button onClick={claimPrize}>Claim Prize</button>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Guessing Game!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </main>
  );
}
