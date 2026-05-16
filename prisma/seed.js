const Database = require("better-sqlite3");
const path = require("path");
const bcryptjs = require("bcryptjs");
const { randomBytes } = require("crypto");

const dbPath = path.resolve(__dirname, "dev.db");
const db = new Database(dbPath);

function cuid() {
  return "c" + randomBytes(16).toString("hex");
}

function now() {
  return new Date().toISOString();
}

// Get or create department
let dept = db.prepare("SELECT * FROM Department WHERE name = ?").get("Engineering");
if (!dept) {
  const id = cuid();
  db.prepare("INSERT INTO Department (id, name) VALUES (?, ?)").run(id, "Engineering");
  dept = { id };
} 

// Create Admin
let admin = db.prepare("SELECT * FROM User WHERE email = ?").get("admin@company.com");
if (!admin) {
  db.prepare(`INSERT INTO User (id, name, email, password, role, departmentId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    cuid(), "Admin User", "admin@company.com",
    bcryptjs.hashSync("admin123", 10), "ADMIN", dept.id, now(), now()
  );
}

// Create Manager
let manager = db.prepare("SELECT * FROM User WHERE email = ?").get("manager@company.com");
if (!manager) {
  const id = cuid();
  db.prepare(`INSERT INTO User (id, name, email, password, role, departmentId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, "Manager User", "manager@company.com",
    bcryptjs.hashSync("manager123", 10), "MANAGER", dept.id, now(), now()
  );
  manager = { id };
} 

// Create Employee
let employee = db.prepare("SELECT * FROM User WHERE email = ?").get("employee@company.com");
if (!employee) {
  db.prepare(`INSERT INTO User (id, name, email, password, role, departmentId, managerId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    cuid(), "Employee User", "employee@company.com",
    bcryptjs.hashSync("employee123", 10), "EMPLOYEE", dept.id, manager.id, now(), now()
  );
}

console.log("✅ Seed complete");
console.log("👤 admin@company.com / admin123");
console.log("👤 manager@company.com / manager123");
console.log("👤 employee@company.com / employee123");

db.close();