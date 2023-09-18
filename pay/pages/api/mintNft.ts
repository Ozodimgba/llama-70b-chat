// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { getRandomUri } from "@/utils/utils";

type GetResponse = {
  label: string;
  icon: string;
};

type PostRequest = {
  account: string;
};

type PostResponse = {
  transaction: string;
  message: string;
};

type PostError = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
  if (req.method === "GET") {
    return get(res);
  } else if (req.method === "POST") {
    return await post(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

function get(res: NextApiResponse<GetResponse>) {
  // GET Response
  res.status(200).json({
    label: "NFT Minter",
    icon: "https://raw.githubusercontent.com/ZYJLiu/opos-asset/main/assets/OPOS_Social_Square.png",
  });
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse | PostError>
) {
  // Address of the user's wallet
  const { account } = req.body as PostRequest;

  // Address generated by the frontend
  // The "reference" address is used by the frontend to find the transaction once sent
  const { reference } = req.query;

  if (!account || !reference) {
    res.status(400).json({
      error: "Required data missing. Account or reference not provided.",
    });
    return;
  }

  try {
    // Helper function to build the serialized transaction
    const transaction = await buildTransaction(
      new PublicKey(account),
      new PublicKey(reference)
    );

    // POST Response
    res.status(200).json({
      transaction,
      message: "Confirm to Mint NFT",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating transaction" });
    return;
  }
}

// Helper function to build the transaction
async function buildTransaction(account: PublicKey, reference: PublicKey) {
  // Connect to devnet cluster
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Generate keypair to use as address of token account
  const mintKeypair = Keypair.generate();

  // Calculate minimum lamports for space required by mint account
  const lamportsForMintAccount = await getMinimumBalanceForRentExemptMint(
    connection
  );

  // 1) Instruction to invoke System Program to create new account with space for new mint account
  const createMintAccountInstruction = SystemProgram.createAccount({
    fromPubkey: account, // payer
    newAccountPubkey: mintKeypair.publicKey, // mint account address
    space: MINT_SIZE, // space (in bytes) required by mint account
    lamports: lamportsForMintAccount, // lamports to transfer to mint account
    programId: TOKEN_PROGRAM_ID, // new program owner
  });

  // 2) Instruction to invoke Token Program to initialize mint account
  const initializeMintInstruction = createInitializeMint2Instruction(
    mintKeypair.publicKey, // mint address
    0, // decimals of mint (0 for NFTs)
    account, // mint authority
    null // freeze authority
  );

  // Derive associated token account address from mint address and token account owner
  // This address is a PDA (Program Derived Address) and is generated deterministically
  const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
    mintKeypair.publicKey, // mint address
    account // token account owner
  );

  // 3) Instruction to invoke Associated Token Program to create associated token account
  // The Associated Token Program invokes the Token Program to create the token account with a PDA as the address of the token account
  const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
    account, // payer
    associatedTokenAccountAddress, // associated token account address
    account, // owner
    mintKeypair.publicKey // mint address
  );

  // 4) Instruction to invoke Token Program to mint 1 token to associated token account
  const mintTokenInstruction = createMintToInstruction(
    mintKeypair.publicKey, // mint address
    associatedTokenAccountAddress, // destination
    account, // mint authority
    1 // amount
  );

  // Derive the Metadata account address
  const [metadataAccountAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"), // hard-coded string "metadata"
      METADATA_PROGRAM_ID.toBuffer(), // metadata program address
      mintKeypair.publicKey.toBuffer(), // mint address
    ],
    METADATA_PROGRAM_ID // metadata program address
  );

  // 5) Instruction invoke Metaplex Token Metadata Program to create the Metadata account
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccountAddress, // metadata account address
      mint: mintKeypair.publicKey, // mint address
      mintAuthority: account, // authority to mint tokens
      payer: account, // payer
      updateAuthority: account, // authority to update metadata account
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          creators: null, // creators of the NFT (optional)
          name: "OPOS", // on-chain name
          symbol: "OPOS", // on-chain symbol
          uri: getRandomUri(), // off-chain metadata
          sellerFeeBasisPoints: 0, // royalty fee
          collection: null, // collection the NFT belongs to (optional)
          uses: null, // uses (optional)
        },
        collectionDetails: null, // collection details (optional)
        isMutable: false, // whether the metadata can be changed
      },
    }
  );

  // 6) Instruction to invoke Token Program to set mint authority to null
  const setAuthorityInstruction = createSetAuthorityInstruction(
    mintKeypair.publicKey, // mint address
    account, // current authority (mint authority)
    0, // authority type (mint authority)
    null // new authority
  );

  // Add the reference  to an instruction
  // Used by frontend to find the transaction once sent
  createMintAccountInstruction.keys.push({
    pubkey: reference,
    isSigner: false,
    isWritable: false,
  });

  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  // create new Transaction and add instruction
  const transaction = new Transaction({
    feePayer: account, // transaction fee payer
    blockhash: blockhash, // recent blockhash
    lastValidBlockHeight: lastValidBlockHeight, // last valid block height (when transaction expires)
  }).add(
    // 1) Create mint account
    createMintAccountInstruction,

    // 2) Initialize mint account
    initializeMintInstruction,

    // 3) Create associated token account
    createTokenAccountInstruction,

    // 4) Mint 1 token to associated token account
    mintTokenInstruction,

    // 5) Create metadata account
    createMetadataInstruction,

    // 6) Set mint authority to null
    setAuthorityInstruction
  );

  // Sign the transaction with the mint keypair
  transaction.sign(mintKeypair);

  // Serialize the transaction
  return transaction
    .serialize({ requireAllSignatures: false })
    .toString("base64");
}