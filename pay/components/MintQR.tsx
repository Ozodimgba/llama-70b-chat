import { useEffect, useMemo, useRef } from "react";
import { Flex } from "@chakra-ui/react";
import {
  createQR,
  encodeURL,
  TransactionRequestURLFields,
  findReference,
  FindReferenceError,
} from "@solana/pay";
import { setCookie } from 'cookies-next';
import { Keypair, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import useToastHook from "@/hooks/useToastHook";
import BigNumber from 'bignumber.js';

export default function MintQR() {
  const { connection } = useConnection();

  // Initialize a ref used for the QR code
  const qrRef = useRef<HTMLDivElement>(null);

  const myWallet = 'Ehg4iYiJv7uoC6nxnX58p4FoN5HPNoyqKhCMJ65eSePk'; // Replace with your wallet address
  const recipient = new PublicKey(myWallet);
  const amount = new BigNumber(0.1); // 0.1 SOL
  const reference = useMemo(() => Keypair.generate().publicKey, []);
  const label = 'AI Chatbot';
  const message = `Payment for chat credits - Order ID #0${Math.floor(Math.random() * 999999) + 1}`;
  const memo = 'FX Solana Pay Superteam NG';

  // Generate a random reference address that is added to the Solana Pay transaction
  // This allows us to find the transaction on the network once it's been sent by the mobile wallet
  

  // Keep track of the most recent transaction that was notified, so we can reuse the reference address
  // Alternatively, you can generate a new reference address for each transaction
  const mostRecentNotifiedTransaction = useRef<string | undefined>(undefined);

  // Toast notification hook
  const displayToast = useToastHook();

  useEffect(() => {
    // The API URL, which will be used to create the Solana Pay URL
    // Append the reference address to the URL as a query parameter
    const { location } = window;
    const apiUrl = `${location.protocol}//${
      location.host
    }/api/mintNft?reference=${reference.toBase58()}`;

    // Create Solana Pay URL
    const urlParams: TransactionRequestURLFields = {
      link: new URL(apiUrl),
    };
    const solanaUrl = encodeURL({ recipient, amount, reference, label, message, memo });

    // Create QR code encoded with Solana Pay URL
    const qr = createQR(
      solanaUrl, // The Solana Pay URL
      350, // The size of the QR code
      "transparent" // The background color of the QR code
    );

    // Update the ref with the QR code
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
  }, [reference]);

  useEffect(() => {
    // Poll the network for transactions that include the reference address
    const interval = setInterval(async () => {
      try {
        // Find transactions that include the reference address
        const signatureInfo = await findReference(connection, reference, {
          until: mostRecentNotifiedTransaction.current, // Only look for transactions after the most recent one we've found
          finality: "confirmed",
        });

        // Update the most recent transaction with the transaction we just found
        mostRecentNotifiedTransaction.current = signatureInfo.signature;
        console.log(signatureInfo)
        // Toast notification
        setCookie('signature', signatureInfo, { maxAge: 60 * 6 * 24 });
        displayToast(signatureInfo.signature);
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return;
        }
        console.error("Unknown error", e);
      }
    }, 1000); // Check for new transactions every second
    return () => {
      clearInterval(interval);
    };
  }, [reference]);

  return <Flex ref={qrRef} />;
}
