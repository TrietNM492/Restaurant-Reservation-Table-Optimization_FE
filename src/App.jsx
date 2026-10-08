import {
  Suspense,
} from "react";

import {
  RouterProvider,
} from "react-router-dom";
import { router } from "./routes";
import './styles/app.css'

function App() {


  return (
    <Suspense fallback={<h3>Loading...</h3>}>
      <RouterProvider
        router={router}
      />
    </Suspense>
  );
}

export default App
