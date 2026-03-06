#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/terraform/lambda-builds"

mkdir -p "$BUILD_DIR"

# Function to build a Lambda
build_lambda() {
  local lambda_name=$1
  local lambda_dir="$PROJECT_ROOT/src/lambdas/$lambda_name"
  
  echo "Building $lambda_name..."
  
  # Create temp directory for build
  local temp_dir="$BUILD_DIR/.build-temp-$lambda_name"
  rm -rf "$temp_dir"
  mkdir -p "$temp_dir"
  
  # Bundle with esbuild - mark AWS SDK as external
  npx esbuild \
    "$lambda_dir/index.ts" \
    --bundle \
    --platform=node \
    --target=node18 \
    --outfile="$temp_dir/index.js" \
    --minify \
    --sourcemap \
    --external:@aws-sdk/client-dynamodb \
    --external:@aws-sdk/client-sqs \
    --external:@aws-sdk/client-lambda \
    --external:@aws-sdk/lib-dynamodb
  
  # Install dependencies in temp directory
  cd "$temp_dir"
  cp "$lambda_dir/package.json" .
  npm install --production --no-save --no-package-lock 2>/dev/null || true
  
  # Create zip file
  zip -r "$BUILD_DIR/$lambda_name.zip" . -q -x "node_modules/.bin/*" "*.d.ts" ".npmrc" ".gitignore" "README.md"
  
  # Cleanup
  cd "$PROJECT_ROOT"
  rm -rf "$temp_dir"
  
  echo "✓ $lambda_name -> $(du -h $BUILD_DIR/$lambda_name.zip | cut -f1)"
}

# Build all Lambdas
echo "Building Lambda functions..."
build_lambda "create-order"
build_lambda "process-payment"
build_lambda "process-shipping"
build_lambda "complete-order"

echo ""
echo "✓ All Lambda functions built successfully!"
ls -lh "$BUILD_DIR"/*.zip
