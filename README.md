# 🌩️ CloudConfig Ops

![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791?style=for-the-badge&logo=postgresql)
![AWS](https://img.shields.io/badge/AWS-Serverless-232F3E?style=for-the-badge&logo=amazonaws)
![Mercurial](https://img.shields.io/badge/Mercurial-SCM-999999?style=for-the-badge&logo=mercurial)

> **Cloud Infrastructure Configuration and Compliance Platform using Mercurial SCM**

CloudConfig Ops is an enterprise-grade configuration management platform designed to prevent server outages and unauthorized changes. It acts as a strict, version-controlled gateway for infrastructure files (like `.env`, `nginx.conf`, and `docker-compose.yml`), ensuring that every change is reviewed, audited, and perfectly synced with live AWS servers.

---

## ✨ Key Features

- 🔒 **Role-Based Access Control (RBAC):** Strict separation of duties between Developers (submit changes), Reviewers (approve changes), and Admins/Ops (manage deployments).
- 📝 **Change Request Pipeline (FCA):** Developers cannot directly edit live servers. All changes must be submitted via a pull-request style workflow and pass a Functional Configuration Audit.
- ⏱️ **Automated Drift Detection (PCA):** An AWS Lambda function scheduled via Amazon EventBridge continuously hashes live server files. If a rogue manual edit occurs on the server, it instantly flags a "Configuration Drift" alert and logs it to DynamoDB.
- ⏪ **One-Click Rollback:** If drift is detected or a bad config is deployed, Admins can instantly rollback to the last known-good Mercurial baseline.
- 📦 **Mercurial SCM Engine:** Powered by Mercurial (`hg`) under the hood, ensuring an immutable version history, baseline tagging, and irrefutable audit trails.

---

## 🏗️ Architecture & Tech Stack

### Frontend (User Interface)
- **React 18 & TypeScript** - Built with Vite
- **Tailwind CSS** - For a premium, dark-mode glassmorphism UI
- **Context API** - For global state management

### Backend (API & SCM Engine)
- **FastAPI (Python)** - High-performance async REST API
- **SQLAlchemy & Asyncpg** - ORM for database management
- **Mercurial** - Core distributed version control engine

### AWS Cloud Infrastructure
- **Amazon EC2 & RDS (PostgreSQL)** - Hosts the application and metadata CMDB.
- **AWS Lambda & EventBridge** - Serverless drift-detection engine.
- **Amazon DynamoDB** - High-speed NoSQL store for baseline hashes and drift events.
- **Amazon SNS & S3** - Alerting and compliance report storage.

---

## 🚀 Local Setup & Installation

### 1. Database Setup
Ensure you have a PostgreSQL database running (or an AWS RDS instance).

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your actual database credentials
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Running the Application
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🎓 Academic Context
This project was developed for the **Software Configuration Management (ISWE403L)** course at Vellore Institute of Technology (VIT). It practically implements core SCM standards including **CMMI Level 2**, **ITIL 4 Change Enablement**, **COBIT BAI10**, and the **SWEBOK** 5 core SCM activities.

**Developer:** Harsh Mishra (24MIS0206)  
**Faculty:** Dr. Senthil Kumar P.
