# Family Tree API

A family tree management system built with Node.js, Express, and Ladybug graph database. This API allows you to create and manage family relationships including persons, unions (marriages/partnerships), and parent-child relationships.

## Features

- **Person Management**: Create and manage family members with detailed information (names, dates, contact info, etc.)
- **Union Relationships**: Track marriages, partnerships, and other unions between people
- **Parent-Child Relationships**: Establish family connections with support for different parent types (biological, adoptive, step, foster)
- **Graph Database**: Uses Ladybug graph database for efficient relationship queries and traversals

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Ladybug (lbug) - Graph Database
- **Language**: TypeScript
- **Package Manager**: npm

## Prerequisites

- Node.js (v20 or higher)
- npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd family-tree
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root (optional, defaults are provided):
```env
NODE_ENV=development
PORT=3001
DB_PATH=data/janis_family_tree.lbug
```

4. Build the project:
```bash
npm run build
```

## Configuration

The application uses environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `DB_PATH` | Database file path | `data/janis_family_tree.lbug` |

The database path is automatically resolved and the parent directory will be created if it doesn't exist. The `.lbug` extension will be added automatically if not provided.

## Usage

### Development

Run the development server with auto-reload:
```bash
npm run dev
```

### Production

Build and run the production server:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Documentation

All endpoints are prefixed with `/v1`.

### Person Endpoints

#### Create Person
```http
POST /v1/person
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "maiden_name": null,
  "birth_date": "1990-01-15",
  "death_date": null,
  "birth_place": "New York, USA",
  "death_place": null,
  "gender": "male",
  "occupation": "Engineer",
  "notes": "Some notes",
  "photo_url": "https://example.com/photo.jpg",
  "email": "john@example.com",
  "phone": "+1234567890",
  "current_address": "123 Main St",
  "data": "{\"custom\": \"json\"}"
}
```

**Note:** All fields except `id` (auto-generated) are optional.

**Response:** `201 Created`
```json
{
  "id": "uuid-generated-id",
  "first_name": "John",
  "last_name": "Doe",
  ...
}
```

### Union Endpoints

#### Create Union
```http
POST /v1/union
Content-Type: application/json
```

**Request Body:**
```json
{
  "person1_id": "uuid-1",
  "person2_id": "uuid-2",
  "unionId": "union-123",
  "type": "marriage",
  "startDate": "2010-06-15",
  "endDate": null,
  "place": "City Hall, New York",
  "status": "ongoing",
  "notes": "Wedding notes"
}
```

**Fields:**
- `person1_id` (required): ID of the first person
- `person2_id` (required): ID of the second person
- `unionId` (optional): Unique identifier for the union
- `type` (optional): Type of union (e.g., "marriage", "partnership")
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format
- `place` (optional): Location of the union
- `status` (optional): Status (e.g., "divorced", "annulled", "ongoing", "unknown")
- `notes` (optional): Additional notes

**Response:** `201 Created`

### Parent-Child Relationship Endpoints

#### Create Parent-Child Relationship
```http
POST /v1/parent_of
Content-Type: application/json
```

**Request Body:**
```json
{
  "parent_id": "uuid-parent",
  "child_id": "uuid-child",
  "parent_type": "biological"
}
```

**Fields:**
- `parent_id` (required): ID of the parent
- `child_id` (required): ID of the child
- `parent_type` (optional): Type of parent relationship (e.g., "biological", "adoptive", "step", "foster")

**Response:** `201 Created`

### Node Endpoints

#### List All Persons
```http
GET /v1/node
```

**Response:** `200 OK`
```json
{
  "persons": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      ...
    }
  ]
}
```

## Database Schema

### Person Node
- `id` (STRING, PRIMARY KEY)
- `first_name` (STRING)
- `last_name` (STRING)
- `maiden_name` (STRING)
- `birth_date` (DATE)
- `death_date` (DATE)
- `birth_place` (STRING)
- `death_place` (STRING)
- `gender` (STRING)
- `occupation` (STRING)
- `notes` (STRING)
- `photo_url` (STRING)
- `email` (STRING)
- `phone` (STRING)
- `current_address` (STRING)
- `data` (STRING) - Stringified JSON for custom data

### PARENT_OF Relationship
- `FROM Person TO Person`
- `parent_type` (STRING) - Type of parent relationship

### UNION Relationship
- `FROM Person TO Person`
- `unionId` (STRING)
- `type` (STRING)
- `startDate` (DATE)
- `endDate` (DATE)
- `place` (STRING)
- `status` (STRING)
- `notes` (STRING)

## Project Structure

```
family-tree/
├── src/
│   ├── config/          # Configuration (environment variables)
│   ├── controllers/     # Request handlers
│   ├── db/              # Database connection, schema, and pool
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   └── main.ts          # Application entry point
├── data/                # Database files (created automatically)
├── dist/                # Compiled JavaScript (generated)
└── package.json
```

## Development

### Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### TypeScript

The project uses TypeScript for type safety. The configuration is in `tsconfig.json`.

## License

ISC

