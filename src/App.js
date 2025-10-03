import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Rent from "./pages/Rent";
import Return from "./pages/Return";
import "./App.css";
import Signup from "./pages/SignUp";
import Paymentsuccess from "./pages/payments/complete";
import DamageOrLossRequest from "./pages/DamageOrLossRequest";

const App = () => {
  return (
    <div className="app">
      <div className="container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/return" element={<Return />} />
          <Route path="/payments/complete" element={<Paymentsuccess />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/DamageOrLossRequest"
            element={<DamageOrLossRequest />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
