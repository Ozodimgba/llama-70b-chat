import { Box, Flex, VStack, Spacer } from "@chakra-ui/react";
import WalletMultiButton from "@/components/WalletMultiButton";
import MintButton from "@/components/MintButton";
import { getCookies, setCookie, deleteCookie, getCookie } from 'cookies-next';
import MintQR from "@/components/MintQR";

export default function Home() {
  
  const paid = getCookie('signature');
  console.log(paid)
  return (
    <Box>
      <Flex px={4} py={4}>
        <Spacer />
        <WalletMultiButton />
      </Flex>

      <VStack justifyContent="center">
        <MintQR />
        <h1> Or pay with wallet </h1>
        <MintButton />
      </VStack>
    </Box>
  );
}
