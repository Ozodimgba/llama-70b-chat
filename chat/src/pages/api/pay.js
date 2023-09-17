import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { encodeURL, findReference, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';



async function verifyTransaction(reference) {
  // 1 - Check that the payment request exists
  const paymentData = paymentRequests.get(reference.toBase58());
  if (!paymentData) {
    throw new Error('Payment request not found');
  }
  const { recipient, amount, memo } = paymentData;
  // 2 - Establish a Connection to the Solana Cluster
  const connection = new Connection(quicknodeEndpoint, 'confirmed');
  console.log('recipient', recipient.toBase58());
  console.log('amount', amount);
  console.log('reference', reference.toBase58());
  console.log('memo', memo);

  // 3 - Find the transaction reference
  const found = await findReference(connection, reference);
  console.log(found.signature);

  // 4 - Validate the transaction
  const response = await validateTransfer(
    connection,
    found.signature,
    {
      recipient,
      amount,
      splToken: undefined,
      reference,
      //memo
    },
    { commitment: 'confirmed' }
  );
  // 5 - Delete the payment request from local storage and return the response
  if (response) {
    paymentRequests.delete(reference.toBase58());
  }
  return response;
}

async function verifyHandler(req, res) {
  // ...
  if (req.method === 'GET') {
    // 1 - Get the reference query parameter from the NextApiRequest
    const reference = req.query.reference;
    if (!reference) {
      res.status(400).json({ error: 'Missing reference query parameter' });
      return;
    }
    // 2 - Verify the transaction
    try {
      const referencePublicKey = new PublicKey(reference);
      const response = await verifyTransaction(referencePublicKey);
      console.log(response)
      if (response) {
        res.status(200).json({ status: 'verified' });
      } else {
        res.status(404).json({ status: 'not found' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  // ...
}

export { verifyHandler };
