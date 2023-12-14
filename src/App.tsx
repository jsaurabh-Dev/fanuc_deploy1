import Header from "./components/Dashboard/Nav/Header";
import "bootstrap/dist/css/bootstrap.min.css";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import MachineDetail from "./components/Dashboard/MachineInfo/MachineDetail";
import Dashboard from "./components/Dashboard/Dashboard";
import UtilityDashboard from "./components/UtilityDashboard";
import ContactUs from "./components/ContactUs";
import UtilityDemoForm from "./components/UtilityDemo/UtilityDemoForm";
import Footer from "./components/Footer";
import React from "react";
import HomePage from "./components/HomePage";
import Navbar1 from "./components/Navbar1";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MonthlyReport from "./components/Reports/MonthlyReport/MonthlyReport";
import DashboardAllMachines from "./components/Dashboard/DashboardAllMachines";
import Report from "./components/Reports/Report";
import UtilityDashboard1 from "./components/UtilityDashboard1";
function App() {
  return (
    <React.Fragment>
      <ToastContainer />
      <BrowserRouter>
        <div>
          {/* <Navbar/> */}
          <Navbar1 />
          <Routes>
            <Route
              path="/dashboardAllMachines"
              element={<DashboardAllMachines />}
            />

            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<UtilityDashboard />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/ulogin" element={<UtilityDemoForm />} />
            {/* <Route path="machine/:Name" element={<MachineDetail />} /> */}
            <Route
              path="/machine-report/:selectedMachine"
              element={<Report />}
            />
            <Route
              path="dashboard/monthly-report"
              element={<MonthlyReport />}
            />
             <Route path="/dashboard1" element={ <UtilityDashboard1 /> }/>
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
    </React.Fragment>
  );
}

export default App;
