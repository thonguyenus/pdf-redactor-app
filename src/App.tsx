import React from 'react'
import PdfTextRedactor from './components/PdfTextRedactor'
import styled, { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    background: #f1f5f9;
    color: #0f172a;
  }
`;

const AppShell = styled.div`
  min-height: 100vh;
`;

function App() {
  return (
    <AppShell>
      <GlobalStyle />
      <PdfTextRedactor />
    </AppShell>
  )
}

export default App
