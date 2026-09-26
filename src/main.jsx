import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";

// All routing (/, /about, /contact, /admin) lives inside App.jsx now, so this
// file never needs to change when you add pages or sections — the only file
// you should need to touch (or re-upload) for content/section changes is
// App.jsx. HashRouter needs no server configuration, which is why URLs look
// like "/#/about" — see README.md if you'd rather set up clean URLs.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
