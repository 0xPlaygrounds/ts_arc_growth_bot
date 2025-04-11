# ARC Growth Tracking Tools

This monorepo contains tools for tracking and visualizing ARC community growth metrics, including social media followers, token holders, and GitHub repository statistics.

## Structure

The repository is structured as an npm workspace with the following packages:

- `packages/data-extract`: Tools for collecting metrics data from various sources
- `apps/web_evidence`: Web dashboard for visualizing the collected metrics

## Setup

1. Install dependencies:

```bash
npm install
```

This will install dependencies for all packages in the workspace.

## Building

Build all packages:

```bash
npm run build
```

Or build specific packages:

```bash
npm run build:data-extract  # Build only the data-extract package
npm run build:web-evidence  # Build only the web-evidence package
```

## Running

### Data Collection

Run the data collection tool:

```bash
npm run collect:data
```

This will collect metrics from various sources and store them in both JSON and Parquet formats.

### Web Dashboard

Start the web dashboard development server:

```bash
npm run start:evidence
```

## Development

For active development, you can use:

```bash
npm run dev:data-extract  # Run data-extract in development mode
```

## Containerization

The data collection tool can be run as a Docker container:

```bash
cd packages/data-extract
docker build -t arc-data-extract .
docker run -v /path/to/data:/app/public/data arc-data-extract
```

## GitHub Actions

The repository includes GitHub Actions workflows to run the data collection automatically every 12 hours. 