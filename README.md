# In-House-Goal-Setting-Tracking-Portal
A full-stack web application built to streamline organizational goal management, employee performance tracking, and quarterly review processes. This portal enables employees, managers, and HR/admin teams to collaboratively manage the complete lifecycle of goals — from creation and approval to achievement tracking and analytics.

🚀 Features
👨‍💼 Employee Module
Create and submit goal sheets
Define goals with:
Thrust Area
Goal Title & Description
Unit of Measurement (Numeric, %, Timeline, Zero-based)
Targets & Weightage
Quarterly achievement updates
Progress status tracking:
Not Started
On Track
Completed
View locked goals after manager approval
👨‍💻 Manager Module
Review and approve employee goals
Edit targets and weightage during approval workflow
Return goals for rework
Conduct quarterly check-ins
Add structured feedback/comments
Monitor planned vs actual achievement progress
🛠️ Admin / HR Module
Manage goal cycles and organizational hierarchy
Unlock approved goals when required
Monitor completion rates across teams
Track audit logs and goal modifications
Push shared departmental goals to multiple employees
✅ Validation Rules Implemented
Total goal weightage must equal 100%
Minimum weightage per goal: 10%
Maximum goals per employee: 8
Approved goals become locked from further edits
📊 Progress Tracking System

The portal automatically computes progress scores based on the selected Unit of Measurement (UoM):

Min Type: Achievement ÷ Target
Max Type: Target ÷ Achievement
Timeline: Completion date vs deadline
Zero Type: 100% if value is 0, otherwise 0%
📈 Reporting & Analytics
Achievement reports (CSV/Excel export)
Real-time completion dashboards
Quarterly check-in tracking
Audit trail for goal modifications
Goal distribution and progress analytics
🔐 Role-Based Access Control

The system supports three distinct user roles:

Employee
Manager (L1)
Admin / HR

Each role has dedicated permissions and workflows for secure and organized management.
