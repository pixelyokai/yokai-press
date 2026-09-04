import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "out/**", "brand-source/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      /* The React Compiler rules flag two patterns this app uses on purpose.
         `usePaperDrift` writes transforms straight to a ref'd node every frame,
         which is the point — routing it through state would re-render React 60
         times a second. The setState-in-effect reports are mount-time
         initialisation and measure-then-place passes, which have to read layout
         before they can set it. Kept visible as warnings rather than silenced. */
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
