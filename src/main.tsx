import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { CssBaseline } from "@mui/material";
import { store } from "./store/index.ts";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <CssBaseline>
        <App />
      </CssBaseline>
    </Provider>
  </StrictMode>
);
