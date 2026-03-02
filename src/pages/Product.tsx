// src/pages/Product.tsx
import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/productService";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts()
      .then(setProducts) // already an array
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