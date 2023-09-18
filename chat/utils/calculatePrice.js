import BigNumber from "bignumber.js";
import { ParsedUrlQuery } from "querystring";
import { products } from "../../llama-chat/data/products";

export function calculatePrice(query) {
  let amount = new BigNumber(0);
  for (let [id, quantity] of Object.entries(query)) {
    const product = products.find((p) => p.id === id);
    if (!product) continue;

    const price = product.priceUSD;
    const productQuantity = new BigNumber(quantity);
    amount = amount.plus(productQuantity.multipliedBy(price));
  }

  return amount;
}