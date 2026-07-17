import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Mcp from "./pages/Mcp";
import Oekaki from "./pages/Oekaki";
import Ranking from "./pages/Ranking";
import Search from "./pages/Search";
import Viewer from "./pages/Viewer";

export default function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/" element={<Search />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/oekaki" element={<Oekaki />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/mcp" element={<Mcp />} />
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
}
