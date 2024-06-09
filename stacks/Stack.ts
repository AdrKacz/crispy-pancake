import { StackContext, Service } from "sst/constructs";

export function Stack({ stack }: StackContext) {
  const freqtradeService = new Service(stack, "FreqtradeService", {
    dev: { deploy: true },
    path: "./packages/ft_userdata",
    port: 8080,
    // See supported configuration: https://aws.amazon.com/fargate/pricing/
    cpu: "2 vCPU",
    memory: "4 GB",
  });

  stack.addOutputs({
    FreqtradeEndpoint: freqtradeService.customDomainUrl ?? freqtradeService.url ?? "Unknown",
  });
}
