const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: isProd
      ? // See components/DevToolsStub.tsx — keeps agentation a devDependency
        // without letting a production build depend on it being installed.
        { agentation: "./components/DevToolsStub.tsx" }
      : {},
  },
  webpack: (config) => {
    if (isProd) {
      config.resolve.alias = {
        ...config.resolve.alias,
        agentation: new URL("./components/DevToolsStub.tsx", import.meta.url)
          .pathname,
      };
    }
    return config;
  },
};

export default nextConfig;
