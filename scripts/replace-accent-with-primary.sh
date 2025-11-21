#!/bin/bash

# Script to replace all accent color usages with primary blue color

echo "Replacing accent colors with primary blue across the project..."

# Find all TypeScript/TSX files and replace accent colors
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/hover:bg-accent/hover:bg-primary\/10/g' {} \;
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/focus:bg-accent/focus:bg-primary\/10/g' {} \;
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-accent\/50/bg-primary\/10/g' {} \;
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-accent/bg-primary\/10/g' {} \;
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-accent-foreground/text-primary/g' {} \;
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/hover:text-accent/hover:text-primary/g' {} \;
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/border-accent/border-primary/g' {} \;

echo "Done! All accent colors have been replaced with primary blue."
