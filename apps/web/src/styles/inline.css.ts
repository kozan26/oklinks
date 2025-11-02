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
    radial-gradient(circle at 80% 70%, rgba(67, 213, 255, 0.05) 0%, transparent 50%);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
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
  overflow-x: hidden;
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

/* Main Container */
.main-container {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
  overflow-x: hidden;
}

/* Hero Container */
.hero-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
  min-height: calc(100vh - 200px);
  max-height: calc(100vh - 120px);
}

/* Hero Left */
.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 2rem;
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
  width: fit-content;
}

.hero-title {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  color: var(--text-secondary);
  font-weight: 400;
  line-height: 1.5;
}

/* Hero Right */
.hero-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  overflow-x: hidden;
}

.hero-right::-webkit-scrollbar {
  width: 6px;
}

.hero-right::-webkit-scrollbar-track {
  background: transparent;
}

.hero-right::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.hero-right::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

/* Link Form */
.link-form {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.link-form:hover {
  border-color: var(--border-strong);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-field:last-of-type {
  margin-bottom: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.required {
  color: var(--accent);
}

.optional {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.field-input {
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

.field-input-mono {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
}

.field-input::placeholder {
  color: var(--text-tertiary);
}

.field-input:focus {
  border-color: var(--accent);
  background: rgba(11, 13, 14, 0.8);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.field-input:hover:not(:focus) {
  border-color: var(--border-strong);
}

.submit-button {
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

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(67, 213, 255, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled,
.submit-button.submitting {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-icon,
.button-spinner {
  font-size: 1.25rem;
  width: 1.25rem;
  height: 1.25rem;
}

.button-spinner {
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

/* Result Box */
.result-box {
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

.result-box:hover {
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

.result-content {
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

.result-url-wrapper {
  background: rgba(11, 13, 14, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}

.result-url {
  display: block;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent);
  word-break: break-all;
  font-family: var(--font-mono);
  transition: color 0.2s ease;
}

.result-url:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.result-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.result-btn {
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

.result-btn-primary {
  background: var(--accent);
  color: var(--ink);
  border-color: var(--accent);
}

.result-btn-primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 213, 255, 0.3);
}

.result-btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border);
}

.result-btn-secondary:hover {
  background: var(--surface);
  border-color: var(--border-strong);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.result-btn .material-icons {
  font-size: 1.125rem;
  width: 1.125rem;
  height: 1.125rem;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: right;
  word-break: break-word;
}

.detail-code {
  font-family: var(--font-mono);
  color: var(--accent);
  background: rgba(67, 213, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.detail-target {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Material Icons */
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

/* Responsive */
@media (max-width: 1024px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    min-height: auto;
    max-height: none;
  }
  
  .hero-left {
    padding-right: 0;
    text-align: center;
    align-items: center;
  }
  
  .hero-badge {
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-right {
    max-height: none;
    overflow-y: visible;
  }
}

@media (max-width: 640px) {
  .nav {
    padding: 1rem 1.5rem;
  }
  
  .main-container {
    padding: 1rem;
  }
  
  .hero-container {
    gap: 1.5rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .link-form,
  .result-box {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .result-buttons {
    flex-direction: column;
  }
  
  .result-btn {
    width: 100%;
  }
}
`;
