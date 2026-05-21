/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { IssuesList } from './pages/IssuesList';
import { CreateIssue } from './pages/CreateIssue';
import { IssueDetails } from './pages/IssueDetails';
import { Tasks } from './pages/Tasks';
import { RootCauseAnalysis } from './pages/RootCauseAnalysis';
import { Report8D } from './pages/Report8D';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { AiAssistant } from './pages/AiAssistant';
import { DataAnalytics } from './pages/DataAnalytics';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { Audit } from './pages/Audit';
import { BomList } from './pages/BomList';
import { BomWorkbench } from './pages/BomWorkbench';
import { SchemaDesign } from './pages/SchemaDesign';
import { ToastProvider } from './components/ui/use-toast';

// Quality Docs Module
import { DocsList } from './modules/quality-docs/pages/DocsList';
import { DocForm } from './modules/quality-docs/pages/DocForm';
import { DocDetails } from './modules/quality-docs/pages/DocDetails';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="issues" element={<IssuesList />} />
            <Route path="issues/new" element={<CreateIssue />} />
            <Route path="issues/:id" element={<IssueDetails />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="rca" element={<RootCauseAnalysis />} />
            <Route path="rca/:id" element={<RootCauseAnalysis />} />
            <Route path="8d-reports" element={<Report8D />} />
            <Route path="8d-reports/:id" element={<Report8D />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="knowledge/:id" element={<KnowledgeBase />} />
            <Route path="ai-assistant" element={<AiAssistant />} />
            <Route path="analytics" element={<DataAnalytics />} />
            <Route path="bom-management" element={<BomList />} />
            <Route path="bom-management/:id/extract" element={<BomWorkbench />} />
            <Route path="schema" element={<SchemaDesign />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="admin" element={<Admin />} />
            <Route path="audit" element={<Audit />} />
            
            {/* Quality Docs Module Routes */}
            <Route path="quality-docs" element={<DocsList />} />
            <Route path="quality-docs/new" element={<DocForm />} />
            <Route path="quality-docs/:id" element={<DocDetails />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}
