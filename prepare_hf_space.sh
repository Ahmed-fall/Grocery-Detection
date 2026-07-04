#!/bin/bash

# Simple script to prepare a local folder for pushing backend to Hugging Face Spaces.
set -e

TEMP_DIR="hf_deploy_temp"

echo "=== Preparing Hugging Face Space Deploy Folder ==="
if [ -d "$TEMP_DIR" ]; then
    echo " Cleaning up existing temporary folder..."
    rm -rf "$TEMP_DIR"
fi

echo " Creating folder: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo " Copying backend files..."
cp -r backend/* "$TEMP_DIR/"

cd "$TEMP_DIR"

# Generate a .gitignore to keep the repository clean
cat <<EOF > .gitignore
node_modules/
__pycache__/
.env
.env.*
*.pyc
*.pyo
.DS_Store
EOF

echo " Initializing local git repository..."
git init --initial-branch=main

echo " Adding files to git..."
git add .
git commit -m "Deploy backend FastAPI service to Hugging Face Spaces"

echo ""
echo "=========================================================="
echo " Preparation Complete!"
echo "=========================================================="
echo "To push this to your Hugging Face Space, run the following:"
echo ""
echo "  cd $TEMP_DIR"
echo "  git remote add origin https://huggingface.co/spaces/<your-username>/<your-space-name>"
echo "  git push -u origin main --force"
echo ""
echo "=========================================================="
echo "Note: Create your Space on Hugging Face first as a Docker Space."
echo "=========================================================="
