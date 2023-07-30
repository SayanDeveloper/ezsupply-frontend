import React, {useState, useEffect, useContext} from 'react';
import SideNav from './SideNav';
import TopNav from './TopNav';
import ToastAlert from './ToastAlert';
import '../styles/LoginRegister.css';
import '../styles/main.css';
import { GlobalContext } from '../context/provider';
import Web3 from "web3";
import supplyChain from '../contracts/supplyChain.json';
import SoftLoader from './SoftLoader';

function AddProduct() {
  // states
  const [prodName, setProdName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState();
  const [currentDate, setCurrentDate] = useState();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  // context
  const {toast, solid, soft, web3Ac, UserData} = useContext(GlobalContext);
  const [userData, setUserData] = UserData;
  const [toastAppear, setToastAppear] = toast;
  const [loading, setLoading] = solid;
  const [softLoading, setSoftLoading] = soft;
  const [acct, setAcct] = web3Ac;

  // functions
  useEffect(() => {
    const d = new Date();
    setDate(d.toISOString().substr(0, 10));
    async function metamaskConnection() {
      if (window.ethereum) {
        try {
          let acc = await window.ethereum.send("eth_requestAccounts");
          let web3 = new Web3(window.ethereum);
          setWeb3(web3);
          setLoading(false);
        } catch(err) 
        {
          console.log(err.message);
        }
      }
      setSoftLoading(false);
    }
    // Get year, month, and day part from the date
    let year = d.toLocaleString("default", { year: "numeric" });
    let month = d.toLocaleString("default", { month: "2-digit" });
    let day = d.toLocaleString("default", { day: "2-digit" });

    // Generate yyyy-mm-dd date string
    let formattedDate = year + "-" + month + "-" + day;
    setCurrentDate(formattedDate);
    metamaskConnection();
  }, []);

  useEffect(() => {
    if (contract) {
      contract.methods.addProduct(
        date,
        prodName,
        web3.utils.asciiToHex(prodName),
        `${acct} (manufacturer)`, //owner_name
        userData.orgName, // manu_name
        parseInt(quantity)
      ).send({from: acct})
      .then(res => {
        setToastAppear(true);
        setSoftLoading(false);
        setProdName("");
      })
      .catch(err => {
        setSoftLoading(false);
        alert(err.message);
      });
    }
  }, [contract]);

  const addProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodName) {
      alert("Please provide a product name");
      return;
    }
    setSoftLoading(true);
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = supplyChain.networks[networkId];
    const instance = new web3.eth.Contract(
      supplyChain.abi,
      deployedNetwork && deployedNetwork.address
    );
    setContract(instance);
    console.log(instance);
  }

  if (sessionStorage.getItem('token') == null) {
    window.location.href = "/login";
    return;
  }
  if (!web3) {
    return <SoftLoader />
  }
  return (
    <>
      <TopNav />
      <SideNav />
      <div className='main-content-container add-prod-page'>
        {
          toastAppear ?
          <ToastAlert message={"The product has been added"} />
          : ""
        }
        <h2>Add Product</h2>
        <form className='add-prod-inputs login-form' onSubmit={(e) => addProductSubmit(e)}>
          <div>
              <input 
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder='Enter product name'
                  required={true}
              />
              <label htmlFor="">Product Name</label>
          </div>
          <div>
              <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required={true}
                  min="1"
                  max="30"
              />
              <label htmlFor="">Quantity</label>
          </div>
          <div>
              <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min="2000-01-01" max={currentDate}
                  required={true}
              />
              <label htmlFor="">Manufacturing date (mm/dd/yyyy)</label>
          </div>
          <button type="submit">Add</button>
        </form>
      </div>
    </>
  );
}

export default AddProduct;
