"use client"

import { createQR, encodeURL } from "@solana/pay";
import { Keypair } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import BackLink from "../components/BackLink";
//import PageHeading from "../../components/PageHeading";
import { shopAddress, usdcAddress } from "../../../chat/src/data/addresses";
import calculatePrice from "../../../chat/src/utils/calculatePrice";

export default function Checkout() {
  const { query } = useRouter();

  // ref to a div where we'll show the QR code
  const qrRef = useRef(null);

  const amount = useMemo(() => calculatePrice(query), [query]);

  // Unique address that we can listen for payments to
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  // Solana Pay transfer params
  const urlParams = {
    recipient: shopAddress,
    splToken: usdcAddress,
    amount,
    reference,
    label: "Cookies Inc",
    message: "Thanks for your order! 🍪",
  };

  // Encode the params into the format shown
  const url = encodeURL(urlParams);
  console.log({ url });

  // Show the QR code
  useEffect(() => {
    const qr = createQR(url, 512, "transparent");
    if (qrRef.current && amount.isGreaterThan(0)) {
      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    }
  }, [amount, url]);

  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/shop">Cancel</BackLink>

      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      {/* div added to display the QR code */}
      <div ref={qrRef} />
    </div>
  );
}
