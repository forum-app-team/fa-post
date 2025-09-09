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