import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// "base" tells Vite what path the site is served from.
//   - Project site (https://USERNAME.github.io/REPO-NAME/): set base to "/REPO-NAME/"
//   - User/org site (https://USERNAME.github.io/, repo literally named USERNAME.github.io): set base to "/"
export default defineConfig({
  plugins: [react()],
  base: "/Senior-Automation-Engineer/",
});
