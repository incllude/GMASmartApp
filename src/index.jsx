import React, {useRef} from "react";
import "./index.css";
import { App } from "./App";
import { createRoot } from 'react-dom/client';
import {useSpatnavInitialization} from "@salutejs/spatial";

const container = document.getElementById('root');
const root = createRoot(container);

// const Main = () => {
//
//     useSpatnavInitialization();
//     const [section] = () => useSection('section');
//     const ref = useRef<HTMLElement | null>(null);
//
//     return <App />;
// }

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

