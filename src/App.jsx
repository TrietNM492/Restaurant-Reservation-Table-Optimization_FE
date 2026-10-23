import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './styles/app.css';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Suspense fallback={<h3>Loading...</h3>}>
        <RouterProvider router={router} />
      </Suspense>
    </LanguageProvider>
  );
}

export default App;
