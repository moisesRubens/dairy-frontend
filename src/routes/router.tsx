import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProductList from "../pages/Product";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductList />} />
      </Routes>
    </BrowserRouter>
  );
}