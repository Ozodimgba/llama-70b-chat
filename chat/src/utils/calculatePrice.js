import BigNumber from "bignumber.js";
import { products } from "../data/products";

export function calculatePrice(query) {
  let amount = new BigNumber(0);

  for (let id in query) {
    if (!query.hasOwnProperty(id)) {
      continue;
    }

    const quantity = query[id];
    const product = products.find((p) => p.id === id);

    if (!product) {
      continue;
    }

    const price = product.priceUSD;
    const productQuantity = new BigNumber(quantity);
    amount = amount.plus(productQuantity.multipliedBy(price));
  }

  return amount;
}
