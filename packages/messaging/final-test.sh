#!/bin/bash
cd /home/arligle/aiofix-ai/hl8-saas-nx-mono/packages/messaging
npx tsc --noEmit --project tsconfig.json
echo "TypeScript compilation completed with exit code: $?"
