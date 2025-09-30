#!/bin/bash
cd /home/arligle/aiofix-ai/hl8-saas-nx-mono
pnpm exec nx build messaging
echo "Build completed with exit code: $?"
