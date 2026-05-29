import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationContainer } from './components/notifications/NotificationContainer';
import { ContextMenuProvider } from './contexts/ContextMenuContext';

function App() {
  return (
    <NotificationProvider>
      <ContextMenuProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/draft/:name" element={<Editor />} />
          </Routes>
        </BrowserRouter>
        <NotificationContainer />
      </ContextMenuProvider>
    </NotificationProvider>
  );
}

export default App;
