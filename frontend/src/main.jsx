import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { store } from './store/store'
import ErrorFallback from './components/common/ErrorFallback.jsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
    ignoreErrors: ['ResizeObserver loop limit exceeded'],
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Sentry.ErrorBoundary fallback={ErrorFallback}>
          <App />
        </Sentry.ErrorBoundary>
        <SpeedInsights />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
