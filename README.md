# crispy-pancake
Serverless trading bots specialized in cryptocurrency

# One-time setup
> Don't reproduce these steps, there are here for references but only need to be done once.

## Download required files
```sh
mkdir ft_userdata
cd ft_userdata/
# Download the docker-compose file from the repository
curl https://raw.githubusercontent.com/freqtrade/freqtrade/stable/docker-compose.yml -o docker-compose.yml

# Pull the freqtrade image
docker compose pull

# Create user directory structure
docker compose run --rm freqtrade create-userdir --userdir user_data

# Create configuration - Requires answering interactive questions
docker compose run --rm freqtrade new-config --config user_data/config.json
```

> You won't see `logs` or `docker-compose.yml`, we copied the required information to a `Dockerfile` and handle the deployment to **AWS ECS** *(`docker-compose.yml` was responsible of the deployment but it only works with Docker related workflow, they use to have integration with AWS and Azure but it deprecated on November 2023)*.

# Local deployment
Simply run `npm run dev`.

Before you run this command, make sure you added a **CripyPancake** profile in you **AWS configuration**.

The first time you run it in you own AWS account, this will bootstrap resources for 5 to 10 minutes.

```sh
sst dev
cd packages/ft_userdata
sst bind "env | grep -E 'SST_|AWS_' > .env.tmp && docker run --env-file .env.tmp my-image"
```

# Deploy to AWS
Simply run `npm run deploy`. **You should never do it unless you have very strong reason to. The deployment to production is handled automatically by Github when you merge in `main` branch.**

The first deployment will create a **CloudFront Distribution**, it will takes up to 15 minutes.

## Others

We tried to use Docker Compose for ECS but it deprecated on November 2023

We tried to use [**ecs_composex**](https://github.com/compose-x/ecs_composex) but its configuration file is tricky and it doesn't integrate well between **local** and **production** environment.

We tried to use **SST Ion** but I didn't like the new ways it handles **clusters** and **authentication**, so we sticked to **SST v2**. Plus, the **Ion** version is still in development.

# Architecture
Configuration minimum on Linux:
- 2GB RAM
- 1GB disk space
- 2vCPU

## EC2
For example, [**t4g.small**](https://aws.amazon.com/ec2/pricing/on-demand/) ($0.0168/h) will satisfiy configuration and can be reserved with **Spot Instances** for 55% savings ($0.00756/h or $5.4432 for 30 days) and less than 5% of interruptions ([see advisor](https://aws.amazon.com/ec2/spot/instance-advisor/))

[**EBS**](https://aws.amazon.com/ebs/pricing/) costs $0.08/GB-month, so $0.16 per month for the required configuration. However, **EBS** has limitations such as being tied to a single availability zone and a single EC2 instance at a time. 

The total cost will be **$5.6032 per month** for the required configuration.


## Fargate
We won't use this host as this would require to manage the hosts ourselves via **EC2**. Instead we will leverage. **AWS Fargate** which [automatically scales up and down instances](https://aws.amazon.com/fr/blogs/compute/aws-fargate-price-reduction-up-to-50/), if it costs too much will update later (see [EC2 vs. AWS Fargate guide](https://aws.amazon.com/fr/blogs/france/approche-theorique-de-loptimisation-des-couts-des-types-de-lancements-damazon-ecs-aws-fargate-vs-amazon-ec2/)).


**SST v2** release which support [**containers**](https://ion.sst.dev/docs/start/aws/container/)

We can directly deploy to [**AWS** using **Docker Compose**](https://aws.amazon.com/blogs/containers/deploy-applications-on-amazon-ecs-using-docker-compose/), however we won't benefits from **SST Ion** and it would be harder to integrate with the new tools we want to build to improve performances.

Instead, we translated the Docker Compose into **AWS CDK** and its equivalent for **SST Ion**. We can now easily link resources together and leverage the compute power of **AWS** alongside our base container.

**Freqtrade** uses a **file system** so we cannot directly link it to **S3** without internal updates. We can use **EFS** instead, it is slightly more expensive. The advantages of **EFS** is that we won't lose storage when the container stops, for now we will just rely on local storage.

# [SST Ion](https://ion.sst.dev/docs/reference/cli/)
```sh
brew install sst/tap/sst
brew upgrade sst
```

```sh
npm init -y
sst init
```

# [Freqtrade](https://www.freqtrade.io/en/stable/)
Under the hood, it uses [cctx](https://github.com/ccxt/ccxt/wiki/Manual#market-data) to download market data.

```yml
---
version: '3'
services:
  freqtrade:
    image: freqtradeorg/freqtrade:stable
    # image: freqtradeorg/freqtrade:develop
    # Use plotting image
    # image: freqtradeorg/freqtrade:develop_plot
    # # Enable GPU Image and GPU Resources (only relevant for freqAI)
    # # Make sure to uncomment the whole deploy section
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]
    # Build step - only needed when additional dependencies are needed
    # build:
    #   context: .
    #   dockerfile: "./docker/Dockerfile.custom"
    restart: unless-stopped
    container_name: freqtrade
    volumes:
      - "./user_data:/freqtrade/user_data"
    # Expose api on port 8080 (localhost only)
    # Please read the https://www.freqtrade.io/en/stable/rest-api/ documentation
    # for more information.
    ports:
      - "127.0.0.1:8080:8080"
    # Default command used when running `docker compose up`
    command: >
      trade
      --logfile /freqtrade/user_data/logs/freqtrade.log
      --db-url sqlite:////freqtrade/user_data/tradesv3.sqlite
      --config /freqtrade/user_data/config.json
      --strategy SampleStrategy
```

## Contributions to Freqtrade
- [ ] [Documentation](https://www.freqtrade.io/en/stable/configuration/#dynamic-stake-amount-with-position-adjustment): to ~~a~~ return a value

# Pricing
## [AWS Fargate](https://aws.amazon.com/fargate/pricing/)
Regular instances:
- $0.04048 per vCPU per hour, or **$29.1456** per GB per 30 day
- $0.004445 per GB per hour, or **$3.2004** per GB per 30 day
  
Spot instances:
- $0.012144 per vCPU per hour, or **$8.74368** per vCPU per 30 day
- $0.0013335 per GB per hour, or **$0.96012** per GB per 30 day

Storage:
- $0.000111 per GB per hour, or **$0.07992** per GB per 30 day

We will use **Spot instances** to reduce costs.

## [AWS EFS](https://aws.amazon.com/fr/efs/pricing/)
- **$0,30** per GB per month

