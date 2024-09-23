import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Main } from "./pages/Main";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/main" element={<Main />} />
          <Route />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
