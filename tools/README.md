# Uplim Tools

This directory contains auxiliary scripts and tools for the Uplim language development.

## Scripts

- `ollama_client.py`: A Python client for interacting with the Ollama API, used for AI-powered features in Uplim.

## CLI

The primary Uplim CLI is located in `packages/cli/src/cli.ts` (compiled to `packages/cli/dist/cli.js`).
It is exposed via the bin key in `packages/cli/package.json` as `uplim`.

Usage:

```bash
npm run analyze <path>
npx tsx packages/cli/src/cli.ts run <file.upl>
```
