# Backend Code Freeze Update - 28/06

This document summarizes the architectural updates, routing migrations, and new features introduced in the latest backend sprint. Please review these changes carefully to ensure seamless Frontend (FE) integration.

## 1. Architectural Updates (For Team Awareness)
- **Strict 3-Tier Architecture:** Enforced absolute separation of concerns. Controllers no longer inject Repositories directly. All business logic is routed exclusively through the Service layer.
- **Interface-Implementation Pattern:** Fully adopted the `Service` (Interface) and `ServiceImpl` (Implementation) pattern across the entire codebase to promote decoupling and easier unit testing.
- **Database Schema Modification (`Payment`):** The relationship between the `Payment` entity and `RentalOrder` has been upgraded from `@OneToOne` to `@OneToMany`. This structural change allows a single order to track multiple financial transactions (e.g., the initial `PAYMENT` charge and a subsequent `REFUND`).
- **Standardized API Responses:** All successful API responses and error handlers have been standardized to ensure consistent payload structures for the Frontend to consume.

## 2. API Routing & Auth Refactoring (Action Required for FE)
- **Resource-Based Routing:** Role-based controllers (`AdminController`, `StaffController`, `PublicCatalogController`) were entirely deleted. Endpoints are now logically grouped by resource (e.g., `/api/costumes`, `/api/orders`), relying on Method-Level Security (`@PreAuthorize("hasRole(...)")`) for access control.
- **Authentication Consolidation:** Login, Registration, and Token Refresh endpoints were migrated out of the `/api/users/*` domain. They now reside in the dedicated `/api/auth/*` controller.

## 3. New Features & Endpoints Table (The Core Reference)

### Authentication
| Method | Endpoint Path | Payload / Query Params | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `{ email, password }` | Authenticate user and receive JWT. |
| `POST` | `/api/auth/register` | `{ email, password, fullName, phone }` | Register a new customer. |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` | Generate a new access token. |
| `POST` | `/api/auth/verify-otp` | `{ email, otp }` | Verify OTP for account activation/recovery. |
| `POST` | `/api/auth/resend-otp` | `{ email }` | Resend OTP to user's email. |

### Catalog (Public & Admin)
| Method | Endpoint Path | Payload / Query Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/costumes` | `?page, size, categoryId, search...` | Fetch paginated list of costumes (Public). |
| `GET` | `/api/costumes/{id}` | - | Fetch costume details (Public). |
| `POST` | `/api/costumes` | `CostumeRequestDTO` | Create a new costume (Admin). |
| `PUT` | `/api/costumes/{id}` | `CostumeRequestDTO` | Update an existing costume (Admin). |
| `DELETE`| `/api/costumes/{id}` | - | Delete a costume (Admin). |
| `GET` | `/api/categories` | - | Fetch all categories (Public). |

### Order Management & Handover
| Method | Endpoint Path | Payload / Query Params | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | `CheckoutRequestDTO` | Create a new rental order (Customer). |
| `GET` | `/api/orders` | - | Fetch order history for the logged-in user. |
| `PUT` | `/api/orders/{orderId}/cancel` | - | Cancel a `PENDING` or `CONFIRMED` order (Customer). |
| `GET` | `/api/orders/management` | `?status...` | Fetch all orders for management (Staff/Admin). |
| `GET` | `/api/orders/management/{id}` | - | Fetch detailed order info with handover records. |
| `POST` | `/api/orders/{orderId}/pickup-handovers` | `PickupRequestDTO` | Process staff pickup handover (Staff). |
| `POST` | `/api/orders/{orderId}/return-handovers` | `ReturnRequestDTO` | Process staff return handover + refund (Staff). |

### Analytics (Admin Dashboard)
| Method | Endpoint Path | Payload / Query Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/metrics` | - | Fetch high-level KPIs (Revenue, Users, etc). |
| `GET` | `/api/analytics/revenue-chart` | `?startDate, endDate` | Fetch daily revenue coordinates. |
| `GET` | `/api/analytics/top-costumes` | `?limit=5` | Fetch top-performing costumes by rental days. |

## 4. Notes for Frontend Integration
- **Handover Payload Restructure:** The Staff Handover API no longer accepts a single item payload. It now requires an order-level array of item assessments (`PickupRequestDTO` and `ReturnRequestDTO` containing `ItemAssessmentDTO`s) to support bulk operational workflows efficiently.
- **Automated Refund Logic:** When a customer cancels a paid order (`PUT /api/orders/{orderId}/cancel`) or when staff processes a return (`POST /api/orders/{orderId}/return-handovers`), the backend automatically calculates deductions (for `DAMAGED` or `LOST` items) and generates a `REFUND` payment record. The FE does not need to calculate refunds manually; simply trigger the endpoint and refresh the order state.
