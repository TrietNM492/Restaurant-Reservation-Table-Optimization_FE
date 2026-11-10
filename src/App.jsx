import {
  Suspense,
} from "react";

import {
  RouterProvider,
} from "react-router-dom";
import { router } from "./routes";
import './styles/app.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: (count, error) => count < 1 && (!error.response || error.response.status >= 500) } },
});

function App() {


  return (
    <QueryClientProvider client={queryClient}>
    <Suspense fallback={<h3>Loading...</h3>}>
      <RouterProvider
        router={router}
      />
    </Suspense>
    </QueryClientProvider>
  );
}

export default App
