# CharityBase Data

## Initialising the Database

This script creates the CharityBase relational database with empty tables.

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

### Creating database

- `yarn create-db`

Estimated runtime: 1 second

### Creating tables

- `yarn knex migrate:latest`

Estimated runtime: 3 seconds

### Dropping database

- `yarn drop-db`