import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { ethers, providers } from "ethers";
import abi from "../utils/ABI";
import CardDetails from "../components/CardDetails";
import Swal from "sweetalert2";

import Link from "next/link";
import Image from "next/image";
import copy from "copy-to-clipboard";

import info from "../public/informacion.png";
import atras from "../public/atras.png";

import InfoPayments from "../components/InfoPayments";

export default function Home() {
  const [remainingWallets, setRemainingWallets] = useState(0);
  const [investment, setInvestment] = useState(0.04075944951184779);
  const [balance, setBalance] = useState(0);
  const [referalLink, setReferalLink] = useState("");
  const [userWallet, setUserWallet] = useState("");
  const [profit, setProfit] = useState(0);
  const [investing, setInvesting] = useState(false);
  const [correctNetwork, setCorrectNetwork] = useState(false);

  const copyToClipboard = () => {
    copy(referalLink);
    if (referalLink == "") {
      Swal.fire({
        title: "Info!",
        text: "The referral link has not been configured yet, please sign in with your wallet!",
        icon: "info",
        confirmButtonText: "Continue...",
      });
    } else {
      Swal.fire({
        title: "Success!",
        text: "The referral link copied successfully!",
        icon: "success",
        confirmButtonText: "Continue...",
      });
    }
  };

  const contractAdd = "0x499d007554D56B095c24E8AA9490bdED2eF19045";

  //defición de variables
  var decimals = 18;
  var valueFee = "0";
  var amount = "";
  var dataApi = "";
  var bnbPrice = 0;
  var fee = 10000;
  var value = 0;
  let bnbBalance;
  //let userWallet;

  useEffect(() => {
    verify();
    async function verify() {
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const red = network.chainId;
      if (red == "56") {
        setCorrectNetwork(true);
      } else {
        setCorrectNetwork(false);
      }
    }

    fetch(
      "https://www.binance.com/api/v3/ticker/price?symbol=BNBUSDT"
    )
      .then((response) => response.json())
      .then((data) => {
        let bnb = data.price;
        let value = fee / bnb;
        setInvestment(value);
      });
  }, []);

  async function callContract() {
    //Definición del proveedor
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log(provider);
    await provider.send("eth_requestAccounts", []);

    //Arreglo con todos lo datos de la wallet
    let signer = await provider.getSigner();
    console.log("el signer:", signer);

    //Obtener el balance en bignumber de la cuenta
    const balance = await signer.getBalance();
    console.log("mi balance", balance);

    //Conversión del balance de bignumber a bnb
    const convertToEth = 1e18;
    bnbBalance = balance.toString() / convertToEth;
    console.log("account's balance in bnb:", bnbBalance);
    setBalance(bnbBalance);

    //Obtener la billetera de la persona
    let newWallet = await signer.getAddress();
    setUserWallet(newWallet);
    console.log("Account address s:", newWallet);

    //Conexion con el contrato
    const contractConnect = new ethers.Contract(contractAdd, abi, signer);

    //Obtener las wallets que se han registrado
    const walletsUsed = await contractConnect.totalWalletsUsed();

    //Obtener la cantidad total de wallets disponibles
    const totalWallets = await contractConnect.totalWallets();
    console.log("Cuentas totales:", totalWallets);

    //Obtener la cantidad disponibles
    const walletsAvailables = totalWallets - walletsUsed;
    console.log("Cuentas disponibles:", walletsAvailables);
    setRemainingWallets(walletsAvailables);

    //Obtiene la data de la inversión
    const vestingInfo = await contractConnect.getVesting(newWallet);

    //Calculo de las ganancias
    const earnPerSecond = "0.535";
    let time = vestingInfo.timeBlock - vestingInfo.timeInit;
    let totalEarned = time * earnPerSecond;
    setProfit(totalEarned);
    console.log(totalEarned);

    //Devuelve un boolean en caso de que la wallet este o no este invirtiendo
    const isVestedTrue = await contractConnect.isVesting(newWallet);
    if (isVestedTrue == true) {
      setInvesting(true);
    }

    //Actualiza el estado del link de referido
    const linkReferal = `https://bestlifecoin.club/hold.html?referral=${newWallet}`;
    console.log(linkReferal);
    setReferalLink(linkReferal);
  }

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");

      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return false;
  }

  async function holding() {
    await window.ethereum;
    var accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    //Hay que revisar esta variables para declararlas en un solo sitio
    const account = accounts[0];
    let accountRefer = "0x2F53e1D33bBA31160e93a81B7c3C5E907304438d";
    var web3js = new Web3(window.ethereum);
    var decimals = 18;
    var valueFee = "0";
    var amount = "";
    var dataApi = "";
    var bnbPrice = 0;
    var fee = 10000;
    var value = 0;

    if (getQueryVariable("referral") != false) {
      accountRefer = getQueryVariable("referral");
    }

    console.log(accountRefer);

    fetch(
      "https://www.binance.com/api/v3/ticker/price?symbol=BNBUSDT"
    )
      .then((response) => response.json())
      .then((json) => {
        dataApi = json;
        bnbPrice = dataApi.price;
        valueFee = fee / bnbPrice;
        value = valueFee * 10 ** decimals;
        console.log(value);
        amount = web3js.utils.toBN(value);
        console.log(amount);

        let contractConnect = new web3js.eth.Contract(abi, contractAdd);
        contractConnect.methods
          .stakingInitial(accountRefer)
          .send({
            from: account,
            value: amount,
          })
          .then((result) => {
            console.log(result);
            Swal.fire({
              title: "Success!",
              text: "It has been registered successfully!",
              icon: "success",
              confirmButtonText: "Continue...",
            });
            window.location.reload(false);
          })
          .catch(function (error) {
            console.log(error);
            Swal.fire({
              title: "Error!",
              text: "Sorry, but an error has occurred!!",
              icon: "error",
              confirmButtonText: "Continue...",
            });
          });
      });
  }

  async function claimTokens() {
    await window.ethereum;
    var accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = accounts[0];
    var web3js = new Web3(window.ethereum);
    let contractConnect = new web3js.eth.Contract(abi, contractAdd);
    contractConnect.methods
      .withdrawalVesting()
      .send({
        from: account,
      })
      .then((result) => {
        console.log(result);
        alert("Tokens claimed successfull");
      })
      .catch(function (error) {
        alert("Error");
      });
  }

  async function initialInvestWithdraw() {
    await window.ethereum;
    var accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = accounts[0];
    var web3js = new Web3(window.ethereum);
    let contractConnect = new web3js.eth.Contract(abi, contractAdd);
    contractConnect.methods
      .withdrawalInitialDeposit()
      .send({
        from: account,
      })
      .then((result) => {
        alert("Successfull Withdraw");
        window.location.reload(false);
      })
      .catch(function (error) {
        alert("Error");
      });
  }

  async function addToken() {
    const tokenAddress = "0xa2575197D2b5853A62307023bF6bd4797270F21C";
    const tokenSymbol = "FRT";
    const tokenDecimals = 18;
    const tokenImage = "http://localhost:3000/_next/static/media/bnb.6b605693.png";

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20", // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      {correctNetwork == true ? (
        <div className="container">
          <div className="row" style={{ marginTop: "60px" }}>
            <div className="col-md-12">
              <h1 className="text-center">Vesting Program</h1>
              <h4 className="text-center">
                Aporte: 10K usdt/bnb. Tokens x segundo: 0.535. Total: 33.333.333 FRT
              </h4>
            </div>
          </div>
          <InfoPayments />

          <div className="row">
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-4">
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={addToken}
                      style={{
                        borderRadius: "1px",
                        background: "#ffffff",
                        color: "#000",
                      }}
                    >
                      ADD FRT
                    </button>
                  </div>
                  <br />
                </div>

                <div className="col-md-4">
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{
                        borderRadius: "1px",
                        background: "#ffffff",
                        color: "#000",
                      }}
                    >
                      {balance == 0 ? "BALANCE 0" : balance} BNB
                    </button>
                  </div>
                  <br />
                </div>
                <div className="col-md-4">
                  <div className="d-grid gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={callContract}
                      style={{
                        width: "100%",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        borderRadius: "1px",
                        background: "#ffffff",
                        color: "#000",
                      }}
                    >
                      {userWallet != 0 ? userWallet : "LOGIN METAMASK"}
                    </button>
                    <br />
                  </div>
                </div>
                <br />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <CardDetails
                title="Total Wallets"
                value="100 Wallets"
                id="availableWallets"
              />
              <br />
            </div>
            <div className="col-md-6">
              <CardDetails title="Remaining Wallets" value={remainingWallets} />
            </div>
          </div>
          <br />
          {investing == true ? (
            <>
              <div className="row">
                <div className="col-md-6">
                  <CardDetails title="Earned Tokens" value={profit} />
                  <div className="d-grid gap-2">
                    <button
                      href="#"
                      className="btn btn-primary"
                      onClick={claimTokens}
                    >
                      CLAIM
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <CardDetails title="Initial Holding" value="500.000 Tokens" />
                  <div className="d-grid gap-2">
                    <button
                      href="#"
                      className="btn btn-primary"
                      onClick={initialInvestWithdraw}
                    >
                      WITHDRAW INITIAL HOLDING
                    </button>
                  </div>
                </div>
              </div>
              <br />
            </>
          ) : (
            <>
              <div className="row">
                <div className="col-md-12">
                  <div className="card">
                    <h5 className="card-header text-center">Deposit Here!</h5>
                    <div className="card-body">
                      <div className="input-group input-group-lg">
                        <input
                          type="text"
                          className="form-control text-center"
                          aria-label="Sizing example input"
                          aria-describedby="inputGroup-sizing-lg"
                          placeholder={investment}
                          disabled
                        />
                      </div>
                      <br />
                      {balance < investment ? (
                        <div
                          className="alert alert-danger alert-dismissible fade show"
                          role="alert"
                        >
                          <strong>Excuse me!</strong> You do not have funds to
                          perform this operation.
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="alert"
                            aria-label="Close"
                          ></button>
                        </div>
                      ) : (
                        <p className="text-center">
                          <a
                            href="#"
                            className="btn btn-primary"
                            onClick={holding}
                          >
                            Go Hold
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginTop: "20px" }}>
                <div className="col-md-12 text-center">
                  <h6>
                    <b>
                    </b>
                  </h6>
                </div>
              </div>
              
            </>
          )}
        </div>
      ) : (
        <div className="row">
          <div className="col-md-12">
            <div className="container">
              <div className="card mt-3">
                <div className="row g-0">
                  <div className="col-md-4">
                    <Image
                      src={info}
                      className="img-fluid rounded-start"
                      alt="..."
                      width={200}
                      height={200}
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body">
                      <h5 className="card-title">This is not an error...</h5>
                      <p className="card-text">
                        If you are seeing this message, it is probably because
                        your current wallet is not currently configured with the{" "}
                        <b>Binance Smart Chain network</b>, otherwise, if you
                        entered from a mobile device, you can enter through the
                        following button
                      </p>
                      <p className="card-text">
                        <Link href="https://metamask.app.link/dapp/investors.fractalcm.com/hold10000">
                          <a>
                            <button type="button" className="btn btn-success">
                              Enter here!
                            </button>
                          </a>
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <br />
      <div className="row">
        <Link href="/">
          <div className="col-md-12 text-center">
            <Image src={atras} width="100" height="60" />
          </div>
        </Link>
      </div>
    </>
  );
}
