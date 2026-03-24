# BizPulse---Intelligent-SME-Business-Health-Platform

BizPulse is an AI-powered financial dashboard for SMEs that transforms complex data into real-time, actionable insights for smarter cash flow management.

**BizPulse** is a premium, AI-enhanced financial dashboard designed to give small business owners complete visibility into their financial performance. Built with modern web technologies, it transforms complex financial data into intuitive, real-time visualizations.

---

##  Architecture Diagram

BizPulse operates on a modern, decoupled architecture allowing for high scalability. The frontend consists of a Single Page Application (SPA) built with Vanilla Javascript and Tailwind CSS, while the backend is an asynchronous Python API.

```mermaid
graph TD
    User([Standard User / Admin]) -->|HTTP & AJAX| Frontend
    
    subgraph "Frontend Layer (Vanilla JS, HTML5, Tailwind CSS, Chart.js)"
        Frontend[Web Dashboard UI]
        AuthUI[User Auth UI]
        Frontend --> AuthUI
    end
    
    subgraph "Reverse Proxy"
        Proxy[Nginx - Port 80]
    end
    
    Frontend -->|API Requests| Proxy
    
    subgraph "Backend Layer (FastAPI, Python)"
        API[FastAPI Endpoints]
        Auth[JWT Authentication & Bcrypt]
        CRUD[Data Manipulation]
        API --> Auth
        API --> CRUD
    end
    
    Proxy -->|Reverse Proxy /transactions & /auth| API
    
    subgraph "Data Layer (SQLAlchemy)"
        DB[(MySQL / SQLite)]
    end
    
    CRUD --> DB
```

---

##  Installation & Standard Setup

We provide two distinct methods to launch BizPulse depending on your environment.

### Option A: Local Development (Fastest)
Because the frontend is built entirely with Vanilla Web Technologies, no Node.js compilation step is required!

1. **Clone the repository** to your local machine.
2. **Start the Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
3. **Start the Frontend**: Simply open `login.html` or `index.html` in your web browser. No compilation is necessary!

### Option B: Docker Compose (Production Ready)
1. Ensure Docker Desktop or Docker Engine is installed natively on your hosting provider.
2. Rename `.env.example` to `.env` and fill in secure credentials (like `SECRET_KEY`).
3. Run the orchestration:
   ```bash
   docker-compose up -d --build
   ```
4. Access the fully reverse-proxied application at `http://localhost`.

---

## 📖 API Documentation

The backend is powered by FastAPI. When running locally, full interactive Swagger API documentation is automatically generated and accessible at `http://localhost:8000/docs`.

### Authentication Endpoints
All protected endpoints require the `Authorization` header with a Bearer token: `Authorization: Bearer <token>`

* **`POST /auth/register`**
  * **Payload**: `{"email": "...", "full_name": "...", "password": "...", "role": "user"}`
  * **Response**: `201 Created` with User object (password securely omitted).
* **`POST /auth/login`**
  * **Type**: `application/x-www-form-urlencoded`
  * **Payload**: `username=email@domain.com&password=secret`
  * **Response**: `200 OK` `{"access_token": "eyJhb...", "token_type": "bearer", "user": ...}`

### Transaction Endpoints (Protected)
* **`GET /transactions/`**: Retrieves all workspace transactions belonging to the company.
* **`POST /transactions/`**: Creates a new transaction.
  * **Payload**: `{"name": "Office Supplies", "category": "Operations", "amount": 250.50, "date": "2026-03-24", "is_positive": false}`
* **`PUT /transactions/{id}`**: Updates existing fields dynamically.
* **`DELETE /transactions/{id}`** *(Requires Admin Role)*: Permanently deletes a record. Returns `204 No Content`.

---

## User Manual

### 1. Registration & Secure Login
1. Navigate to `login.html` in your browser.
2. Switch to the **Register** tab to create an Administrator account. Note: You must select "Admin" to be able to delete data later.
3. Upon successful creation, you will instantly be authenticated via JWT and routed securely to the dashboard.

*![Login Screen Placeholder](docs/screenshots/login_demo.png)*

### 2. Dashboard Overview
1. The top metrics grid immediately calculates total revenue, expenses, and net profit based on your database payload. It accurately assigns red or green status colors based on cash positioning.
2. The primary line chart (powered by Chart.js) visualizes historical cash flow trends dynamically.
3. The AI Insights panel parses trends to offer warnings (e.g. Budget overreaches) or positive assurances.

*![Dashboard Overview Placeholder](docs/screenshots/dashboard_demo.png)*

### 3. Adding a Transaction
1. Click the **+ Add Entry** button in the top right.
2. A glassmorphic Tailwind modal will appear. Input the name, amount, category, and date. Check the explicit sub-box if it is considered *Inflow/Revenue*.
3. Click **Save Entry**. The table and charts will update synchronously.

### 4. Editing & Deleting a Transaction
1. Hover your mouse over any row in the **All Transactions** table. Contextual action buttons will gracefully fade in.
2. Clicking **Edit** brings the Tailwind Modal back up, completely pre-filled with the database data.
3. If you are an Admin, clicking the red **Trash Can** icon triggers a secure SweetAlert confirmation. Pressing "Yes" destroys the record on the Python Backend.

---

##  Future Enhancements

* **Plaid Bank Integration**: Implement the Plaid Auth API to securely pull real-time, live transaction tracking from SME checking accounts without manual user entry.
* **Predictive ML Engine**: Swap the mock AI Insights panel with a live LLM processing flow (e.g. Google Gemini Pro) alongside a Scikit-Learn timeseries model to calculate dynamic financial runway estimations.
* **Accounting Export Layer**: Enable 1-click PDF Generation and CSV statement formulation for seamless uploading into TurboTax or QuickBooks.
* **Multi-Workspace Support**: Allow a single accountant or user to govern multiple entirely segmented sub-businesses within one BizPulse login structure.
