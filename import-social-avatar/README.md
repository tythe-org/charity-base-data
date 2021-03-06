# CharityBase Data

## Importing Profile Images from Social Media

This fetches the logos (in three different sizes) of about 40,000 charities, uploads them to S3 and saves the file locations to the database.

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

Before running this script the database must be initiated and social media handles imported (see the [other directories](../) in this repository for instruction).

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env`

### Importing Data

- `yarn import-social-avatars`

Estimated runtime: 3 hrs.
