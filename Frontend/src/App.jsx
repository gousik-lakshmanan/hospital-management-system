import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppointmentProvider } from './context/AppointmentContext';
import { RoomProvider } from './context/RoomContext';
import { BloodBankProvider } from './context/BloodBankContext';
import { PharmacyProvider } from './context/PharmacyContext';
import { PrescriptionProvider } from './context/PrescriptionContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <NotificationProvider>
            <AppointmentProvider>
              <RoomProvider>
                <BloodBankProvider>
                  <PharmacyProvider>
                    <PrescriptionProvider>
                      <AppRoutes />
                    </PrescriptionProvider>
                  </PharmacyProvider>
                </BloodBankProvider>
              </RoomProvider>
            </AppointmentProvider>
          </NotificationProvider>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
