export const inlineCSS = `:root {
  --ink: #0b0d0e;
  --graphite: #1a1c1e;
  --olive: #3a3f36;
  --accent: #43d5ff;
  --accent-hover: #5de0ff;
  --accent-light: rgba(67, 213, 255, 0.1);
  --surface: rgba(26, 28, 30, 0.8);
  --surface-elevated: rgba(30, 32, 34, 0.95);
  --border: rgba(67, 213, 255, 0.15);
  --border-strong: rgba(67, 213, 255, 0.3);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  --font-display: "Space Grotesk", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  color-scheme: dark;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-display);
  background: #0b0d0e;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(67, 213, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(67, 213, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(58, 63, 54, 0.03) 0%, transparent 100%);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--accent);
  text-decoration: none;
  transition: all 0.2s ease;
}

a:hover {
  color: var(--accent-hover);
}

.page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation */
.nav {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  width: 100%;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--accent);
  text-transform: lowercase;
  transition: color 0.2s ease;
}

.logo:hover {
  color: var(--accent-hover);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  border-color: var(--border-strong);
  background: var(--surface-elevated);
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  position: relative;
  z-index: 1;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 2rem 0 2rem;
  margin-bottom: 2rem;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  background: var(--accent-light);
  border: 1px solid var(--border);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  font-weight: 400;
}

/* Form Wrapper */
.form-wrapper {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 0;
}

/* Form Simple */
.form-simple {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.form-simple:hover {
  border-color: var(--border-strong);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group-half {
  flex: 1;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .input-row {
    grid-template-columns: 1fr;
  }
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.label-text {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-required {
  color: var(--accent);
}

.label-optional {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.input-field {
  width: 100%;
  padding: 0.875rem 1.125rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(11, 13, 14, 0.6);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: var(--font-display);
  transition: all 0.2s ease;
  outline: none;
}

.input-field-mono {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

.input-field:focus {
  border-color: var(--accent);
  background: rgba(11, 13, 14, 0.8);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.input-field:hover:not(:focus) {
  border-color: var(--border-strong);
}

.input-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

.form-simple .input-group {
  margin-bottom: 1.5rem;
}

.form-simple .input-group:last-of-type {
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
  padding: 1rem 2rem;
  margin-top: 1.5rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--accent) 0%, #2aa7d2 100%);
  color: var(--ink);
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-display);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(67, 213, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(67, 213, 255, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled,
.submit-btn.submitting {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.25rem;
  width: 1.25rem;
  height: 1.25rem;
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.form-status {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
  min-height: 1.5rem;
}

.form-status-error {
  color: #ff6b6b;
}

/* Result Simple */
.result-simple {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  min-height: 200px;
}

.result-simple:hover {
  border-color: var(--border-strong);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.result-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: var(--text-tertiary);
  min-height: 150px;
}

.placeholder-icon {
  font-size: 3rem;
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  opacity: 0.4;
  color: var(--text-tertiary);
}

.placeholder-text {
  font-size: 0.9375rem;
  color: var(--text-tertiary);
}

.result-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.result-icon {
  font-size: 2rem;
  width: 2rem;
  height: 2rem;
  color: var(--accent);
}

.result-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.result-url-container {
  background: rgba(11, 13, 14, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}

.result-url-link {
  display: block;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent);
  word-break: break-all;
  font-family: var(--font-mono);
  transition: color 0.2s ease;
}

.result-url-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.result-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-display);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  border: 1px solid var(--border);
}

.action-btn-primary {
  background: var(--accent);
  color: var(--ink);
  border-color: var(--accent);
}

.action-btn-primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 213, 255, 0.3);
}

.action-btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border);
}

.action-btn-secondary:hover {
  background: var(--surface);
  border-color: var(--border-strong);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.action-icon {
  font-size: 1.125rem;
  width: 1.125rem;
  height: 1.125rem;
}

.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.info-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: right;
  word-break: break-word;
}

.info-value-code {
  font-family: var(--font-mono);
  color: var(--accent);
  background: rgba(67, 213, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.info-value-target {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .nav {
    padding: 1rem 1.5rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .hero-section {
    padding: 1.5rem 0 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .form-simple,
  .result-simple {
    padding: 1.5rem;
  }
  
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
`;
