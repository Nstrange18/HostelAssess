# HostelAssess

HostelAssess is a vanilla HTML/CSS/JavaScript application backed by Node.js, Express, MongoDB, and Mongoose. Students can assess their assigned hostel once per academic session and submit complaints. Administrators can review institution-wide feedback and complaint activity.

## Requirements

- Node.js 20 or newer
- MongoDB locally or a MongoDB Atlas connection

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and replace the sample secrets.
3. Start MongoDB or set `MONGO_URI` to MongoDB Atlas.
4. Run `npm run seed:hostels`.
5. Set the four `ADMIN_*` variables and run `npm run seed:admin` to create the first institution administrator.
6. Run `npm run dev` for the API.
7. Serve `1-frontend` from a local static server on the origin specified by `CLIENT_URL`.

The frontend API URL is centralized in `1-frontend/assets/js/config.js`. Local development uses `http://localhost:5000/api`; deployed pages use `https://hostelassess.onrender.com/api`. A deployment can still define `window.HOSTEL_ASSESS_API_URL` before that file loads to override either value.

## Environment variables

- `PORT`: Express port.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: long random signing secret, at least 24 characters.
- `JWT_EXPIRES_IN`: JWT lifetime, such as `8h`.
- `CLIENT_URL`: comma-separated allowed frontend origins.
- `CURRENT_ACADEMIC_SESSION`: server-owned session in `YYYY/YYYY` format. The years must be consecutive.
- `NODE_ENV`: `development`, `test`, or `production`.

`ADMIN_FIRST_NAME`, `ADMIN_SURNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are read only by the administrator seed command. The command creates or promotes the matching email to the first institution administrator, so it can be rerun safely without creating a duplicate. There is no public administrator registration endpoint.

## Assessment frequency rule

The API assigns the authenticated student, their stored hostel, and `CURRENT_ACADEMIC_SESSION`. The request validator rejects those fields from browsers. MongoDB enforces a unique `{ student, hostel, academicSession }` index, and duplicate submissions return HTTP 409 with code `ASSESSMENT_ALREADY_SUBMITTED`.

## API overview

- `/api/auth`: registration, login, current account
- `/api/hostels`: active hostel list and protected admin management
- `/api/assessments`: student submission/history and protected admin history
- `/api/complaints`: student complaint flow and protected admin status management
- `/api/dashboard`: student and administrator dashboard summaries
- `/api/students`: protected administrator student listing and hostel assignment
- `/api/admins`: institution-admin invitations, hostel reassignment, access revocation, and restoration
- `/api/health`: deployment health check

Responses use `{ success, message, data }`; errors also include a stable `code`.

## Commands

- `npm start`: production API server
- `npm run dev`: API with automatic restart
- `npm run seed:hostels`: idempotently create the initial hostel records
- `npm run seed:admin`: securely create or update the initial administrator
- `npm test`: run backend rule and validation tests

## Deployment

Deploy the repository to Vercel using `vercel.json`, and deploy the same repository to Render with build command `npm install` and start command `npm start`. Configure all backend environment variables in Render and set `CLIENT_URL` to the exact Vercel origin. The static frontend requires no Vercel environment variables. Store `MONGO_URI` and `JWT_SECRET` only in Render environment settings.
