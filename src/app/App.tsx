import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ContentProvider } from './contexts/ContentContext';
import { AdminProvider } from './contexts/AdminContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { EmployeesProvider } from './contexts/EmployeesContext';
import { useEffect } from 'react';

export default function App() {
  return (
    <LanguageProvider>
      <AdminProvider>
        <ContentProvider>
          <AuthProvider>
            <CustomerProvider>
              <EmployeesProvider>
                <BookingProvider>
                  <RouterProvider router={router} />
                </BookingProvider>
              </EmployeesProvider>
            </CustomerProvider>
          </AuthProvider>
        </ContentProvider>
      </AdminProvider>
    </LanguageProvider>
  );
}
