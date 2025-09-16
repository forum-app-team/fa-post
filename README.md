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
