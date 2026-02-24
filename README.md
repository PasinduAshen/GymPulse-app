# GymPulse-app

📌 **Project Overview**
GymPulse-app is a full-stack web application designed to manage exercise machine. This is a university Agile team project built with Spring Boot (Java), React (JavaScript), and MySQL (Database).

---

🏗️ **Tech Stack**
- **Backend:** Spring Boot 4.0.3 (Java 21, Maven)
- **Frontend:** React (Node.js, npm)
- **Database:** MySQL
- **Version Control:** Git + GitHub
- **Workflow:** Agile (Scrum, sprint-based development)

---

📂 **Project Structure**
```
GymPulse-app/
├── backend/                # Spring Boot backend
│   └── src/main/java/.../
│       ├── controller/     # Handles incoming API requests
│       ├── service/        # Contains business logic
│       ├── dto/            # Data Transfer Objects (API response/request shapes)
│       ├── model/          # Database entities (JPA models)
│       ├── repository/     # Database access (CRUD operations)
│       └── config/         # Application configuration files
│   └── pom.xml
├── frontend/               # React frontend
│   └── src/
│       ├── components/     # Small, reusable UI components
│       ├── pages/          # Full page components representing routes
│       ├── services/       # API call logic (Axios/Fetch interactions)
│       ├── dto/            # Type definitions/interfaces for data objects
│       └── assets/         # Images, fonts, and static resources
│   └── package.json
├── database/               # SQL scripts (schema + seed data)
│   └── schema.sql
│   └── data.sql
├── README.md
└── .gitignore
```

---

⚙️ **Setup Instructions**

1. **Clone the Repository**
   ```bash
   git clone <repo-url>
   cd GymPulse-app
   ```

2. **Backend (Spring Boot)**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```
   Backend runs at: `http://localhost:8080`

3. **Frontend (React)**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs at: `http://localhost:3000`

4. **Database (MySQL)**
   ```sql
   CREATE DATABASE gympulse;
   USE gympulse;
   SOURCE database/schema.sql;
   SOURCE database/data.sql;
   ```
   Configure database connection in `backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/gympulse
   spring.datasource.username=root
   spring.datasource.password=yourpassword
   spring.jpa.hibernate.ddl-auto=update
   ```

---

🔀 **Git Workflow**
- `main` → stable release branch
- `dev` → active sprint development
- `feature/` → individual feature branches

**Example Workflow:**
1. `git checkout -b feature/login`
2. *work on code*
3. `git add .`
4. `git commit -m "Implement login feature"`
5. `git push origin feature/login`
6. Open a Pull Request → merge into `dev` → sprint end merge `dev` → `main`.

---

📌 **Contribution Guidelines**
- Always pull latest changes before starting work: `git pull origin dev`
- Use meaningful commit messages.
- Keep code modular and documented.
- Follow Agile sprint tasks and user stories.

---

📝 **Git Cheatsheet**

### Branch Management
- **Create and switch to a new branch:**
  ```bash
  git checkout -b feature/your-feature-name
  ```
- **Switch back to dev:**
  ```bash
  git checkout dev
  ```
- **Update your local dev branch:**
  ```bash
  git pull origin dev
  ```

### Saving Changes
- **Check status:**
  ```bash
  git status
  ```
- **Stage changes:**
  ```bash
  git add .
  ```
- **Commit changes:**
  ```bash
  git commit -m "Brief description of changes"
  ```

### Pushing to GitHub
- **Push your feature branch:**
  ```bash
  git push origin feature/your-feature-name
  ```

### Undoing Mistakes
- **Discard local changes in a file:**
  ```bash
  git checkout -- filename
  ```
- **Undo last commit (keep changes):**
  ```bash
  git reset --soft HEAD~1
  ```
