# Post Microservice

## Features
* **Create Post**: saved as `status="Unpublished"`
* **Publish Post**: `status="Published"`
* **List Published**: for Home
* **Get Post Detail**: visibility enforced by status and ownership
* **Update Post**: title/content/images/attachments/isArchived
* **JWT-based auth** on **all** `/api/posts` routes

## Project Structure
```
fa-post/
├── package.json
├── README.md
└── src/
    ├── app.js
    ├── index.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   └── posts.controller.js
    ├── middleware/
    │   └── auth.js
    │   └── errors.js
    │   └── ownership.js
    │   └── verified.js
    ├── models/
    │   └── Post.js
    │   └── Reply.js
    └── routes/
        └── posts.js
```

## Environment

Set these in `.env`:

```ini
PORT=3002
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_HOST=127.0.0.1

# MUST match the Gateway JWT policy and Auth's ACCESS_SECRET
JWT_SECRET=

# RabbitMQ (producer)
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EVENTS_EXCHANGE=fa.events
RABBITMQ_EVENTS_EXCHANGE_TYPE=topic
```


## Running the App
```ini
cd fa-post
npm i
npm run dev
```


## API Endpoints

### List of Endpoints

#### Posts
| Method | Endpoint                      | Description                                   | Auth Required           | Body Parameters                                                                                           |
| ------ | ----------------------------- | --------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| GET    | /api/posts                    | List published posts (Home)                   | Yes                     | None                                                                                                      |
| GET    | /api/posts/:id               | Get post detail (visibility enforced)         | Yes                     | None                                                                                                      |
| POST   | /api/posts                    | Create a post (status="Unpublished")         | Yes (verified)          | `title` (string, required), `content` (string, required), `images?` (string[]), `attachments?` (string[]) |
| PUT    | /api/posts/:id               | Update a post (owner only)                    | Yes (verified, owner)   | `title?`, `content?`, `images?` (string[]), `attachments?` (string[]), `isArchived?` (boolean)            |
| PUT    | /api/posts/:id/publish       | Publish a post (drafts only)                  | Yes (verified, owner)   | None                                                                                                      |
| DELETE | /api/posts/:id               | Delete a post (soft -> status="Deleted")     | Yes (verified, owner)   | None                                                                                                      |
| POST   | /api/posts/:id/archive       | Archive a post                                | Yes (verified, owner)   | None                                                                                                      |
| POST   | /api/posts/:id/unarchive     | Unarchive a post                              | Yes (verified, owner)   | None                                                                                                      |
| POST   | /api/posts/:id/hide          | Hide a post (Published -> Hidden)             | Yes (verified, owner)   | None                                                                                                      |
| POST   | /api/posts/:id/unhide        | Unhide a post (Hidden -> Published)           | Yes (verified, owner)   | None                                                                                                      |
| POST   | /api/posts/:id/ban           | Ban a post                                    | Yes (verified, admin)   | None                                                                                                      |
| POST   | /api/posts/:id/unban         | Unban a post                                  | Yes (verified, admin)   | None                                                                                                      |
| POST   | /api/posts/:id/recover       | Recover a deleted post (-> Published)         | Yes (verified, admin)   | None                                                                                                      |

#### Replies (nested under /api/posts)
| Method | Endpoint                                   | Description                                  | Auth Required                                 | Body Parameters                                  |
| ------ | ------------------------------------------ | -------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| GET    | /api/posts/:postId/replies                 | List replies for a post (nested tree)        | Yes                                           | None                                             |
| POST   | /api/posts/:postId/replies                 | Create a reply                               | Yes (verified)                                | `content` (string, required), `parentReplyId?`   |
| PUT    | /api/posts/:postId/replies/:id             | Update a reply (author only)                 | Yes (verified)                                | `content?` (string)                              |
| DELETE | /api/posts/:postId/replies/:id             | Delete a reply (soft)                        | Yes (verified; author OR post owner OR admin) | None                                             |

### Responses

#### Posts (Success)
| Method | Endpoint                  | Success Status | Response Body                |
| ------ | ------------------------- | -------------- | ---------------------------- |
| POST   | /api/posts                | 201            | Post detail JSON             |
| GET    | /api/posts                | 200            | Array of home cards          |
| GET    | /api/posts/:id           | 200            | Post detail JSON             |
| PUT    | /api/posts/:id           | 200            | Post detail JSON             |
| PUT    | /api/posts/:id/publish   | 200            | Post detail JSON             |
| DELETE | /api/posts/:id           | 204            | None                         |
| POST   | /api/posts/:id/archive   | 200            | Post detail JSON             |
| POST   | /api/posts/:id/unarchive | 200            | Post detail JSON             |
| POST   | /api/posts/:id/hide      | 200            | Post detail JSON             |
| POST   | /api/posts/:id/unhide    | 200            | Post detail JSON             |
| POST   | /api/posts/:id/ban       | 200            | Post detail JSON             |
| POST   | /api/posts/:id/unban     | 200            | Post detail JSON             |
| POST   | /api/posts/:id/recover   | 200            | Post detail JSON             |

#### Replies (Success)
| Method | Endpoint                           | Success Status | Response Body                  |
| ------ | ---------------------------------- | -------------- | ------------------------------ |
| GET    | /api/posts/:postId/replies         | 200            | Array of nested Reply DTOs     |
| POST   | /api/posts/:postId/replies         | 201            | Reply DTO                      |
| PUT    | /api/posts/:postId/replies/:id     | 200            | Reply DTO                      |
| DELETE | /api/posts/:postId/replies/:id     | 204            | None                           |

### Error Codes
The API returns standard HTTP status codes to indicate the outcome of requests. Below is a summary of the main codes used:
| Code | Status                | Description / Scenario                                                                                 |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| 400  | Bad Request           | Validation/business rule failures (e.g., only drafts can be published; cannot edit banned/deleted).    |
| 401  | Unauthorized          | Missing/invalid/expired JWT.                                                                           |
| 403  | Forbidden             | Authenticated but not allowed (not owner/admin; post not visible; reply author constraint).            |
| 404  | Not Found             | Post or Reply not found (or reply not under the specified post).                                       |
| 409  | Conflict              | Reserved; not typically used by current endpoints.                                                      |
| 500  | Internal Server Error | Unexpected server error.                                                                                |

---

## RabbitMQ Integration Testing

This section provides comprehensive instructions for testing the complete RabbitMQ producer-consumer flow between `fa-post` (producer) and `fa-history` (consumer) services.

### Architecture Overview

```
fa-post (Producer) → RabbitMQ → fa-history (Consumer) → MongoDB
```

**Core Events (for integration validation):**
- `post.created` — new post created
- `post.published` — post moved to Published
- `post.updated` — post content/title updated
- `post.deleted` — post soft deleted

### 1. Prerequisites Setup Instructions

#### 1.1 Start RabbitMQ using Docker

```bash
# Start RabbitMQ with management UI
docker run -d --name rabbitmq-dev \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management

# Verify RabbitMQ is running
curl -s http://localhost:15672
# Management UI: http://localhost:15672 (guest/guest)
```

#### 1.2 Start MongoDB for fa-history Service (Docker)

```bash
# Start local MongoDB (no auth)
docker run -d --name mongodb-dev \
  -p 27017:27017 \
  mongo:6

# Connection string used by fa-history: mongodb://localhost:27017/
```

#### 1.3 Configure MySQL for fa-post Service

Ensure MySQL is running and accessible:
```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1;"

# Create database if not exists
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS forum_app;"
```

#### 1.4 Environment Variable Configuration

**fa-post/.env:**
```ini
PORT=3002
DATABASE_NAME=forum_app
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
JWT_SECRET=devsecret

# RabbitMQ Producer
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EVENTS_EXCHANGE=fa.events
RABBITMQ_EVENTS_EXCHANGE_TYPE=topic
```

**fa-history/.env:**
```ini
PORT=3004
JWT_SECRET=devsecret

# MongoDB (Atlas or local)
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=forum_history

# RabbitMQ Consumer
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
EVENTS_EXCHANGE=fa.events
EVENTS_EXCHANGE_TYPE=topic
EVENTS_QUEUE=fa-history.events
EVENTS_ROUTING_KEY=post.*
EVENTS_CONSUMER_ENABLED=true
RABBITMQ_PREFETCH=10
```

### 2. Service Startup Instructions

#### 2.1 Start fa-history Consumer Service

```bash
# Terminal 1: Start fa-history consumer
cd fa-history
pip install -r requirements.txt
python run.py

# Expected output:
# [history-consumer] started. queue=fa-history.events exchange=fa.events rk=post.*
# * Running on http://127.0.0.1:3004
```

#### 2.2 Start fa-post Producer Service

```bash
# Terminal 2: Start fa-post producer
cd fa-post
npm install
npm run dev

# Expected output:
# Database connected.
# [rabbit] connected. exchange=fa.events type=topic
# Post service on :3002
```

#### 2.3 Verify Services are Running

```bash
# Check fa-post health
curl http://localhost:3002/api/posts
# Should return 401 (auth required) - service is running

# Check fa-history health
curl http://localhost:3004/health
# Should return 200 OK

# Check RabbitMQ Management UI
open http://localhost:15672
# Login: guest/guest
# Verify exchange 'fa.events' exists
# Verify queue 'fa-history.events' exists and is bound
```