#!/bin/bash

# Install missing dependencies
echo "Installing missing dependencies..."
npm install --save-dev @types/node @types/winston @types/socket.io @types/socket.io-client

# Fix ESLint issues
echo "Fixing ESLint issues..."
npx eslint --fix "src/**/*.{ts,tsx}"

# Format code with Prettier
echo "Formatting code with Prettier..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"

echo "Done! Most linting issues should be fixed now." 