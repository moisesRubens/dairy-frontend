import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import ProductList from "../pages/Product";
import { OrdersPage } from "../pages/Order";
import SalePoint from "../pages/SalePoint";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/pontos-de-venda" element={<SalePoint />} />
      </Routes>
    </BrowserRouter>
  );
}