import React, { useState } from 'react';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { encodeURL, validateTransfer, parseURL, TransferRequestURL, findReference, createQR } from '@solana/pay';
import BigNumber from 'bignumber.js';
import Image from 'next/image';

async function generateUrl(
    recipient,
    amount,
    reference,
    label,
    message,
    memo
) {
    console.log('1. Create a payment request link');
    const url = encodeURL({ recipient, amount, reference, label, message, memo });
    console.log('Payment request link:', url);
    return url;
}

const paymentRequests = new Map();

const SolanaPayPage = () => {
    const [qrCode, setQrCode] = useState();
  // Define your constants here
  const myWallet = 'Ehg4iYiJv7uoC6nxnX58p4FoN5HPNoyqKhCMJ65eSePk'; // Replace with your wallet address
  const recipient = new PublicKey(myWallet);
  const spl = new PublicKey('So11111111111111111111111111111111111111111');
  const quickNodeEndpoint = 'https://api.devnet.solana.com'; // Replace with your QuickNode endpoint
  const connection = new Connection(quickNodeEndpoint, 'confirmed');
  const amount = new BigNumber(0.1); // 0.1 SOL
  const reference = new Keypair().publicKey;
  const label = 'AI Chatbot';
  const message = `Payment for chat credits - Order ID #0${Math.floor(Math.random() * 999999) + 1}`;
  const memo = 'FX Solana Pay Superteam NG';

  // State to store the payment URL
  const [paymentUrl, setPaymentUrl] = useState('');

  // State to store payment confirmation
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Function to generate a payment request URL
  const generatePaymentUrl = async () => {
    try {
      const url = await generateUrl(recipient, amount, reference, label, message, memo);
      setPaymentUrl(url.href);
      console.log(url.href)

      const qr = createQR(url);
      const qrBlob = await qr.getRawData('png');

      const ref = reference.toBase58();
      paymentRequests.set(ref, { recipient, amount, memo });
      if (!qrBlob) return;
      // 3 - Convert the blob to a base64 string (using FileReader) and set the QR code state
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setQrCode(event.target.result);
        }
      };
      reader.readAsDataURL(qrBlob);
    } catch (err) {
      console.error(err);
    }
  };


  async function verifyTransaction(reference) {
    
     // Replace with your QuickNode endpoint
    // - Establish a Connection to the Solana Cluster
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    // console.log('recipient', recipient.toBase58());
    // console.log('amount', amount);
    // console.log('reference', reference.toBase58());
    // console.log('memo', memo);
  
    const rep = recipient
    // // 3 - Find the transaction reference
    // const found = await findReference(connection, reference);
    // console.log(found.signature);

    const signature = "3EdTTkaUgfuQs4ht2Z7koVwLvvaRiMo61C5JYzkXQ1qtfVMZwAsvJR14tF8g6yeQNJdgBL5ceC6JiZVH1unzGrhD"
  
    const response = await connection.getTransaction(signature);
    // 5 - Delete the payment request from local storage and return the response

    return response;
  }

const handleVerifyClick = async () => {
    // 1 - Check if the reference is set
    if (!reference) {
      alert('Please generate a payment order first');
      return;
    }

    const referencePublicKey = new PublicKey(reference);
    const response = await verifyTransaction(referencePublicKey);
 
    console.log(response)
 
  };
  return (
    <div className='text-white'>
      <h1>Solana Pay Page</h1>
      <button onClick={generatePaymentUrl}>Generate Payment URL</button>
      {paymentUrl && (
        <>
          <p>Payment URL: {paymentUrl}</p>
          {qrCode && (
          <Image
            src={qrCode}
            style={{ position: "relative", background: "white" }}
            alt="QR Code"
            className='rounded-lg'
            width={400}
            height={400}
            priority
          />
        )}
          {reference && <button
            style={{ cursor: 'pointer', padding: '10px' }}
            onClick={handleVerifyClick}
          >
            Verify Transaction
          </button>}
        </>
      )}
    </div>
  );
};

export default SolanaPayPage;
