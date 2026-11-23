import config from "../frontend/eslint.config.mjs";
const advisorConfig = [
  ...config,
  {
    settings: { react: { version: "19.3" }, next: { rootDir: "../frontend/" } },
  },
];
export default advisorConfig;
