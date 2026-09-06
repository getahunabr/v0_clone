import { Template } from "e2b";

export const template = Template()
  .fromImage("node:21-slim")
  .setUser("root")
  .setWorkdir("/")
  .runCmd(
    "apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*",
  )
  .copy("compile_page.sh", "/compile_page.sh")
  .runCmd("chmod +x /compile_page.sh")
  .setWorkdir("/home/user/nextjs-app")
  .runCmd("npx --yes create-next-app@16.3.0 . --yes")

  .runCmd(
    `cat > next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
EOF`,
  )
  .runCmd("npx --yes shadcn@2.6.3 init --yes -b neutral --force")
  .runCmd("npm install tw-animate-css")
  .runCmd(
    'NODE_OPTIONS="--max-old-space-size=2048" npx --yes shadcn@2.6.3 add button card input label select textarea checkbox switch tabs form --yes',
  )
  .runCmd(
    'NODE_OPTIONS="--max-old-space-size=2048" npx --yes shadcn@2.6.3 add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb calendar carousel --yes',
  )
  .runCmd(
    'NODE_OPTIONS="--max-old-space-size=2048" npx --yes shadcn@2.6.3 add chart collapsible command context-menu dialog drawer dropdown-menu hover-card --yes',
  )
  .runCmd(
    'NODE_OPTIONS="--max-old-space-size=2048" npx --yes shadcn@2.6.3 add input-otp menubar navigation-menu pagination popover progress radio-group resizable --yes',
  )
  .runCmd(
    'NODE_OPTIONS="--max-old-space-size=2048" npx --yes shadcn@2.6.3 add scroll-area separator sheet sidebar skeleton slider sonner --yes',
  )
  .runCmd(
    'NODE_OPTIONS="--max-old-space-size=2048" npx --yes shadcn@2.6.3 add table toggle toggle-group tooltip --yes',
  )
  .runCmd(
    "mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app",
  )
  .setWorkdir("/home/user")
  .setUser("user");
