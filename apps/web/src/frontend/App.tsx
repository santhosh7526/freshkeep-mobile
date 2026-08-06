import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider, PantryProvider } from '@freshkeep/shared';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <PantryProvider>
          <DndProvider backend={HTML5Backend}>
            <Toaster position="top-center" richColors />
            <RouterProvider router={router} />
          </DndProvider>
        </PantryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
