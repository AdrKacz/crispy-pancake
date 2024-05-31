import { SSTConfig } from "sst";
import { Stack } from "./stacks/Stack";

export default {
  config(_input) {
    return {
      name: "crispy-pancake",
      region: "eu-west-3",
    };
  },
  stacks(app) {
    app.stack(Stack);
  }
} satisfies SSTConfig;
