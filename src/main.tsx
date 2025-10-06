import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/theme.css';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);

