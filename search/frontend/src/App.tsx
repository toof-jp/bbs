import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Search from "./pages/Search";
import Oekaki from "./pages/Oekaki";

export default function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/" element={<Search />} />
        <Route path="/oekaki" element={<Oekaki />} />
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
}
