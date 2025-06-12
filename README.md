## Table of Contents
- [About](#about)
- [How to Run Locally](#how-to-run-locally)
- [License](#license)

## About
[![Deploy Hugo site to R2](https://github.com/diegoripley/www.diegoripley.ca/actions/workflows/deploy_website.yaml/badge.svg)](https://github.com/diegoripley/www.diegoripley.ca/actions/workflows/deploy_website.yaml)
[![Deploy Worker](https://github.com/diegoripley/www.diegoripley.ca/actions/workflows/deploy_worker.yaml/badge.svg)](https://github.com/diegoripley/www.diegoripley.ca/actions/workflows/deploy_worker.yaml)

This repo has the code for my personal website, [www.diegoripley.ca](https://www.diegoripley.ca). The website is generated as a static website with Hugo and is served via a Cloudflare worker that reads a Cloudflare R2 bucket.

## How to Run Locally

```shell
# Clone the repository
git clone git@github.com:diegoripley/www.diegoripley.ca.git

# Navigate to the project directory
cd www.diegoripley.ca

# In Dev Container
hugo server --logLevel debug --disableFastRender -p 1313
```

## License

My website and code are distributed under an MIT license.

[Back to top](#top)