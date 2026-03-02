import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/productService";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts()
      .then((data) => {
        // data é { "product created": {...} }
        // Transformamos em array para poder mapear
        const productArray = data["product created"] ? [data["product created"]] : [];
        setProducts(productArray);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Produtos</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - R${p.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}