import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { encodeURL, createQR, findReference, validateTransfer, FindReferenceError } from '@solana/pay';
import BigNumber from 'bignumber.js';



function PaymentQRCode() {

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    
    const recipient = new PublicKey('Ehg4iYiJv7uoC6nxnX58p4FoN5HPNoyqKhCMJ65eSePk');
    const amount = new BigNumber(1000); // Amount in lamports
    const reference = '4000 chat credits';
    const label = 'AI chat credits';
    const message = 'You are purchasing chat time with the SuperteamNG chat bot';
    const memo = 'Your Memo';
  
    // Create a payment request URL
    const url = encodeURL({ recipient, amount, reference, label, message, memo });
  
    // Create a QR code from the URL
    const qrCode = createQR(url);
  
    return (
      <div className='bg-white w-[100%] h-[100vh]'>
        {/* Display the QR code */}
        <img src={qrCode} alt="Payment QR Code" />
  
        {/* Display other payment details */}
        <p>Recipient: {recipient.toBase58()}</p>
        <p>Amount: {amount.toString()} lamports</p>
        <p>Reference: {reference}</p>
        <p>Label: {label}</p>
        <p>Message: {message}</p>
        <p>Memo: {memo}</p>
      </div>
    );
  }
  
  export default PaymentQRCode;
