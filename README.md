# Contributing Guidelinesd

Welcome to the project. This document outlines the development workflow, role responsibilities, and strict rules for contributing.

## 1. Project Structure
This is a Monorepo containing both the backend and frontend.
* **backend/**: Express (Javascript, will be changed to typescript)
* **frontend/**: React (TypeScript/Vite)
* **.env**: Contains secrets. Never commit this file.

## 2. Roles and Permissions

We follow a strict role-based hierarchy.

* **Maintainers (3rd Years):**
    * Role: Admin / Code Reviewer.
    * Responsibilities: Reviewing PRs, requesting changes, and merging code to `main`.
    * **Only Maintainers can merge Pull Requests.**

* **Developers (2nd Years):**
    * Role: Core Contributor.
    * Access: Write access to the repository.
    * Restrictions: You cannot push directly to `main`. You must submit a Pull Request. You cannot merge your own PRs.
    * How Tos: Make a New branch and commit your feature there and open a pull request to the main.

* **Apprentices (1st Years):**
    * Role: Learner / Contributor.
    * Access: Read-only.
    * Workflow: You must **Fork** the repository, push changes to your fork, and submit a Pull Request from there.

## 3. Development Workflow

### Step 1: Pick a Task
Check the "Issues" tab. If you want to work on something new, create an Issue first to get approval from a Maintainer.

### Step 2: Create a Branch
**Never** work on the `main` branch. Create a new branch for every feature or fix.

**Naming Convention:**
* `feat/short-description` (e.g., `feat/login-page`)
* `fix/short-description` (e.g., `fix/navbar-spacing`)
* `docs/short-description` (e.g., `docs/update-readme`)

### Step 3: Commits
* Write clear, descriptive commit messages.
* Example: `Added login form validation` (Not: `fixed code`).

### Step 4: Pull Request (PR)
1.  Push your branch to the repository (or your fork).
2.  Open a Pull Request against `main`.
3.  Link the PR to the Issue it solves.
4.  **Wait for Review.**

## 4. The Rules of Conduct (Strict)

Violating these rules may result in removal from the repository.

1.  **Do Not Dismiss Reviews:** If a Maintainer requests changes, do not dismiss their review. Fix the code and request a re-review.
2.  **No "Sneaky" Commits:** Do not push new code *after* receiving an approval to try and bypass review. If you push after approval, you must notify a Maintainer to review the new changes.
3.  **Do Not Merge Your Own PR:** Even if you have the button, wait for a Maintainer to merge it.
4.  **Secrets:** Never commit API keys, database passwords, or credentials. Use `.env`.

## 5. Local Setup
1.  Clone the repository.
2.  Create a `.env` file in the root using the provided template.
3.  Run `docker-compose up` to start the database and backend (if applicable).
4.  Navigate to `frontend/` and run `npm install` followed by `npm run dev`.
