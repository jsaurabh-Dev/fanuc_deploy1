import React, { useState, useEffect } from "react";
import PasswordChecker from "./UtilityDemo/PasswordChecker";
import DashboardAllMachines from "./Dashboard/DashboardAllMachines";

const UtilityDashboard1: React.FC = () => {
  const [isDashboardAvailable, setIsDashboardAvailable] = useState(false);

  useEffect(() => {
    setIsDashboardAvailable(false);
  }, []);

  const handlePasswordCheck = (passwordExists: boolean) => {
    setIsDashboardAvailable(passwordExists);
  };

  return (
    <div>
      {isDashboardAvailable ? (
        <div>
          <DashboardAllMachines />
        </div>
      ) : (
        <PasswordChecker onPasswordCheck={handlePasswordCheck} />
      )}
    </div>
  );
};

export default UtilityDashboard1;
