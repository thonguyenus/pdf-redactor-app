# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# PDF Redactor App

React + Vite app that uploads a PDF, extracts text using pdfjs-dist in the browser, displays it with a Copy button, and redacts the value of the field named "country".

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:5173

- Upload a PDF (e.g. the sample `EDIT OoPdfFormExample.pdf` in your parent folder).
- Click "Redact Country" to hide the value of the `country` field using block characters.

## Notes
- No backend required. pdf.js parses in the browser. 
- Styling via styled-components. 
- Works on desktop and mobile; shows loading while parsing; errors for invalid files.
