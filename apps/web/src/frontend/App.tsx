import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider, PantryProvider } from '@freshkeep/shared';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <PantryProvider>
        <Toaster position="top-center" richColors />
        <RouterProvider router={router} />
      </PantryProvider>
    </AuthProvider>
  );
}
