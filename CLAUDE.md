# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run dev` - Start Vite development server
- `npm run build` - Build the project (TypeScript compilation + Vite build)
- `npm run preview` - Preview the built project
- `npm run appdev` - Start Tauri development mode (launches desktop app)
- `npm run tauri` - Run Tauri CLI commands

## Architecture Overview

This is a Tauri desktop application built with React + TypeScript + Vite:

### Frontend (React/Vite)
- `src/App.tsx` - Main React application component
- `src/components/ui/` - shadcn/ui components (button.tsx)
- `src/lib/utils.ts` - Utility functions with clsx/tailwind-merge
- Uses Tailwind CSS v4 with @tailwindcss/vite plugin
- Path alias `@` points to `./src`

### Backend (Rust/Tauri)
- `src-tauri/src/lib.rs` - Main Tauri application logic and command handlers
- `src-tauri/src/main.rs` - Entry point that calls lib::run()
- `src-tauri/Cargo.toml` - Rust dependencies including tauri-plugin-opener
- Library name: `selltkeyscraper_lib`

### Communication Pattern
- React frontend communicates with Rust backend via Tauri's `invoke()` API
- Example: `invoke("greet", { name })` calls the `#[tauri::command] greet()` function
- Commands are registered in `lib.rs` with `invoke_handler(tauri::generate_handler![greet])`

### Development Setup
- Vite dev server runs on port 1420 (fixed for Tauri)
- HMR on port 1421
- Tauri watches for changes and rebuilds Rust code automatically