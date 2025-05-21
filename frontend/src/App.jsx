import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import QueryProvider from './providers/QueryProvider';

function App() {
  return (
    <Router>
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <Authenticator>
          {({ signOut, user }) => (
            <QueryProvider>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </DashboardLayout>
            </QueryProvider>
          )}
        </Authenticator>
      </div>
    </Router>
  );
}

export default App;
