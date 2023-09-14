import Link from "next/link";
import React from "react";
import { HiArrowLeft } from "react-icons/hi";

export default function BackLink({ children, href }) {
  return (
    <Link href={href} className="flex items-center my-2 text-md dark:text-white">
      <HiArrowLeft />
      <span className="ml-2 hover:underline">{children}</span>
    </Link>
  );
}
