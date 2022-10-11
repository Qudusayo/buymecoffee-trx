import abi from "../utils/BuyMeACoffee.json";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "TNz8Zm261GV2imQkvmRApzMPyTnWMDjaU6";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);
  const [tronWeb, setTronWeb] = useState(null);

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { tronLink } = window;

      await tronLink.request({ method: "tron_requestAccounts" });
      let account = tronWeb.defaultAddress.base58;

      if (account) {
        // console.log("wallet is connected! " + account);
      } else {
        // console.log("Make sure TronLink is connected");
      }
    } catch (error) {
      // console.log("error: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { tronLink, tronWeb } = window;

      if (!tronLink) {
        // console.log("please install TronLink");
      }

      if (tronWeb) {
        setTronWeb(tronWeb);
      }

      const account = await tronWeb.defaultAddress.base58;
      // console.log(account);

      setCurrentAccount(account);
    } catch (error) {
      // console.log(error);
    }
  };

  useEffect(() => console.log(tronWeb), [tronWeb]);

  const buyCoffee = async () => {
    try {
      const { tronWeb } = window;
      if (tronWeb) {
        let instance = await tronWeb.contract(contractABI, contractAddress);

        console.log("buying coffee..");

        const coffeeTxn = await instance
          .buyCoffee(
            name ? name : "anon",
            message ? message : "Enjoy your coffee!"
          )
          .send({
            callValue: tronWeb.toSun("0.001"),
          });
        // await coffeeTxn.wait();
        console.log("mined ", coffeeTxn);
        console.log("coffee purchased!");
        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      // console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { tronWeb } = window;
      if (tronWeb) {
        let instance = await tronWeb.contract(contractABI, contractAddress);

        const memos = await instance.getMemos().call();
        // console.log("fetched!");
        // console.log(memos);
        setMemos(memos);
      } else {
        // console.log("TronLink is not connected");
      }
    } catch (error) {
      // console.log(error);
    }
  };

  useEffect(() => {
    async function init() {
      let buyMeACoffee;
      await isWalletConnected();
      await getMemos();
      // Create an event handler function for when someone sends
      // us a new memo.

      const onNewMemo = (eventObj) => {
        const { from, timestamp, name, message } = eventObj;
        // console.log("Memo received: ", from, timestamp, name, message);
        setMemos((prevState) => [
          ...prevState,
          {
            address: from,
            timestamp,
            message,
            name,
          },
        ]);
      };
      const { tronWeb } = window;
      // Listen for new memo events.
      if (tronWeb) {
        let instance = await tronWeb.contract(contractABI, contractAddress);
        buyMeACoffee = await instance.NewMemo().watch((err, event) => {
          if (err) {
            return console.error('Error with "method" event:', err);
          }
          if (event) {
            onNewMemo(event.result);
          }
        });
        buyMeACoffee.start();
      }
      return () => {
        if (buyMeACoffee) {
          buyMeACoffee.stop();
        }
      };
    }
    init();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy Qudusayo a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Buy Qudusayo a Coffee!</h1>

        {currentAccount ? (
          <div>
            <form>
              <div className="formgroup">
                <label>Name</label>
                <br />

                <input
                  id="name"
                  type="text"
                  placeholder="anon"
                  onChange={onNameChange}
                />
              </div>
              <br />
              <div className="formgroup">
                <label>Send Qudusayo a message</label>
                <br />

                <textarea
                  rows={3}
                  placeholder="Enjoy your coffee!"
                  id="message"
                  onChange={onMessageChange}
                  required
                ></textarea>
              </div>
              <div>
                <button type="button" onClick={buyCoffee}>
                  Send 1 Coffee for 0.001ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={connectWallet}> Connect your wallet </button>
        )}
      </main>

      {currentAccount && <h1>Memos received</h1>}

      {currentAccount &&
        memos.reverse().map((memo, idx) => {
          return (
            <div
              key={idx}
              style={{
                border: "2px solid",
                borderRadius: "5px",
                padding: "5px",
                margin: "5px",
              }}
            >
              <p style={{ fontWeight: "bold" }}>"{memo.message}"</p>
              <p>
                From: {memo.name} at{" "}
                {new Date(memo.timestamp.toString() * 1000).toDateString()}
              </p>
            </div>
          );
        })}

      <footer className={styles.footer}>
        <a
          href="https://alchemy.com/?a=roadtoweb3weektwo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Inspired by @thatguyintech
        </a>
      </footer>
    </div>
  );
}
