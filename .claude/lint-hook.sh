#!/bin/bash

# This script is called by Claude Code hooks after file modifications
# It runs ESLint on the modified file to catch issues early

# Ensure we're in the project directory
cd "$CLAUDE_PROJECT_DIR" || exit 1

# Extract file path from CLAUDE_TOOL_INPUT if available
if [ -n "$CLAUDE_TOOL_INPUT" ]; then
    FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .path // empty' 2>/dev/null)
    
    # Check if we got a valid file path
    if [ -n "$FILE_PATH" ]; then
        # Check if the file is a JavaScript/TypeScript file
        if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
            echo "🔍 Claude Code Hook: Running ESLint on modified file"
            echo "📄 File: $FILE_PATH"
            
            # Run ESLint using make command
            if make lint-file FILE="$FILE_PATH"; then
                echo "✅ ESLint check passed for: $FILE_PATH"
            else
                EXIT_CODE=$?
                echo "❌ ESLint found issues in: $FILE_PATH"
                echo "💡 Please fix the issues to avoid commit failures"
                # Exit with code 2 to indicate the tool should be blocked
                exit 2
            fi
        else
            echo "ℹ️  Skipping lint for non-JS/TS file: $FILE_PATH"
        fi
    fi
else
    echo "⚠️  No file path found in tool input"
fi

exit 0