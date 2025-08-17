import {StrictMode} from "react";
import { createRoot } from "react-dom/client";
import AppRouter from './router/index.jsx';
import './index.scss';
const root = createRoot(document.getElementById("root"))
root.render(<StrictMode><AppRouter/></StrictMode>)