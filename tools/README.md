# Uplim Tools

This directory contains auxiliary scripts and tools for the Uplim language development.

## Scripts

- `ollama_client.py`: A Python client for interacting with the Ollama API, used for AI-powered features in Uplim.

## CLI

The primary Uplim CLI is located in `src/cli.ts` (compiled to `dist/cli.js`).
It is exposed via the bin key in `package.json` as `uplim-engine`.

Usage:

```bash
npm run analyze <path>
npm run run <file.upl>
```
