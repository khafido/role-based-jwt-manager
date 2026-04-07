# role-based-jwt-manager

A production-ready **Authentication & Authorization Service** built with a focus on security, type safety, and observability. This project implements a robust JWT-based system with granular Role-Based Access Control (RBAC).

---

## 🚀 Technical Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose (ODM)
* **Security:** JWT (jsonwebtoken), Bcrypt.js, Helmet, Express-Rate-Limit
* **Validation:** Zod (Schema-based validation)
* **Logging:** Winston (Structured JSON logging)

---

## ✨ Key Features

* **Secure Authentication:** Password hashing using `bcrypt` and stateless session management via `JWT`.
* **Granular RBAC:** Flexible middleware supporting multiple roles per route (e.g., `ADMIN`, `MENTOR`, `USER`).
* **Schema Validation:** Strict request body and parameter validation using `Zod` to prevent malformed data.
* **Layered Architecture:** Clear separation of concerns (Controllers, Services, Models, Middlewares).
* **Production Logging:** Multi-level structured logging with `Winston` (Console & File-based).
* **Security First:** Implementation of `Helmet` for HTTP headers and `Rate-Limiting` to prevent brute-force attacks.

---

## 🏗️ Architecture Overview

The project follows a **Layered Architecture** to ensure scalability and maintainability:

1.  **Routes:** Entry points for API requests.
2.  **Middlewares:** Guards for Validation, Authentication, and Role Authorization.
3.  **Controllers:** Handles request parsing and response delivery.
4.  **Services:** Contains the core business logic (e.g., token generation, user creation).
5.  **Models:** Mongoose schemas and data persistence logic.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB Instance (Local or Atlas)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/role-based-jwt-manager.git
    cd role-based-jwt-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/auth-db
    JWT_SECRET=your_super_secret_key
    NODE_ENV=development
    ```

4.  **Run the application:**
    ```bash
    # Development mode
    npm run dev

    # Build and Production mode
    npm run build
    npm start
    ```

---

## 📡 API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create a new user |
| `POST` | `/api/auth/login` | Public | Authenticate and get JWT |
| `GET` | `/api/users/me` | User/Mentor/Admin | Get current user profile |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete a user (Admin only) |

---

## 🛡️ Security Implementation Note

This project utilizes a custom `authorizeRoles(...roles)` middleware factory. It allows for flexible permission checking at the route level:

```typescript
// Example usage:
router.get('/mentor-dashboard', 
  isAuthenticated, 
  authorizeRoles('ADMIN', 'MENTOR'), 
  getDashboardData
);
