#!/bin/bash

# Source file
SOURCE_FILE="data_storage/guidance.md"

# Get all directories in the current directory
DIRS=$(find . -maxdepth 1 -type d -not -path "*/\.*" | sort)

echo "Found directories: $DIRS"

# Copy the file to each directory
for DIR in $DIRS; do
    # Skip the current directory
    if [ "$DIR" = "." ]; then
        continue
    fi
    
    DEST="$DIR/guidance.md"
    
    # Skip if the source and destination are the same
    if [ "$(realpath "$SOURCE_FILE")" = "$(realpath "$DEST")" ]; then
        echo "Skipping $DIR as it already contains the source file"
        continue
    fi
    
    cp "$SOURCE_FILE" "$DEST" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "Successfully copied guidance.md to $DIR/"
    else
        echo "Error copying to $DIR/"
    fi
done

# Also copy to the root directory
cp "$SOURCE_FILE" "./guidance.md" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Successfully copied guidance.md to ./"
else
    echo "Error copying to ./"
fi 