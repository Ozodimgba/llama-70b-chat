
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, Transaction } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import BackLink from "../../components/BackLink";
//import Loading from "../components/Loading";
import { useRouter } from "next/navigation";

export default function Checkout() {
  const { query } = useRouter();
  const { publicKey } = useWallet();

  // State to hold API response fields
  const [transaction, setTransaction] = useState(null);
  const [message, setMessage] = useState(null);

  // Read the URL query (which includes our chosen products)
  const searchParams = new URLSearchParams(query);

  // Generate the unique reference which will be used for this transaction
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  // Add it to the params we'll pass to the API
  searchParams.set("reference", reference.toString());

  // Use our API to fetch the transaction for the selected items
  async function getTransaction() {
    if (!publicKey) {
      return;
    }

    const body = {
      account: publicKey.toString(),
    };

    const response = await fetch(`/api/makeTransaction?${searchParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    if (response.status !== 200) {
      console.error(json);
      return;
    }

    // Deserialize the transaction from the response
    const transaction = Transaction.from(Buffer.from(json.transaction, 'base64'));
    setTransaction(transaction);
    setMessage(json.message);
    console.log(transaction);
  }

  useEffect(() => {
    getTransaction();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className='flex flex-col gap-8 items-center'>
        <div><BackLink href='/'>Cancel</BackLink></div>

        <WalletMultiButton />

        <p>You need to connect your wallet to make transactions</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-8 items-center'>
      <div><BackLink href='/'>Cancel</BackLink></div>

      <WalletMultiButton />

      {message ?
        <p>{message} Please approve the transaction using your wallet</p> :
        <p>Creating transaction...</p>
      }
    </div>
  );
}
