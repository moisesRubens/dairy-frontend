import Router from "./routes/router";
import { ReservaProvider } from './contexts/ReservaContext';

export default function App() {
  return (
    <ReservaProvider>
      <Router />
    </ReservaProvider>
  );
}